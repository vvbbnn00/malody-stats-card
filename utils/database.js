const nedb = require('nedb');
const path = require('path');
const {DB_PATH} = require('../global.config');

const db = new nedb({
    filename: path.join(__dirname, '..', DB_PATH),
    autoload: true,
});


async function getCachedToken(uid) {
    return await new Promise((resolve, reject) => {
        db.findOne({uid, type: "token"}, (err, doc) => {
            if (err) reject(err);
            resolve(doc);
        })
    });
}


async function setCachedToken(uid, token) {
    const doc = await getCachedToken(uid);
    if (doc) {
        await new Promise((resolve, reject) => {
            db.update({uid, type: "token"}, {$set: {token}}, {}, (err, numReplaced) => {
                if (err) reject(err);
                resolve(numReplaced);
            })
        });
    } else {
        await new Promise((resolve, reject) => {
            db.insert({uid, type: "token", token}, (err, doc) => {
                if (err) reject(err);
                resolve(doc);
            })
        });
    }
}


async function getCachedProfile(uid) {
    return await new Promise((resolve, reject) => {
        db.findOne({uid, type: "profile"}, (err, doc) => {
            if (err) reject(err);
            resolve(doc);
        })
    });
}


async function setCachedProfile(uid, profile) {
    const doc = await getCachedProfile(uid);
    if (doc) {
        await new Promise((resolve, reject) => {
            db.update({uid, type: "profile"}, {
                $set: {
                    profile,
                    time: Date.now()
                }
            }, {}, (err, numReplaced) => {
                if (err) reject(err);
                resolve(numReplaced);
            })
        });
    } else {
        await new Promise((resolve, reject) => {
            db.insert({uid, type: "profile", profile, time: Date.now()}, (err, doc) => {
                if (err) reject(err);
                resolve(doc);
            })
        });
    }
}

module.exports = {
    getCachedToken,
    setCachedToken,
    getCachedProfile,
    setCachedProfile
};
