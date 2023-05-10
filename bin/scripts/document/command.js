const { writeJson, readJson, writeFile } = require('../utils/file');
const { join } = require('path');
const fs = require('fs');
const { list2dict } = require('../utils/object');
const { toPageJson, toPageTs, toPageWxml, toPageScss, toFilterJson, toFilterScss, toFilterTs, toFilterWxml } = require('./tmpl/page-paging');
const { toFormJson, toFormScss, toFormTs, toFormWxml } = require('./tmpl/page-form');

// 默认文件名字
const defaultFileName = 'index';
// 默认排序字段
const sortColumnTag = 'Sort';

// 排除字段
const excludeColumns = ['version', 'remark1', 'pageSize', 'id', 'updateUserId', 'createUserId', 'current', 'deleted', 'updateTime', 'sort'];
// 生成筛选字段
const toFilterColumns = (columns) => (columns || []).filter((it) => it?.name && !excludeColumns.includes(it.name) && !it.name.endsWith(sortColumnTag));
// 生成筛选字段
const toSortColumns = (columns) => (columns || []).filter((it) => it?.name && it.name.endsWith(sortColumnTag));
// 生成响应字段
const toResponseColumns = (columns) => (columns || []).filter((it) => it?.name && !excludeColumns.includes(it.name));

// 生成页面Ts、wxml、json、scss文件
const generatePageFile = function (fileDirName, paramsType, responseType, document, service) {
    writeFile(join(fileDirName, [defaultFileName, 'ts'].join('.')), toPageTs(paramsType, responseType, document, service));
    writeFile(join(fileDirName, [defaultFileName, 'scss'].join('.')), toPageScss(paramsType, responseType));
    writeFile(join(fileDirName, [defaultFileName, 'json'].join('.')), toPageJson(responseType.description));
    writeFile(join(fileDirName, [defaultFileName, 'wxml'].join('.')), toPageWxml(toSortColumns(paramsType.properties), toResponseColumns(responseType.properties)));
    // fiter组件
    const { validateList } = document;
    const filterDir = 'filter';
    writeFile(join(fileDirName, filterDir, [defaultFileName, 'ts'].join('.')), toFilterTs(paramsType, responseType, document, list2dict(validateList, (it) => it.name)[paramsType.name]));
    writeFile(join(fileDirName, filterDir, [defaultFileName, 'scss'].join('.')), toFilterScss(toFilterColumns(paramsType.properties), responseType));
    writeFile(join(fileDirName, filterDir, [defaultFileName, 'json'].join('.')), toFilterJson(toFilterColumns(paramsType.properties), responseType));
    writeFile(join(fileDirName, filterDir, [defaultFileName, 'wxml'].join('.')), toFilterWxml(toFilterColumns(paramsType.properties), responseType));
};

// 写入app.json文件
const addPath2AppJson = function (projectRoot, fileDirName) {
    const appJsonFilePath = join(projectRoot, 'app.json');
    const { pages, subPackages, ...otherAppJson } = readJson(appJsonFilePath);
    const [firstRoute, ...otherRoute] = fileDirName.split('/');
    let isWriteRoute = false;
    for (const subPackage of subPackages) {
        if (firstRoute === subPackage.root) {
            isWriteRoute = true;
            const path = [...otherRoute, defaultFileName].join('/');
            if (!subPackages.pages.includes(path)) {
                subPackages.pages.push(path);
            }
            break;
        }
    }
    if (!isWriteRoute) {
        const path = [firstRoute, ...otherRoute, defaultFileName].join('/');
        if (!pages.includes(path)) {
            pages.push(path);
        }
    }
    writeJson(appJsonFilePath, { pages, subPackages, ...otherAppJson });
};

// 写入文件
const generatePaging = function (projectRoot, fileDirName, requestInfo) {
    const { responseType, requestType, document, service } = requestInfo;
    generatePageFile([projectRoot, fileDirName].join('/'), requestType, responseType, document, service);
    addPath2AppJson(projectRoot, fileDirName);
};

