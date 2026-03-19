const test = require('node:test');
const assert = require('node:assert/strict');

const {createDatabaseStore} = require('../utils/database');
const {
    GUEST_AUTH_URL,
    PLAYER_INFO_URL,
    PLAYER_RANKING_URL,
    WEB_V2_EXPERIMENTAL_PROVIDER,
    buildPlayerAvatarUrl,
    createWebV2Client,
    normalizeWebV2Profile
} = require('../utils/malody-web-v2');

function createJsonResponse(payload, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        async json() {
            return payload;
        }
    };
}

test('normalizeWebV2Profile converts the new API shape to the legacy card shape', () => {
    const profile = normalizeWebV2Profile(
        {
            uid: 178813,
            username: 'vvbbnn00',
            area: 8,
            gender: 1,
            gold: 174498,
            avatar: '178813?time=1642939557'
        },
        [
            {
                mode: 0,
                rank: 1853,
                level: 48,
                pc: 2237,
                acc: 93.2057519809015,
                combo: 1864,
                grade: 6506,
                gradeRank: 7406
            }
        ]
    );

    assert.deepEqual(profile, {
        record: [
            {
                acc: 93.2057519809015,
                rank: 1853,
                plat: 0,
                pc: 2237,
                mode: 0,
                exp: 6506,
                combo: 1864,
                level: 48,
                grade: 6506,
                gradeRank: 7406
            }
        ],
        meta: {
            gold: 174498,
            cout: 8,
            id: 178813,
            gen: 1,
            name: 'vvbbnn00',
            avatarUrl: buildPlayerAvatarUrl('178813?time=1642939557'),
            source: WEB_V2_EXPERIMENTAL_PROVIDER
        },
        achi: [],
        puzz: []
    });
});

test('web v2 client caches normalized profiles and reuses the guest session', async () => {
    const store = createDatabaseStore({inMemoryOnly: true});
    const calls = [];
    const fetchImpl = async (url) => {
        calls.push(url);

        if (url === GUEST_AUTH_URL) {
            return createJsonResponse({code: 0, uid: 1, key: 'guest-key'});
        }
        if (url.startsWith(PLAYER_INFO_URL)) {
            const touid = new URL(url).searchParams.get('touid');
            return createJsonResponse({
                code: 0,
                uid: Number(touid),
                area: touid === '178813' ? 8 : 0,
                gender: 1,
                gold: touid === '178813' ? 174498 : 5517,
                avatar: touid === '178813' ? '178813?time=1642939557' : '',
                username: touid === '178813' ? 'vvbbnn00' : 'malimble'
            });
        }
        if (url.startsWith(PLAYER_RANKING_URL)) {
            const touid = new URL(url).searchParams.get('touid');
            return createJsonResponse({
                code: 0,
                data: touid === '178813'
                    ? [{mode: 0, rank: 1853, level: 48, pc: 2237, acc: 93.2057519809015, combo: 1864, grade: 6506, gradeRank: 7406}]
                    : [{mode: 0, rank: 120890, level: 20, pc: 43, acc: 95.1679531570013, combo: 1725, grade: 0, gradeRank: 188926}]
            });
        }

        throw new Error(`Unexpected URL: ${url}`);
    };

    const client = createWebV2Client({
        database: store,
        fetchImpl
    });

    const firstProfile = await client.getUserProfileCache('178813');
    const secondProfile = await client.getUserProfileCache('178813');
    const otherProfile = await client.getUserProfileCache('549612');

    assert.equal(firstProfile.cached, false);
    assert.equal(firstProfile.experimental, true);
    assert.equal(firstProfile.provider, WEB_V2_EXPERIMENTAL_PROVIDER);
    assert.equal(firstProfile.profile.meta.name, 'vvbbnn00');
    assert.equal(firstProfile.profile.meta.avatarUrl, buildPlayerAvatarUrl('178813?time=1642939557'));

    assert.equal(secondProfile.cached, true);
    assert.equal(secondProfile.profile.meta.name, 'vvbbnn00');

    assert.equal(otherProfile.cached, false);
    assert.equal(otherProfile.profile.meta.name, 'malimble');

    assert.equal(calls.filter(url => url === GUEST_AUTH_URL).length, 1);
    assert.equal(calls.filter(url => url.startsWith(PLAYER_INFO_URL)).length, 2);
    assert.equal(calls.filter(url => url.startsWith(PLAYER_RANKING_URL)).length, 2);
});
