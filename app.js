const path = require('path');
const fs = require('fs');
const utils = require('./utils');
const stringRandom = require('string-random');
const config = require('./config');
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');

const Koa = require('koa');
const app = new Koa();

const serve = require('koa-static');
const cors = require('koa2-cors');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');

const assetsDir = path.join(config.baseDir, `assets`);
utils.ensureDir(assetsDir);

app.use(cors());
app.use(serve('assets'));
app.use(bodyParser());

const router = new Router();
router.all('/', async(ctx, next)=>{
    ctx.response.type = 'html';
    ctx.body = fs.createReadStream('index.html');
})
// can do things: 
// 1.可以用channel区分不同产品
// 2.可以支持自定义尺寸、dpi
// 3.可以支持截取指定区域
router.all('/poster', async(ctx, next)=>{
    const startDate = Date.now();
    try{
        let req = ctx.request.body || {};
        req.channel=1800;
        if(ctx.request.method!='POST'){
            let urlParams = ctx.request.search;
            if(urlParams.startsWith("?")){
                urlParams=urlParams.substr(1);
            }
            urlParams.split('&').forEach(item=>{
                let index = item.indexOf("=");
                if(index<=0){
                    return;
                }
                req[item.substr(0, index)] = item.substr(index+1);
            })
        }

        req.device = req.device || config.defaultDevice;
        const targetDevice = devices[req.device];

        let errMsg = '';
        if(!req.channel){
            errMsg = 'channel参数不能为空！';
        }else if(!req.url){
            errMsg = 'url参数不能为空！';
        }else if(!targetDevice){
            errMsg = 'device参数不合法！';
        }
        if(errMsg){
            ctx.status = 200;
            ctx.body = {
                code: config.resCode.err,
                msg: errMsg,
            }
            return;
        }

        // prepare work
        const targetDir = path.join(config.baseDir, `assets/${req.channel}`);
        utils.ensureDir(targetDir);
        const targetFileName = stringRandom(6)+"_"+utils.formatDate(Date.now(),3)+".png";
        const targetFilePath = path.join(targetDir, targetFileName);

        // start work
        const browser = await config.getBrowserInstance();
        const page = await browser.newPage();
        await page.emulate(targetDevice);
        await page.goto(req.url, {waitUntil: "networkidle0"});
        await page.screenshot({path: targetFilePath, fullPage: false});
        page.close();

        let posterUrl = utils.getAssetRelativePath(targetFilePath);

        const endDate = Date.now();
        ctx.status = 200;
        ctx.body = {
            code: config.resCode.suc,
            msg: '生成海报成功！',
            timespan: (endDate-startDate)+'ms',
            data: {
                posterUrl,
            },
        }
    }catch(e){
        const endDate = Date.now();
        ctx.status = 200;
        ctx.body = {
            code: config.resCode.err,
            msg: '生成海报失败！',
            timespan: (endDate-startDate)+'ms',
            data: {
                error: e.toString(),
            },
        }
    }
});
router.all('/health', async(ctx, next)=>{
    ctx.body = 'ok';  
});

app.use(router.routes()).use(router.allowedMethods());

const server = app.listen(config.port, function (){
    const host = server.address().address;
    const port = server.address().port;
    console.log('app start listening at http://%s:%s', host, port);
});