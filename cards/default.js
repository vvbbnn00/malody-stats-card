const fs = require('fs');
const path = require('path');

const template = fs.readFileSync(path.join(__dirname, 'templates/default.svg'), 'utf-8');

console.log(template)