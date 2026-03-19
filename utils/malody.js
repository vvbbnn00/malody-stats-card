let fetchPromise;
const tunnel = require('tunnel');
const crypto = require('crypto');
const database = require('./database');
const {
    getUserProfileCache: getExperimentalUserProfileCache,
    WEB_V2_EXPERIMENTAL_PROVIDER
} = require('./malody-web-v2');
const {PROXY, MALODY, CACHE_TIME} = require('../global.config');

const DEFAULT_PROVIDER = 'legacy';
const SUPPORTED_PROVIDERS = [DEFAULT_PROVIDER, WEB_V2_EXPERIMENTAL_PROVIDER];

const LOGIN_URL = "https://m.mugzone.net/cgi/login";
const CHECK_URL = "https://m.mugzone.net/cgi/check";
const PROFILE_URL = "https://m.mugzone.net/cgi/profile_detail"; // ?lang=1&to_uid=178813&t=1693664971&key=x&uid=178813

const agent = PROXY && tunnel.httpsOverHttp({
    proxy: PROXY,
});

async function getFetch() {
    if (!fetchPromise) {
        fetchPromise = import('node-fetch').then(module => module.default);
    }
    return fetchPromise;
}

function assertMalodyCredentials() {
    const missing = ['uid', 'username', 'password'].filter(field => !MALODY[field]);
    if (missing.length) {
        throw new Error(`Missing Malody credentials: ${missing.join(', ')}`);
    }
}


/**
 * 获取登录Token
 *
 * @param username
 * @param password
 * @returns {Promise<*>}
 */
async function getLoginToken(username, password) {
    const fetch = await getFetch();
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
    const fetch = await getFetch();
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
    const fetch = await getFetch();
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


async function getLegacyUserProfileCache(uid, retry = 0) {
    if (retry > 3) throw new Error("Retry too many times");

    let profileCache = await database.getCachedProfile(uid, DEFAULT_PROVIDER);
    if (profileCache && Date.now() - profileCache.time < CACHE_TIME) {
        return {
            cached: true,
            profile: profileCache.profile
        };
    }
    assertMalodyCredentials();
    const fromUID = MALODY.uid;
    const cache = await database.getCachedToken(fromUID, DEFAULT_PROVIDER);

    if (!cache || retry) {
        const {key} = await getLoginToken(MALODY.username, MALODY.password);
        database.setCachedToken(fromUID, key, DEFAULT_PROVIDER).catch(console.error);
        profileCache = await getUserProfile(uid, key, fromUID);
        database.setCachedProfile(uid, profileCache, DEFAULT_PROVIDER).catch(console.error);
        return {
            cached: false,
            profile: profileCache
        };
    }
    const {token} = cache;
    try {
        profileCache = await getUserProfile(uid, token, fromUID);
        database.setCachedProfile(uid, profileCache, DEFAULT_PROVIDER).catch(console.error);
        return {
            cached: false,
            profile: profileCache
        };
    } catch (e) {
        console.error(e);
        return getLegacyUserProfileCache(uid, retry + 1);
    }
}

async function getUserProfileCache(uid, options = {}) {
    if (typeof options === 'number') {
        return getLegacyUserProfileCache(uid, options);
    }

    const provider = options.provider || DEFAULT_PROVIDER;
    if (provider === DEFAULT_PROVIDER) {
        return getLegacyUserProfileCache(uid, 0);
    }
    if (provider === WEB_V2_EXPERIMENTAL_PROVIDER) {
        return getExperimentalUserProfileCache(uid);
    }

    throw new Error(`Unsupported provider: ${provider}`);
}

module.exports = {
    DEFAULT_PROVIDER,
    SUPPORTED_PROVIDERS,
    WEB_V2_EXPERIMENTAL_PROVIDER,
    getLoginToken,
    checkLoginToken,
    getUserProfile,
    getLegacyUserProfileCache,
    getUserProfileCache
};
