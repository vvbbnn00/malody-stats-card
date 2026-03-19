const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const {createRouter} = require('../routes/index');

function createApp(deps) {
    const app = express();
    app.use('/', createRouter(deps));
    return app;
}

test('GET / redirects to GitHub repository', async () => {
    const app = createApp();
    const response = await request(app).get('/');

    assert.equal(response.status, 302);
    assert.equal(response.headers.location, 'https://github.com/vvbbnn00/malody-stats-card');
});

test('GET /profile rejects invalid uid', async () => {
    const app = createApp();
    const response = await request(app).get('/profile').query({uid: 'abc'});

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
        code: 400,
        message: 'Invalid uid'
    });
});

test('GET /profile returns wrapped profile payload', async () => {
    const profile = {cached: true, profile: {meta: {id: 178813}}};
    const app = createApp({
        getUserProfileCache: async uid => {
            assert.equal(uid, '178813');
            return profile;
        }
    });

    const response = await request(app).get('/profile').query({uid: '178813'});

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
        code: 0,
        message: 'ok',
        data: profile
    });
});

test('GET /profile forwards experimental provider query and marks response headers', async () => {
    const profile = {
        cached: false,
        experimental: true,
        provider: 'web-v2-experimental',
        profile: {meta: {id: 178813}}
    };
    const app = createApp({
        getUserProfileCache: async (uid, options) => {
            assert.equal(uid, '178813');
            assert.deepEqual(options, {provider: 'web-v2-experimental'});
            return profile;
        }
    });

    const response = await request(app)
        .get('/profile')
        .query({uid: '178813', provider: 'web-v2-experimental'});

    assert.equal(response.status, 200);
    assert.equal(response.headers['x-malody-provider'], 'web-v2-experimental');
    assert.equal(response.headers['x-malody-experimental'], 'true');
    assert.deepEqual(response.body.data, profile);
});

test('GET /card/default/:uid filters invalid hide values and sets cache header', async () => {
    const app = createApp({
        getUserProfileCache: async uid => {
            assert.equal(uid, '178813');
            return {
                cached: true,
                profile: {meta: {id: 178813}}
            };
        },
        renderDefaultCard: async (profile, hide) => {
            assert.deepEqual(hide, [4, 9]);
            assert.deepEqual(profile, {meta: {id: 178813}});
            return '<svg>card</svg>';
        }
    });

    const response = await request(app)
        .get('/card/default/178813')
        .query({hide: '4,abc,9,12,-1'});

    assert.equal(response.status, 200);
    assert.equal(response.headers['x-cache'], 'HIT');
    assert.match(response.headers['content-type'], /image\/svg\+xml/);
});

test('GET /experimental/card/default/:uid uses the experimental provider', async () => {
    const app = createApp({
        getUserProfileCache: async (uid, options) => {
            assert.equal(uid, '178813');
            assert.deepEqual(options, {provider: 'web-v2-experimental'});
            return {
                cached: false,
                experimental: true,
                provider: 'web-v2-experimental',
                profile: {meta: {id: 178813}}
            };
        },
        renderDefaultCard: async () => '<svg>experimental-card</svg>'
    });

    const response = await request(app).get('/experimental/card/default/178813');

    assert.equal(response.status, 200);
    assert.equal(response.headers['x-cache'], 'MISS');
    assert.equal(response.headers['x-malody-provider'], 'web-v2-experimental');
    assert.equal(response.headers['x-malody-experimental'], 'true');
    assert.match(response.headers['content-type'], /image\/svg\+xml/);
});

test('GET /card/default/:uid rejects invalid uid', async () => {
    const app = createApp();
    const response = await request(app).get('/card/default/not-a-number');

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
        code: 400,
        message: 'Invalid id'
    });
});

test('GET /profile rejects unsupported providers', async () => {
    const app = createApp();
    const response = await request(app).get('/profile').query({uid: '178813', provider: 'future'});

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
        code: 400,
        message: 'Unsupported provider: future'
    });
});
