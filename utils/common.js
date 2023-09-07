let fetch;
(async () => {
    fetch = (await import('node-fetch')).default;
})();
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

const agent = PROXY && tunnel.httpsOverHttp({
    proxy: PROXY,
});

async function getOnlinePicture(url) {
    const sha256Hash = crypto.createHash('sha256');
    sha256Hash.update(url);
    const urlSha256 = sha256Hash.digest('hex');
    const filename = path.join(CACHE_PATH, urlSha256 + ".dat");
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
        if (Date.now() - Number(timestamp) < CACHE_TIME) {
            cached = true;
        }
    }
    // Judge if cached
    if (!cached) {
        try {
            const response = await fetch(url, {
                method: "GET",
                agent
            });
            if (response.status !== 200) {
                return null;
            }
            const buffer = await response.buffer();
            const timestampBuffer = Buffer.alloc(8);
            timestampBuffer.writeBigInt64BE(BigInt(Date.now()));
            fs.writeFileSync(filename, Buffer.concat([timestampBuffer, buffer]));
            return buffer;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    // Return cached file
    return file.slice(8);
}

function buffer2Base64(data) {
    if (!data) return null;
    const buffer = Buffer.from(data);
    return "data:image/png;base64," + buffer.toString('base64');
}

// getOnlinePicture("http://cdn1.machart.top/avatar/178813")

module.exports = {
    getOnlinePicture,
    buffer2Base64
}