let fetchPromise;
const tunnel = require('tunnel');
const database = require('./database');
const {PROXY, CACHE_TIME} = require('../global.config');

const WEB_V2_EXPERIMENTAL_PROVIDER = 'web-v2-experimental';
const GUEST_SESSION_CACHE_KEY = 'guest-session';
const GUEST_AUTH_URL = 'https://api.mugzone.net/api/web/auth/guest/wt';
const PLAYER_INFO_URL = 'https://api.mugzone.net/api/player/info';
const PLAYER_RANKING_URL = 'https://api.mugzone.net/api/ranking/player/all';

const agent = PROXY && tunnel.httpsOverHttp({
    proxy: PROXY,
});

async function getFetch() {
    if (!fetchPromise) {
        fetchPromise = import('node-fetch').then(module => module.default);
    }
    return fetchPromise;
}

function buildPlayerAvatarUrl(avatar) {
    if (!avatar) return null;
    return `https://cni.machart.top/avatar/${avatar}!avatar64`;
}

function normalizeRankingEntry(entry = {}) {
    return {
        acc: Number(entry.acc) || 0,
        rank: Number(entry.rank) || 0,
        plat: 0,
        pc: Number(entry.pc) || 0,
        mode: Number(entry.mode) || 0,
        exp: Number(entry.grade) || 0,
        combo: Number(entry.combo) || 0,
        level: Number(entry.level) || 0,
        grade: Number(entry.grade) || 0,
        gradeRank: Number(entry.gradeRank) || 0
    };
}

function normalizeWebV2Profile(playerInfo = {}, ranking = []) {
    return {
        record: ranking.map(normalizeRankingEntry),
        meta: {
            gold: Number(playerInfo.gold) || 0,
            cout: Number(playerInfo.area) || 0,
            id: Number(playerInfo.uid) || playerInfo.uid,
            gen: Number(playerInfo.gender) || 0,
            name: playerInfo.username || '',
            avatarUrl: buildPlayerAvatarUrl(playerInfo.avatar),
            source: WEB_V2_EXPERIMENTAL_PROVIDER
        },
        achi: [],
        puzz: []
    };
}

async function requestJson(url, fetchImpl) {
    const fetch = fetchImpl || await getFetch();
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Accept: 'application/json'
        },
        agent
    });

    if (typeof response.json !== 'function') {
        throw new Error(`Invalid JSON response from ${url}`);
    }

    const payload = await response.json();

    if ('ok' in response && !response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    return payload;
}

async function getGuestSession(fetchImpl) {
    const json = await requestJson(GUEST_AUTH_URL, fetchImpl);
    if (json.code !== 0 || !json.uid || !json.key) {
        throw new Error(`Failed to get guest session, code ${json.code}`);
    }

    return {
        uid: String(json.uid),
        key: json.key
    };
}

function buildAuthenticatedUrl(baseUrl, toUid, session) {
    const search = new URLSearchParams({
        touid: String(toUid),
        uid: String(session.uid),
        key: session.key
    });
    return `${baseUrl}?${search.toString()}`;
}

async function getPlayerInfo(toUid, session, fetchImpl) {
    const json = await requestJson(buildAuthenticatedUrl(PLAYER_INFO_URL, toUid, session), fetchImpl);
    if (json.code !== 0) {
        throw new Error(`Failed to get player info, code ${json.code}`);
    }
    return json;
}

async function getPlayerRanking(toUid, session, fetchImpl) {
    const json = await requestJson(buildAuthenticatedUrl(PLAYER_RANKING_URL, toUid, session), fetchImpl);
    if (json.code !== 0) {
        throw new Error(`Failed to get player ranking, code ${json.code}`);
    }
    return Array.isArray(json.data) ? json.data : [];
}

function createWebV2Client(options = {}) {
    const store = options.database || database;
    const fetchImpl = options.fetchImpl;
    const cacheTime = options.cacheTime || CACHE_TIME;
    const now = options.now || Date.now;

    async function getCachedGuestSession() {
        const sessionDoc = await store.getCachedToken(GUEST_SESSION_CACHE_KEY, WEB_V2_EXPERIMENTAL_PROVIDER);
        return sessionDoc ? sessionDoc.token : null;
    }

    async function refreshGuestSession() {
        const session = await getGuestSession(fetchImpl);
        await store.setCachedToken(GUEST_SESSION_CACHE_KEY, session, WEB_V2_EXPERIMENTAL_PROVIDER);
        return session;
    }

    async function loadGuestSession(forceRefresh = false) {
        if (!forceRefresh) {
            const cachedSession = await getCachedGuestSession();
            if (cachedSession && cachedSession.uid && cachedSession.key) {
                return cachedSession;
            }
        }

        return refreshGuestSession();
    }

    async function loadFreshProfile(uid, retry = 0) {
        const session = await loadGuestSession(retry > 0);

        try {
            const [playerInfo, ranking] = await Promise.all([
                getPlayerInfo(uid, session, fetchImpl),
                getPlayerRanking(uid, session, fetchImpl)
            ]);
            const profile = normalizeWebV2Profile(playerInfo, ranking);
            await store.setCachedProfile(uid, profile, WEB_V2_EXPERIMENTAL_PROVIDER);
            return {
                cached: false,
                experimental: true,
                provider: WEB_V2_EXPERIMENTAL_PROVIDER,
                profile
            };
        } catch (error) {
            if (retry >= 1) {
                throw error;
            }

            return loadFreshProfile(uid, retry + 1);
        }
    }

    async function getUserProfileCache(uid) {
        const cachedProfile = await store.getCachedProfile(uid, WEB_V2_EXPERIMENTAL_PROVIDER);
        if (cachedProfile && now() - cachedProfile.time < cacheTime) {
            return {
                cached: true,
                experimental: true,
                provider: WEB_V2_EXPERIMENTAL_PROVIDER,
                profile: cachedProfile.profile
            };
        }

        return loadFreshProfile(uid);
    }

    return {
        getGuestSession: () => getGuestSession(fetchImpl),
        getPlayerInfo: (uid, session) => getPlayerInfo(uid, session, fetchImpl),
        getPlayerRanking: (uid, session) => getPlayerRanking(uid, session, fetchImpl),
        getUserProfileCache,
    };
}

const defaultClient = createWebV2Client();

module.exports = {
    WEB_V2_EXPERIMENTAL_PROVIDER,
    GUEST_SESSION_CACHE_KEY,
    GUEST_AUTH_URL,
    PLAYER_INFO_URL,
    PLAYER_RANKING_URL,
    buildPlayerAvatarUrl,
    normalizeWebV2Profile,
    createWebV2Client,
    getGuestSession: defaultClient.getGuestSession,
    getPlayerInfo: defaultClient.getPlayerInfo,
    getPlayerRanking: defaultClient.getPlayerRanking,
    getUserProfileCache: defaultClient.getUserProfileCache
};
