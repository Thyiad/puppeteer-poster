const fs = require('fs');
const path = require('path');
const config= require('./config');
const moment = require('moment');

function ensureDir(p) {
    if(!fs.existsSync(p)){
        fs.mkdirSync(p);
    }
}

function getAssetRelativePath(absolutePath, assetPath='/assets', replaceSplit = true){
    let targetPath = absolutePath.replace(path.join(config.baseDir, assetPath), "");
    if(targetPath && replaceSplit){
        targetPath = targetPath.replace(/\\/g, "/");
    }
    return targetPath;
}

const formatDate = (value, formatStr = 1) => {
    if(!value){
        return '';
    }

    let date = moment(value);

    let targetFormatStr = formatStr;
    if(targetFormatStr === 1){
        targetFormatStr = 'YYYY-MM-DD HH:mm:ss'
    }else if(targetFormatStr === 2){
        targetFormatStr = 'YYYY-MM-DD'
    }else if(targetFormatStr === 3){
        targetFormatStr = 'YYYYMMDDHHmmss'
    }

    if (date.isValid()) {
        return date.format(targetFormatStr);
    }
    return '';
};

module.exports = {
    ensureDir,
    getAssetRelativePath,
    formatDate,
}