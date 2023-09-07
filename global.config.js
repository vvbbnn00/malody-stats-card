const config = require('dotenv').config({
    path: require('path').join(__dirname, '.env')
});
process.env = Object.assign(process.env, config.parsed);

module.exports = {
    DB_PATH: 'database/malody.db',
    CACHE_TIME: 1000 * 60 * 60 * 2,
    PROXY: null,
    MALODY: {
        uid: process.env.uid,
        username: process.env.username,
        password: process.env.password
    }
}