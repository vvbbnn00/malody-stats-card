const Datastore = require('@seald-io/nedb');
const fs = require('fs');
const path = require('path');
const {DB_PATH} = require('../global.config');

const DEFAULT_PROVIDER = 'legacy';
const SCHEMA_VERSION = 2;

function callDb(db, method, ...args) {
    return new Promise((resolve, reject) => {
        db[method](...args, (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}

function toAbsoluteFilename(filename) {
    if (!filename) return undefined;
    if (path.isAbsolute(filename)) return filename;
    return path.join(__dirname, '..', filename);
}

function createDatabaseStore(options = {}) {
    const filename = toAbsoluteFilename(options.filename || DB_PATH);
    const db = new Datastore({
        filename,
        inMemoryOnly: options.inMemoryOnly || false,
        autoload: options.autoload !== false,
    });

    let initPromise;

    async function findOne(query) {
        return callDb(db, 'findOne', query);
    }

    async function find(query) {
        return callDb(db, 'find', query);
    }

    async function update(query, updateDoc, updateOptions = {}) {
        return callDb(db, 'update', query, updateDoc, updateOptions);
    }

    async function insert(doc) {
        return callDb(db, 'insert', doc);
    }

    async function ensureBackupExists() {
        if (options.inMemoryOnly || !filename || !fs.existsSync(filename)) return;

        const backupFilename = `${filename}.bak-v1`;
        if (fs.existsSync(backupFilename)) return;
        fs.copyFileSync(filename, backupFilename);
    }

    async function setSchemaVersion(version) {
        await update(
            {type: 'meta', key: 'schemaVersion'},
            {
                $set: {
                    type: 'meta',
                    key: 'schemaVersion',
                    value: version,
                    updatedAt: Date.now()
                }
            },
            {upsert: true}
        );
    }

    async function migrateLegacyDocuments() {
        const legacyDocs = await find({
            type: {$in: ['token', 'profile']},
            provider: {$exists: false}
        });

        if (legacyDocs.length === 0) {
            await setSchemaVersion(SCHEMA_VERSION);
            return;
        }

        await ensureBackupExists();

        for (const doc of legacyDocs) {
            await update({_id: doc._id}, {$set: {provider: DEFAULT_PROVIDER}});
        }

        await setSchemaVersion(SCHEMA_VERSION);
    }

    async function ensureInitialized() {
        if (!initPromise) {
            initPromise = (async () => {
                const schemaVersionDoc = await findOne({type: 'meta', key: 'schemaVersion'});
                const schemaVersion = schemaVersionDoc ? Number(schemaVersionDoc.value) : 1;

                if (schemaVersion < SCHEMA_VERSION) {
                    await migrateLegacyDocuments();
                }
            })();
        }

        await initPromise;
    }

    async function getCachedToken(uid, provider = DEFAULT_PROVIDER) {
        await ensureInitialized();
        return findOne({uid, type: 'token', provider});
    }

    async function setCachedToken(uid, token, provider = DEFAULT_PROVIDER) {
        await ensureInitialized();
        const doc = await getCachedToken(uid, provider);
        if (doc) {
            await update({uid, type: 'token', provider}, {$set: {token}});
            return;
        }

        await insert({uid, type: 'token', provider, token});
    }

    async function getCachedProfile(uid, provider = DEFAULT_PROVIDER) {
        await ensureInitialized();
        return findOne({uid, type: 'profile', provider});
    }

    async function setCachedProfile(uid, profile, provider = DEFAULT_PROVIDER) {
        await ensureInitialized();
        const doc = await getCachedProfile(uid, provider);
        const payload = {
            profile,
            time: Date.now()
        };

        if (doc) {
            await update({uid, type: 'profile', provider}, {$set: payload});
            return;
        }

        await insert({uid, type: 'profile', provider, ...payload});
    }

    return {
        ensureInitialized,
        getCachedToken,
        setCachedToken,
        getCachedProfile,
        setCachedProfile,
        _internal: {
            db,
            filename,
            defaultProvider: DEFAULT_PROVIDER,
            schemaVersion: SCHEMA_VERSION,
            findOne,
            find,
        }
    };
}

let defaultStore;

function getDefaultStore() {
    if (!defaultStore) {
        defaultStore = createDatabaseStore();
    }

    return defaultStore;
}

module.exports = {
    createDatabaseStore,
    ensureInitialized: (...args) => getDefaultStore().ensureInitialized(...args),
    getCachedToken: (...args) => getDefaultStore().getCachedToken(...args),
    setCachedToken: (...args) => getDefaultStore().setCachedToken(...args),
    getCachedProfile: (...args) => getDefaultStore().getCachedProfile(...args),
    setCachedProfile: (...args) => getDefaultStore().setCachedProfile(...args)
};
