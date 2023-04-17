#!/usr/bin/env node
const fs = require('fs');
const { readJson, copyFolderOrFile } = require('./scripts/utils/file');
const { join } = require('path');

(function (projetFolder, binFolder, projectConfigJsonName = 'project.config.json') {
    // 读取项目配置文件
    const projectConf = readJson(join(projetFolder, projectConfigJsonName));
    const mpRoot = join(projetFolder, projectConf.miniprogramRoot);
    const wxsFlolder = join(binFolder, 'wxs');
    const cliFlolder = join(binFolder, 'scripts');
    const toWxsFolder = join(mpRoot, 'utils/wxs');
    const toCliFolder = join(projetFolder, 'cli');

    // 复制wxs文件
    if (!fs.existsSync(toWxsFolder)) {
        fs.mkdirSync(toWxsFolder, { recursive: true });
        copyFolderOrFile(wxsFlolder, toWxsFolder);
    } else {
        console.error('wxs文件夹“' + toWxsFolder.replace(projetFolder, '') + '”已经存在');
    }

    // 复制cli
    if (!fs.existsSync(toCliFolder)) {
        fs.mkdirSync(toCliFolder, { recursive: true });
        copyFolderOrFile(cliFlolder, toCliFolder);
    } else {
        console.error('脚手架文件夹“' + toCliFolder.replace(projetFolder, '') + '”已经存在');
    }
})(process.cwd(), require.main.path, process.argv[2]);
