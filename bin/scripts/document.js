const { projectBaseUrl, swaggerApiList } = require('./config/document');
const { writeJson, lineTag, tabTag, createFileDir, writeFile } = require('./utils/file');
const { get } = require('./utils/request');
const { list2dict, listGroupBy, dict2List } = require('./utils/object');
const { firstLowerCase } = require('./utils/string');

/**
 * [字典]java类型-ts类型
 */
const type2tsDict = {
    number: 'number',
    int: 'number',
    integer: 'number',
    string: 'string',
    boolean: 'boolean',
    file: 'File'
};

/**
 * js名字冲突
 */
const jsNameConflict = {
    delete: 'del'
};
/**
 * 生成js命名
 * @param {名字} name
 * @returns
 */
const toJsName = function (name) {
    // 过滤非法字符
    const namePart = [];
    name.replace(/[a-zA-Z0-9\_\$]+/g, $0 => namePart.push($0));
    const nameStr = namePart.join('');
    // 过滤关键字
    return jsNameConflict[nameStr] || nameStr;
};

/**
 * 生成使用的key
 * @param  key
 */
const toUseKey = function (key) {
    let useKey = key;
    const delimiterRe = /«([^«]*?)»/;
    while (delimiterRe.test(useKey)) {
        useKey = useKey.replace(delimiterRe, '<$1>');
    }
    return useKey.replace(/List<(.*?)>/g, 'Array<$1>').replace(/\<int\>/g, '<number>');
};

/**
 * 生成类型列表
 * @param {swagger类型定义字典} definitions
 * @param {泛型列表} beanGenericityList
 */
const toTypesList = function (definitions, beanGenericityList) {
    // 类型定义
    const toBaseNameRe = /^(.*?)(<.*?>)$/;
    const allTypes = [];
    for (const key in definitions) {
        const useKey = toUseKey(key);
        const baseKey = useKey.replace(toBaseNameRe, '$1');
        const item = definitions[key];
        const definitionAttrs = beanGenericityList.filter(it => it.beanName === baseKey);
        const attrDict = list2dict(definitionAttrs, it => it.attr);
        // 字段是否必填（如果有required字段声明的才必填，没有required字段都是必填）
        const requiredAttrs = item.required;
        // 使用的泛型
        const useGenericityList = [];
        definitionAttrs.forEach(it => {
            it.useTypes.map(tit => {
                useGenericityList.push(tit);
            });
        });
        // 构建数据
        allTypes.push({
            ...item,
            name: baseKey,
            useGenericityList,
            properties: dict2List(item.properties, 'name').map(it => {
                const { name, description } = it;
                const noteIt = attrDict[name];
                // 一般类型引用
                let useType = type2tsDict[it.type];
                if (noteIt) {
                    // 泛型引用
                    useType = toUseKey(noteIt.attrType);
                } else if (it.type === 'array' && it.items && it.items.originalRef) {
                    // 直接数组引用
                    useType = `Array<${toUseKey(it.items.originalRef)}>`;
                } else if (it.originalRef) {
                    // 直接对象引用
                    useType = toUseKey(it.originalRef);
                } else if (it.type === 'object' && it.additionalProperties && it.additionalProperties.originalRef) {
                    // map情况处理
                    useType = toUseKey(it.additionalProperties.originalRef);
                } else if (it.type === 'array' && it.items && it.items.type) {
                    useType = `Array<${type2tsDict[it.items.type]}>`;
                } else if (it.type === 'object') {
                    useType = `any`;
                }
                if (!useType) {
                    console.error('类型无法解析=>>', it, noteIt);
                }
                return {
                    required: Array.isArray(requiredAttrs) ? requiredAttrs.includes(name) : true,
                    type: useType,
                    name,
                    description
                };
            })
        });
    }
    return dict2List(list2dict(allTypes, it => it.name));
};

/**
 * 类型装饰（枚举赋值到类型中）
 * @param {ts类型列表} typeList
 * @param {选择器与属性映射列表} selectorMapperList
 * @param {选择器列表} selectorOptionList
 */
const typeDecorate = function (typeList, selectorMapperList, selectorOptionList) {
    const selectorMapperDict = listGroupBy(selectorMapperList, it => it.docName);
    const selectorNameDict = list2dict(selectorOptionList, it => it.name);
    typeList.forEach(typeIt => {
        const mapperList = selectorMapperDict[typeIt.name];
        if (Array.isArray(mapperList)) {
            const attrDict = list2dict(mapperList, mapperIt => mapperIt.attr);
            typeIt.properties.forEach(attrIt => {
                const useAttr = attrDict[attrIt.name];
                if (useAttr) {
                    const enumIt = selectorNameDict[useAttr.enumName];
                    attrIt.description = enumIt.remark;
                    attrIt.type = enumIt.values.map(it => it.value).join('|');
                }
            });
        }
    });
    return typeList;
};

