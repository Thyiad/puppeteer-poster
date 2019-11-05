const puppeteer = require('puppeteer');

const browserPromise = puppeteer.launch();
module.exports = {
    port: 8080,
    baseDir : __dirname,
    getBrowserInstance: ()=> browserPromise,
    resCode: {
        suc: 200,
        err: 400,
    },
    defaultDevice: 'iPhone 6',
}