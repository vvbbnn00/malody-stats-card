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

test('GET /card/default/:uid rejects invalid uid', async () => {
    const app = createApp();
    const response = await request(app).get('/card/default/not-a-number');

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
        code: 400,
        message: 'Invalid id'
    });
});