/**
 * 写入类型文件
 * @param {文件名称} fileName
 * @param {文件描述} description
 * @param {类型列表} typeList
 */
const writeTypeFile = function (fileName, description, typeList) {
    // 类型属性模板
    const toTypeAttrTmpl = function (attr) {
        return [`${tabTag}// ${attr.description || attr.name}`, `${tabTag}${attr.name}${attr.required ? '' : '?'}: ${attr.type}`].join(lineTag);
    };
    // 类型模板
    const toTypeTmpl = function (typeIt) {
        const nameAndType = `${typeIt.name}${typeIt.useGenericityList.length > 0 ? `<${typeIt.useGenericityList.map(it => `${it}=any`).join(',')}>` : ''}`;
        const properties = `${typeIt.properties.map(it => toTypeAttrTmpl(it)).join(lineTag)}`;
        return [, `// ${typeIt.description || typeIt.name}`, `export interface ${nameAndType} {`, properties, '}'].join(lineTag);
    };
    // 写入文件
    writeFile(fileName, [`${description || '类型文件'}`, typeList.map(it => toTypeTmpl(it)).join(lineTag)].join(lineTag));
};

/**
 * 生成请求文件
 * @param {标签（控制器信息）} tags
 * @param {请求列表} paths
 * @returns
 */
const toRequestList = function (tags, paths) {
    // 标签处理（用了作为文件名称）
    const tagsDict = list2dict(
        tags.map(it => ({
            description: it.name,
            name: it.description.replace(/\s/g, '')
        })),
        it => it.description
    );
    // 请求处理
    const requestList = [];
    for (const url in paths) {
        const pathItem = paths[url];
        for (const method in pathItem) {
            const requestItem = pathItem[method];
            const { responses, parameters, operationId, summary, tags } = requestItem;
            const fileName = tags.map(it => tagsDict[it]).find(it => it)?.name || 'controller';
            const name = operationId
                .replace(new RegExp(`^(.*?)Using${method}_\\d+$`, 'i'), (_, $1) => firstLowerCase($1))
                .replace(new RegExp(`^(.*?)Using${method}$`, 'i'), (_, $1) => firstLowerCase($1));
            // 按照httpServer进行定义
            const type = (function () {
                if (method === 'post') {
                    if (parameters) {
                        if (parameters.filter(it => it.in === 'body').length > 0) {
                            return 'postJson';
                        } else if (parameters.filter(it => it.in === 'formData').length > 0) {
                            return 'upload';
                        } else {
                            return 'post';
                        }
                    } else {
                        return 'post';
                    }
                } else {
                    return method.toLowerCase();
                }
            })();
            const response = responses['200'];
            requestList.push({
                requestUrl: url,
                fileName,
                name: toJsName(name),
                type,
                description: summary,
                params: (parameters || []).map(it => {
                    // 类型处理
                    const type = (function () {
                        if (it.in === 'body') {
                            const itSchema = it.schema;
                            if (itSchema) {
                                if (itSchema.originalRef) {
                                    return toUseKey(itSchema.originalRef).replace(/List<(.*?)>/g, 'Array<$1>');
                                } else {
                                    if (itSchema.type === 'array') {
                                        if (itSchema.items && itSchema.items.type) {
                                            return `Array<${type2tsDict[itSchema.items.type]}>`;
                                        } else {
                                            console.error('无法识别的的body类型=>', it);
                                        }
                                    } else {
                                        console.error('无法识别的的body类型=>', it);
                                    }
                                }
                            } else {
                                console.error('无法识别的的body类型=>', it);
                            }
                        } else {
                            const useType = type2tsDict[it.type];
                            if (useType) {
                                return useType;
                            } else {
                                if (it.type === 'array') {
                                    return `Array<${type2tsDict[it.items.type]}>`;
                                } else {
                                    console.log('无法识别的类型=>', it);
                                    return 'any';
                                }
                            }
                        }
                    })();
                    return {
                        in: it.in,
                        name: it.name,
                        type,
                        required: it.required,
                        description: it.description
                    };
                }),
                response: (function (schema) {
                    if (schema) {
                        if (schema.originalRef) {
                            return toUseKey(schema.originalRef).replace(/List<(.*?)>/g, 'Array<$1>');
                        } else if (schema.type) {
                            return type2tsDict[schema.type] || 'any';
                        } else {
                            console.error('无法识别响应类型=>', schema);
                            return 'any';
                        }
                    } else {
                        return 'any';
                    }
                })(response.schema)
            });
        }
    }
    return requestList;
};

