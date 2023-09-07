let fetch;
(async () => {
    fetch = (await import('node-fetch')).default;
})();
const tunnel = require('tunnel');
const crypto = require('crypto');
const database = require('./database');
const {PROXY, MALODY, CACHE_TIME} = require('../global.config');

const LOGIN_URL = "https://m.mugzone.net/cgi/login";
const CHECK_URL = "https://m.mugzone.net/cgi/check";
const PROFILE_URL = "https://m.mugzone.net/cgi/profile_detail"; // ?lang=1&to_uid=178813&t=1693664971&key=x&uid=178813

const agent = PROXY && tunnel.httpsOverHttp({
    proxy: PROXY,
});


/**
 * 获取登录Token
 *
 * @param username
 * @param password
 * @returns {Promise<*>}
 */
async function getLoginToken(username, password) {
    let md5Password = crypto.createHash('md5').update(password).digest('hex');

    let response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `name=${username}&psw=${md5Password}&v=262919&h=0_0`,
        agent
    });
    let json = await response.json();
    if (json.code !== 0) {
        console.log(json);
        throw new Error("Login failed");
    }
    return json.data;
}


/**
 * 校验登录Token
 *
 * @param token
 * @param uid
 * @returns {Promise<*>}
 */
async function checkLoginToken(token, uid) {
    let response = await fetch(CHECK_URL + `?key=${token}&uid=${uid}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "",
        agent
    });
    let json = await response.json();
    if (json.code !== 0) throw new Error("Token Invalid");
    return json.data;
}


/**
 * 获取用户信息
 *
 * @param toUid
 * @param token
 * @param uid
 * @returns {Promise<*>}
 */
async function getUserProfile(toUid, token, uid) {
    let response = await fetch(PROFILE_URL + `?lang=1&to_uid=${toUid}&t=${(Date.now() / 1000).toFixed(0)}&key=${token}&uid=${uid}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        agent
    });
    let json = await response.json();
    if (json.code !== 0) throw new Error("Failed to get user profile, code " + json.code.toString());
    return json.data;
}


async function getUserProfileCache(uid, retry = 0) {
    if (retry > 3) throw new Error("Retry too many times");

    let profileCache = await database.getCachedProfile(uid);
    if (profileCache && Date.now() - profileCache.time < CACHE_TIME) {
        return {
            cached: true,
            profile: profileCache.profile
        };
    }
    const fromUID = MALODY.uid;
    const cache = await database.getCachedToken(fromUID);

    if (!cache || retry) {
        const {key} = await getLoginToken(MALODY.username, MALODY.password);
        database.setCachedToken(fromUID, key).catch(console.error);
        profileCache = await getUserProfile(uid, key, fromUID);
        database.setCachedProfile(uid, profileCache).catch(console.error);
        return {
            cached: false,
            profile: profileCache
        };
    }
    const {token} = cache;
    try {
        profileCache = await getUserProfile(uid, token, fromUID);
        database.setCachedProfile(uid, profileCache).catch(console.error);
        return {
            cached: false,
            profile: profileCache
        };
    } catch (e) {
        console.error(e);
        return getUserProfileCache(uid, retry + 1);
    }
}


module.exports = {
    getLoginToken,
    checkLoginToken,
    getUserProfile,
    getUserProfileCache
};
