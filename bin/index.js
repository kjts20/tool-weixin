#!/usr/bin/env node
const fs = require('fs');
const { readJson, copyFolderOrFile, writeJson } = require('./scripts/utils/file');
const { join } = require('path');

(function (projetFolder, binFolder, projectConfigJsonName = 'project.config.json', packageJsonName = 'package.json') {
    // 读取项目配置文件
    const projectConf = readJson(join(projetFolder, projectConfigJsonName));
    const mpRoot = join(projetFolder, projectConf.miniprogramRoot);

    // 复制.vscode
    const vscodeFlolder = join(binFolder, '.vscode');
    const toVscodeFolder = join(projetFolder, '.vscode');
    if (!fs.existsSync(toVscodeFolder)) {
        fs.mkdirSync(toVscodeFolder, { recursive: true });
        copyFolderOrFile(vscodeFlolder, toVscodeFolder);
    } else {
        console.error('.vscode文件夹“' + toVscodeFolder.replace(projetFolder, '') + '”已经存在');
    }

    // 复制wxs文件
    const wxsFlolder = join(binFolder, 'wxs');
    const toWxsFolder = join(mpRoot, 'utils/wxs');
    if (!fs.existsSync(toWxsFolder)) {
        fs.mkdirSync(toWxsFolder, { recursive: true });
        copyFolderOrFile(wxsFlolder, toWxsFolder);
    } else {
        console.error('wxs文件夹“' + toWxsFolder.replace(projetFolder, '') + '”已经存在');
    }

    // 复制cli
    const cliFlolder = join(binFolder, 'scripts');
    const toCliFolder = join(projetFolder, 'cli');
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
            initapp: 'node cli/cmd.js type=initapp',
            project: 'node cli/cmd.js type=project miniprogram',
            'env:prod': 'node cli/cmd.js type=changeEnv env=prod',
            'env:pre': 'node cli/cmd.js type=changeEnv env=pre',
            'env:dev': 'node cli/cmd.js type=changeEnv env=dev',
            'env:test': 'node cli/cmd.js type=changeEnv env=test',
            initp: 'npm i && npm run project &&  npm run initapp'
        };
        for (const key in allScripts) {
            packageJson.scripts[key] = allScripts[key];
        }
        writeJson(packageJsonName, packageJson);
    } else {
        throw new Error('package.json没有找到，命令无法写入package.json');
    }
})(process.cwd(), require.main.path, process.argv[2], process.argv[3]);
