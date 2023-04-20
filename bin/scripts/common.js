const fs = require('fs');
const { join } = require('path');
const { writeJson, writeTsConfig, createFileDir, readJson } = require('./utils/file');

// project.config.json
const projectConfigFilePath = './project.config.json';
// tsconfig.json
const tsconfigJsonPath = './tsconfig.json';

//获取ts配置
const tsConfig = (function (tsconfigFile) {
    if (fs.existsSync(tsconfigFile)) {
        try {
            return JSON.parse(fs.readFileSync(tsconfigFile).toString());
        } catch (err) {
            console.error('tsConfig文件：' + tsconfigFile + '读取错误=>', err);
        }
    }
    return null;
})(tsconfigJsonPath);

// ts配置文件
if (typeof tsConfig !== 'object' || tsConfig === null) {
    throw new Error('ts配置文件没有找到');
}

// 使用的src目录
const { outDir, srcDir } = tsConfig;

// 路由目录
const routerPath = join(srcDir, 'config/route.ts');
// tabbar页面
const tabbarPath = join(srcDir, 'config/tabbar.ts');
// app.json目录
const appJsonPath = join(srcDir, 'app.json');

// 环境配置文件
const envPath = join(srcDir, 'config/env.ts');

// 环境
const allEnv = {
    // 生产
    prod: {
        appid: 'xxx',
        host: 'https://xxx',
        apiPrefix: 'api/',
        publicPrefix: 'public/',
        imgHost: 'https://xxx',
        getMessageInterval: 5 * 1000
    },
    // 预发
    pre: {
        appid: 'xxx',
        host: 'https://xxx',
        apiPrefix: 'api/',
        publicPrefix: 'public/',
        imgHost: 'https://xxx',
        getMessageInterval: 5 * 1000
    },
    // 开发
    dev: {
        appid: 'xxx',
        host: 'https://xxx',
        apiPrefix: 'api/',
        publicPrefix: 'public/',
        imgHost: 'https://xxx',
        getMessageInterval: 15 * 1000
    },
    // 测试
    test: {
        appid: 'xxx',
        host: 'https://xxx',
        apiPrefix: 'api/',
        publicPrefix: 'public/',
        imgHost: 'https://xxx',
        getMessageInterval: 30 * 1000
    }
};

// 读取project.config.json文件
const readProjectConfig = function () {
    return readJson(projectConfigFilePath);
};

// 写入project.config.json文件
const writeProjectConfig = function (fileContent, envIt, rootDir) {
    // 写入根目录
    if (rootDir) {
        fileContent.miniprogramRoot = rootDir;
        fileContent.setting.packNpmRelationList.forEach(it => {
            it.miniprogramNpmDistDir = `./${rootDir}/`;
        });
        fileContent.srcMiniprogramRoot = `${rootDir}/`;
        writeJson(projectConfigFilePath, fileContent);
    }
    // 写入环境信息
    if (typeof envIt === 'object' && envIt !== null) {
        fileContent.appid = envIt.appid;
        writeJson(projectConfigFilePath, fileContent);
        writeTsConfig(envPath, envIt);
    } else {
        console.error('环境变量获取失败：', envIt);
    }
};

// 写入tsconfig.json文件
const writeTsConfigJson = function (fileContent, rootDir) {
    fileContent.srcDir = rootDir;
    fileContent.outDir = rootDir;
    fileContent.compilerOptions.paths = {
        '@/*': [rootDir + '/*']
    };
    fileContent.include = [rootDir + '/**/*.ts'];
    writeJson(tsconfigJsonPath, fileContent);
};

// 生成路由
const toRoutes = function (appJson) {
    // 主包路由
    const main = {};
    // 子包中路由
    const subs = {};

    // 把路由文件中路由提取出来
    if (typeof appJson === 'object' && appJson !== null) {
        const p2nRe = /[\/\-]([a-zA-Z])/g;
        const toName = path =>
            path
                .replace(/^(.*?)(\/[a-zA-Z0-9\-\_]+)\2$/, '$1$2')
                .replace(/^pages\/(.*?)$/, '$1')
                .replace(p2nRe, (_, $1) => $1.toUpperCase())
                .replace('/', '')
                .replace();
        // 主页面
        const pages = appJson.pages;
        if (Array.isArray(pages)) {
            pages.forEach(it => {
                if (typeof it === 'string' && it !== '') {
                    main[toName(it)] = it;
                }
            });
        }
        // 分包
        const subPackages = appJson.subPackages;
        if (Array.isArray(subPackages)) {
            subPackages.forEach(it => {
                if (typeof it === 'object' && it !== null) {
                    const spN = it.name;
                    const spR = it.root;
                    const sPages = it.pages;
                    const spDict = {};
                    if (Array.isArray(sPages)) {
                        sPages.forEach(it => {
                            if (typeof it === 'string' && it !== '') {
                                spDict[toName(it)] = spR + '/' + it;
                            }
                        });
                    }
                    subs[toName(spN)] = spDict;
                }
            });
        }

        // 组装成为json对象
        const routes = {
            main,
            ...subs
        };
        return routes;
    } else {
        return null;
    }
};

// 写入路由
const writeRoutes = function (appJson) {
    createFileDir(routerPath);
    writeTsConfig(routerPath, {
        routes: toRoutes(appJson)
    });
};

// 写入tabbar页面
const writeTabbar = function (appJson) {
    if (typeof appJson === 'object' && appJson !== null && appJson.tabBar) {
        createFileDir(tabbarPath);
        writeTsConfig(tabbarPath, {
            tabBar: appJson.tabBar
        });
    }
};

// 更新路由
const updateRoutes = function () {
    writeRoutes(readAppJson());
};

// 读取app.json文件
const readAppJson = function () {
    return readJson(appJsonPath);
};

// 生成路由
const writeAppJson = function (fileContent) {
    writeJson(appJsonPath, fileContent);
    writeTabbar(fileContent);
    writeRoutes(fileContent);
};

module.exports = {
    srcDir,
    outDir,
    createFileDir,
    allEnv,
    readProjectConfig,
    writeProjectConfig,
    writeTsConfigJson,
    updateRoutes,
    readAppJson,
    writeAppJson
};
