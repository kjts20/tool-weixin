const fs = require('fs');
const { join } = require('path');
const { writeAppJson, readAppJson, srcDir, createFileDir } = require('./common');
const { getArgs, arr2Path } = require('./utils/tools.utils');

// 获取命令参数
const argsList = process.argv;

// 参数字典
const args = getArgs(argsList);

// 子包
const moduleName = args.package || '';

// 根目录
const rootDir = moduleName ? join(srcDir, moduleName) : srcDir;

// 类型支持类型
const supportTypes = ['page', 'component'];
// 获取类型
const type = args.type;
let isPage = false;
let useTemplate = null;
if (!supportTypes.includes(type)) {
    console.error('无法识别的模版类型：', templateStr);
    throw new Error('无法识别的模版类型！！！');
} else {
    isPage = type.includes('page');
    if (isPage) {
        useTemplate = require('./templates/page.tmp');
    } else {
        useTemplate = require('./templates/component.tmp');
    }
}

// 生成名称
const name = argsList[4];

//获取创建信息
let createInfo = (createName => {
    let nameRe = /^[a-zA-Z0-9_\-$]*$/;
    //创建错误
    const pageError = (...args) => {
        console.error(`创建${isPage ? '页面' : '组件'}名字，无法创建：`, ...args);
        throw new Error(`无法创建`);
    };
    if (typeof createName === 'string' && createName !== '') {
        let nameDirList = createName
            .replace(/\\/g, '/')
            .split('/')
            .filter(it => nameRe.test(it));
        if (nameDirList.length > 0) {
            if (isPage) {
                nameDirList.unshift('pages');
            } else {
                nameDirList.unshift('components');
            }
            let path = arr2Path(nameDirList);
            return {
                // 生成目录
                dir: join(rootDir, path),
                // 路由
                route: isPage ? path : null,
                // 距离根目录层级（生成相对目录）
                layerNum: nameDirList.length + (moduleName ? 1 : 0),
                // 生成的文件名
                fileName: 'index'
            };
        } else {
            pageError(createName, nameDirList);
        }
    } else {
        pageError(createName);
    }
})(name);

//创建页面
((dir, fileName, layerNum, route) => {
    const pathWithOutExt = join(dir, fileName);
    //创建目录
    createFileDir(pathWithOutExt);
    const trim = txt => txt.replace(/^\n*([\w\W]*)\n*$/, '$1');
    //创建文件
    fs.writeFileSync(pathWithOutExt + '.json', trim(useTemplate.jsonFile));
    fs.writeFileSync(pathWithOutExt + '.ts', trim(useTemplate.tsFile));
    fs.writeFileSync(pathWithOutExt + '.wxml', trim(useTemplate.wxmlFile));
    fs.writeFileSync(pathWithOutExt + '.scss', trim(useTemplate.toScssFile('../'.repeat(layerNum))));

    if (route) {
        //读取路由文件
        let routeContent = readAppJson();
        if (typeof routeContent !== 'object' || routeContent === null) {
            routeContent = {
                pages: [],
                subPackages: [],
                window: {
                    backgroundTextStyle: 'dark',
                    navigationBarBackgroundColor: '#ffffff',
                    navigationBarTitleText: '衣采批',
                    navigationBarTextStyle: 'black',
                    backgroundColor: '#ffffff'
                },
                style: 'v2',
                sitemapLocation: 'sitemap.json'
            };
        }
        const addPath = join(route, fileName).replace(/\\/g, '/');
        // 根路由
        let rootRoutes = routeContent;
        if (moduleName) {
            // 查找子包所在位置
            let subIndex = -1;
            routeContent.subPackages.forEach((it, i) => {
                if (it.root === moduleName) {
                    subIndex = i;
                }
            });
            if (subIndex < 0) {
                console.error('app.json配置=>', routeContent);
                throw new Error('找不到子包配置');
            } else {
                rootRoutes = routeContent.subPackages[subIndex];
            }
        }
        const routesDict = rootRoutes.pages;
        // 写入路由
        if (routesDict.indexOf(addPath) === -1) {
            routesDict.push(addPath);
            writeAppJson(routeContent);
        }
    }
})(createInfo.dir, createInfo.fileName, createInfo.layerNum, createInfo.route);
