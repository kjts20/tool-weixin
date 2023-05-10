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
    const wxsFlolder = join(binFolder, 'src/utils/wxs');
    const toWxsFolder = join(mpRoot, 'utils/wxs');
    if (!fs.existsSync(toWxsFolder)) {
        fs.mkdirSync(toWxsFolder, { recursive: true });
        copyFolderOrFile(wxsFlolder, toWxsFolder);
    } else {
        console.error('wxs文件夹“' + toWxsFolder.replace(projetFolder, '') + '”已经存在');
    }

    // 复制custom-tab-bar文件（tabbar文件）
    const customTabbarFlolder = join(binFolder, 'src/custom-tab-bar');
    const toCustomTabbarFolder = join(mpRoot, 'custom-tab-bar');
    if (!fs.existsSync(toCustomTabbarFolder)) {
        fs.mkdirSync(toCustomTabbarFolder, { recursive: true });
        copyFolderOrFile(customTabbarFlolder, toCustomTabbarFolder);
    } else {
        console.error('custom-tab-bar文件夹“' + toCustomTabbarFolder.replace(projetFolder, '') + '”已经存在');
    }

    // 复制公共组件
    const customComponentFlolder = join(binFolder, 'src/components');
    const toCustomComponentFolder = join(mpRoot, 'components');
    if (!fs.existsSync(toCustomComponentFolder)) {
        fs.mkdirSync(toCustomComponentFolder, { recursive: true });
        copyFolderOrFile(customComponentFlolder, toCustomComponentFolder);
    } else {
        console.error('components文件夹“' + toCustomComponentFolder.replace(projetFolder, '') + '”已经存在');
    }

    // 复制lib文件（系统核心文件）
    const sysLibFlolder = join(binFolder, 'src/lib');
    const toSysLibFolder = join(mpRoot, 'lib');
    if (!fs.existsSync(toSysLibFolder)) {
        fs.mkdirSync(toSysLibFolder, { recursive: true });
        copyFolderOrFile(sysLibFlolder, toSysLibFolder);
    } else {
        console.error('lib文件夹“' + toSysLibFolder.replace(projetFolder, '') + '”已经存在');
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

    // 样式
    const sysStyleFlolder = join(binFolder, 'src/style');
    const toSysStyleFolder = join(mpRoot, 'style');
    if (!fs.existsSync(toSysStyleFolder)) {
        fs.mkdirSync(toSysStyleFolder, { recursive: true });
        copyFolderOrFile(sysStyleFlolder, toSysStyleFolder);
    } else {
        console.error('style文件夹“' + toSysStyleFolder.replace(projetFolder, '') + '”已经存在');
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
            document: 'node cli/document/index.js miniprogram',
            power: 'node cli/power/index.js miniprogram',
            project: 'node cli/cmd.js type=project miniprogram',
            'env:prod': 'node cli/cmd.js type=changeEnv env=prod',
            'env:pre': 'node cli/cmd.js type=changeEnv env=pre',
            'env:dev': 'node cli/cmd.js type=changeEnv env=dev',
            'env:test': 'node cli/cmd.js type=changeEnv env=test',
            initp: 'npm i && npm run project &&  npm run initapp',
            'page:paging': 'node cli/document/command.js paging',
            'page:form': 'node cli/document/command.js form'
        };
        for (const key in allScripts) {
            packageJson.scripts[key] = allScripts[key];
        }
        writeJson(packageJsonName, packageJson);
    } else {
        throw new Error('package.json没有找到，命令无法写入package.json');
    }
})(process.cwd(), require.main.path, process.argv[2], process.argv[3]);
