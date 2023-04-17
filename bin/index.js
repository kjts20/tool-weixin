#!/usr/bin/env node
const fs = require('fs');
const { readJson, copyFolderOrFile, writeJson } = require('./scripts/utils/file');
const { join } = require('path');

(function (projetFolder, binFolder, projectConfigJsonName = 'project.config.json', packageJsonName = 'package.json') {
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

    // 更新package的命令
    const packageJson = readJson(packageJsonName);
    if (packageJson !== null) {
        if (typeof packageJson.scripts !== 'object') {
            packageJson.scripts = {};
        }
        const allScripts = {
            route: 'node cli/cmd.js type=route',
            project: 'node cli/cmd.js type=project',
            'env:prod': 'node cli/cmd.js type=changeEnv env=prod',
            'env:pre': 'node cli/cmd.js type=changeEnv env=pre',
            'env:dev': 'node cli/cmd.js type=changeEnv env=dev',
            'env:test': 'node cli/cmd.js type=changeEnv env=test',
            initp: 'npm i && npm run project'
        };
        for (const key in allScripts) {
            packageJson.scripts[key] = allScripts[key];
        }
        writeJson(packageJsonName);
    } else {
        throw new Error('package.json没有找到，命令无法写入package.json');
    }
})(process.cwd(), require.main.path, process.argv[2], process.argv[3]);