/**
 * 生成请求文件
 * @param {保存的根目录} saveRoot
 * @param {类型文件路径（不携带后缀）} typeFile
 * @param {请求列表} requestList
 */
const writeReqestFile = function (saveRoot, typeFile, requestList) {
    // 生成请求子项模板
    const toRequestItemTmpl = function (requestItem) {
        const queryParams = requestItem.params.filter(it => it.in === 'query');
        const url = `'${requestItem.requestUrl}'`;
        const urlStr = queryParams.length > 0 ? `mergeUrl(${url}, {${queryParams.map(it => it.name).join(',')}})` : url;
        const data = requestItem.params.find(it => it.in === 'body');
        const paramsStr = requestItem.params.map(it => `${it.name}${it.required ? '' : '?'}:${it.type || 'any'}`).join(', ');
        return [
            ,
            `/*`,
            ` * ${requestItem.description}`,
            requestItem.params.map(it => ` * @param {${it.description}} ${it.name}`).join(lineTag),
            ' */',
            `export const ${requestItem.name} = function(${paramsStr}):Promise<HttpResponse<${requestItem.response || 'any'}>>{`,
            `${tabTag}return httpServer.${requestItem.type}(${urlStr}${data ? `,${data.name}` : ''});`,
            '};'
        ].join(lineTag);
    };
    // 生成请求文件模板
    const toRequestFileTmpl = function (requestList) {
        // 提取使用的类型
        const useTypeList = (function () {
            const typeList = [];
            const baseTypeList = ['number', 'string', 'boolean', 'Array', '[]', 'any', 'object', 'File'];
            const parseType = function (typeStr) {
                // 前面添加<，处理成泛型进行替换处理
                return ('<' + typeStr).replace(/<([^<^>^,]*)/g, ($0, $1) => {
                    if (!baseTypeList.includes($1)) {
                        typeList.push($1);
                    }
                });
            };
            requestList.forEach(requestItem => {
                parseType(requestItem.response);
                requestItem.params.forEach(param => {
                    parseType(param.type);
                });
            });
            return dict2List(list2dict(typeList, it => it));
        })();

        return [
            `import {HttpResponse, mergeUrl } from '@kjts20/tool';`,
            `import {httpServer } from '@kjts20/tool-weixin-mp';`,
            `import {${useTypeList.join(', ')}} from '${typeFile}';`,
            requestList.map(requestItem => toRequestItemTmpl(requestItem)).join(lineTag)
        ].join(lineTag);
    };
    const requestFileDict = listGroupBy(requestList, it => it.fileName);
    for (const fileName in requestFileDict) {
        writeFile(`${saveRoot}/${fileName}.ts`, toRequestFileTmpl(requestFileDict[fileName]));
    }
};
/**
 * 生成类型与请求列表
 */
const generateTypesAndServiceList = async function () {
    // 获取项目基础信息
    const { data: projectSetting } = await get(projectBaseUrl);
    const { selectorOptionBeanList, beanGenericityList, selectorMapperItemList } = projectSetting;
    const typeAndServiceTypeList = [];
    const typeRoot = 'types';
    const serviceRoot = 'services';
    // 类型与服务列表
    for (const apiInfo of swaggerApiList) {
        const document = await get(apiInfo.docUrl);
        if (!document) {
            console.error('文档找不到=>', apiInfo);
            continue;
        }
        const { tags, paths, definitions } = document;
        // 生成类型数据
        const typeList = typeDecorate(toTypesList(definitions, beanGenericityList), selectorMapperItemList, selectorOptionBeanList);
        // 生成service
        const serviceList = toRequestList(tags, paths);
        typeAndServiceTypeList.push({
            ...apiInfo,
            document,
            typeList,
            serviceList
        });
        // 写入类型文件
        const typeDecrption = ['/*', ' * @author: sskj-generator', ` * @description: ${apiInfo.description}`, ` * @url: ${apiInfo.docUrl}`, ' */'].join(lineTag);
        const typeFileName = `${typeRoot}/${apiInfo.name}`;
        writeTypeFile(`${typeFileName}.ts`, typeDecrption, typeList);
        // 写入请求文件
        const serviceBaseFileName = `${serviceRoot}/${apiInfo.name}`;
        writeReqestFile(serviceBaseFileName, `../../${typeFileName}`, serviceList);
    }

    // 写入文件
    writeJson('test.json', typeAndServiceTypeList);
};

generateTypesAndServiceList();