// 生成表单页面Ts、wxml、json、scss文件
const generateFormPageFile = function (fileDirName, paramsType, responseType, document, service) {
    const { validateList } = document;
    writeFile(join(fileDirName, [defaultFileName, 'ts'].join('.')), toFormTs(paramsType, document, service, list2dict(validateList, (it) => it.name)[paramsType.name]));
    writeFile(join(fileDirName, [defaultFileName, 'scss'].join('.')), toFormScss(paramsType, responseType));
    writeFile(join(fileDirName, [defaultFileName, 'json'].join('.')), toFormJson(paramsType.description));
    writeFile(join(fileDirName, [defaultFileName, 'wxml'].join('.')), toFormWxml(paramsType.properties.filter((it) => !excludeColumns.includes(it.name))));
};

// 写入表单文件
const generateformPage = function (projectRoot, fileDirName, requestInfo) {
    const { responseType, requestType, document, service } = requestInfo;
    generateFormPageFile([projectRoot, fileDirName].join('/'), requestType, responseType, document, service);
    addPath2AppJson(projectRoot, fileDirName);
};

(function (genType, typeName, filePath, scriptRoot) {
    // 支持生成类型
    const supportGenType = ['paging', 'form'];
    if (!supportGenType.includes(genType)) {
        throw new Error('生成类型无法识别！！！');
    }
    if (!filePath) {
        throw new Error('路径为空，无法生成！！！');
    }
    if (!typeName) {
        throw new Error('类型为空，无法生成！！！');
    }

    // 获取系统变量
    const { miniprogramRoot } = readJson('./project.config.json');
    if (!miniprogramRoot) {
        throw new Error('project.config.json文件中没有miniprogramRoot字段！！！');
    }
    const projectRoot = miniprogramRoot.replace(/^(.*?)\/$/, '$1');

    // 路径检查
    const genPath = filePath.replace(/^\/*(.*?)\/*$/, '$1');
    if (fs.existsSync([projectRoot, genPath, defaultFileName + '.wxml'].join('/'))) {
        throw new Error('文件已经存在，无法生成！！！');
    }

    // 请求类型检查
    const documentList = readJson(join(scriptRoot, 'note.json'));

    const getRequestInfo = function (filterFunc, toRequestName) {
        const list = documentList;
        const serverName = typeName;
        if (!filterFunc && !toRequestName) {
            throw new Error('过滤函数或者生成请求名字函数没有定义！！！');
        } else {
            for (const document of list) {
                for (const service of document.serviceList) {
                    if (service.name === serverName) {
                        const { response, params } = service;
                        const requestParams = params.find((it) => it.in === 'body');
                        if (filterFunc(service, requestParams)) {
                            // 响应类型
                            const responseTypeName = toRequestName(response);
                            // 请求类型
                            const requestTypeName = requestParams.type;
                            // 获取类型列表
                            const typeNameDict = list2dict(document.typeList, (it) => it.name);
                            return {
                                document,
                                service,
                                responseType: typeNameDict[responseTypeName],
                                responseTypeName,
                                requestType: typeNameDict[requestTypeName],
                                requestTypeName
                            };
                        }
                    }
                }
            }
            return null;
        }
    };

    if (genType === 'paging') {
        // 生成分页页面（使用分页请求的名字作为类型）
        const resposeRe = /^BaseResponse<BaseUnifyPage<(.*?)>>$/;
        const requestInfo = getRequestInfo(
            (service, requestParams) => {
                const { response, type } = service;
                return resposeRe.test(response) && requestParams && type === 'postJson';
            },
            (response) => response.replace(resposeRe, '$1')
        );
        if (requestInfo === null) {
            throw new Error('请求名字找不到或者不是分页接口！！！');
        } else {
            generatePaging(projectRoot, genPath, requestInfo);
        }
    } else if (genType === 'form') {
        // 生成表单页面（使用添加请求的名字作为类型）
        const requestInfo = getRequestInfo(
            (service, requestParams) => requestParams && requestParams.required && service.type === 'put',
            (response) => response
        );
        if (requestInfo === null) {
            throw new Error('请求名字找不到或者不是添加接口！！！');
        } else {
            generateformPage(projectRoot, genPath, requestInfo);
        }
    }
})(process.argv[2], process.argv[3], process.argv[4], join(process.argv[1], '..'));
