const fetch = require('node-fetch-with-proxy');
const tunnel = require('tunnel');
const {PROXY, CACHE_TIME} = require('../global.config');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_PATH = path.join(__dirname, '..', 'cache');
// If path not exists, create it
if (!fs.existsSync(CACHE_PATH)) {
    fs.mkdirSync(CACHE_PATH);
}

const agent = tunnel.httpsOverHttp({
    proxy: PROXY,
});

async function getOnlinePicture(url) {
    const sha256Hash = crypto.createHash('sha256');
    sha256Hash.update(url);
    const urlSha256 = sha256Hash.digest('hex');
    const filename = path.join(CACHE_PATH, urlSha256 + ".jpg");
    // First 8 bytes is cache timestamp
    let file;
    try {
        file = fs.readFileSync(filename);
    } catch (e) {
        file = Buffer.from("");
    }
    let cached = false;
    if (file.length > 8) {
        const timestamp = file.slice(0, 8).readBigInt64BE();
        // TODO
        console.log(Number(timestamp));
        if (Date.now() - Number(timestamp) < CACHE_TIME) {
            cached = true;
        }
    }
    // Judge if cached
    if (!cached) {
        const response = await fetch(url, {
            method: "GET",
            // agent
        });
        const buffer = await response.buffer();
        fs.writeFileSync(filename, Buffer.concat([Buffer.from(BigInt(Date.now()).toString(16), 'hex'), buffer]));
        return buffer;
    }

    // Return cached file
    return file.slice(8);
}

getOnlinePicture("http://cdn1.machart.top/avatar/178813")