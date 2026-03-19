const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {createDatabaseStore} = require('../utils/database');

function insertDoc(store, doc) {
    return new Promise((resolve, reject) => {
        store._internal.db.insert(doc, (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}

test('database store migrates legacy documents and keeps a backup', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'malody-db-'));
    const filename = path.join(tmpDir, 'cache.db');
    const store = createDatabaseStore({filename});

    await insertDoc(store, {uid: '178813', type: 'token', token: 'legacy-token'});
    await insertDoc(store, {uid: '178813', type: 'profile', profile: {meta: {id: 178813}}, time: 1});

    const tokenDoc = await store.getCachedToken('178813');
    const profileDoc = await store.getCachedProfile('178813');
    const schemaDoc = await store._internal.findOne({type: 'meta', key: 'schemaVersion'});

    assert.equal(tokenDoc.provider, 'legacy');
    assert.equal(profileDoc.provider, 'legacy');
    assert.equal(schemaDoc.value, 2);
    assert.equal(fs.existsSync(`${filename}.bak-v1`), true);
});

test('database store isolates cache documents by provider', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'malody-db-'));
    const filename = path.join(tmpDir, 'cache.db');
    const store = createDatabaseStore({filename});

    await store.setCachedProfile('178813', {meta: {id: 178813}}, 'legacy');
    await store.setCachedProfile('178813', {meta: {id: 178813, username: 'guest'}}, 'web-v2-experimental');

    const legacyProfile = await store.getCachedProfile('178813', 'legacy');
    const experimentalProfile = await store.getCachedProfile('178813', 'web-v2-experimental');

    assert.deepEqual(legacyProfile.profile, {meta: {id: 178813}});
    assert.deepEqual(experimentalProfile.profile, {meta: {id: 178813, username: 'guest'}});
});
