const { projectBaseUrl, swaggerApiList } = require('./config');
const { writeJson, lineTag, tabTag, writeFile } = require('../utils/file');
const { get } = require('../utils/request');
const { list2dict, listGroupBy, dict2List } = require('../utils/object');
const { firstLowerCase, firstUpperCase, toJsName } = require('../utils/string');
const { join } = require('path');

/**
 * [字典]java类型-ts类型
 */
const type2tsDict = {
    number: 'number',
    int: 'number',
    integer: 'number',
    string: 'string',
    boolean: 'boolean',
    file: 'File',
    Map: 'object'
};

/**
 * [字典]format-校验
 */
const format2validateDict = {
    'date-time': 'validateDate',
    int32: 'validateInt',
    int64: 'validateInt'
};
/**
 * [字典]format-数组校验
 */
const format2ArrValidateDict = {
    'date-time': 'validateDateRange'
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
                    format: it?.format || it?.items?.format || null,
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
                    if (method === 'delete') {
                        return 'del';
                    } else {
                        return method.toLowerCase();
                    }
                }
            })();
            const response = responses['200'];
            requestList.push({
                requestUrl: url,
                fileName,
                name: toJsName(firstLowerCase(fileName.replace(/^(.*?)controller$/i, '$1')) + firstUpperCase(name)),
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
        // 形参字符串
        const paramsStr = (function (params) {
            const requiredParams = params.filter(it => it.required);
            const otherParams = params.filter(it => !it.required);
            // 使用微信文件上传
            const toTypeStr = typeStr => (typeStr === 'File' ? 'WechatMiniprogram.MediaFile' : typeStr || 'any');
            return [...requiredParams, ...otherParams].map(it => `${it.name}${it.required ? '' : '?'}:${toTypeStr(it.type)}`).join(', ');
        })(requestItem.params);
        // 请求的url与数据
        const queryParams = requestItem.params.filter(it => it.in === 'query');
        const url = `'${requestItem.requestUrl}'`;
        let urlStr = url;
        let dataStr = '';
        if (requestItem.type === 'postJson' || requestItem.type === 'put') {
            urlStr = queryParams.length > 0 ? `mergeUrl(${url}, {${queryParams.map(it => it.name).join(',')}})` : url;
            const body = requestItem.params.find(it => it.in === 'body');
            dataStr = body ? `, ${body.name}` : '';
        } else {
            dataStr = queryParams.length > 0 ? `, {${queryParams.map(it => it.name).join(', ')}}` : '';
            if (requestItem.type === 'upload') {
                const fileName = requestItem.params.find(it => it.in === 'formData' && it.type === 'File').name;
                dataStr = `, ${fileName || null}${dataStr}`;
            }
        }
        const responseType = (requestItem.response || 'any').replace('BaseResponse', 'HttpResponse');
        return [
            ,
            `/*`,
            ` * ${requestItem.description}`,
            requestItem.params.map(it => ` * @param {${it.description || '*'}} ${it.name}`).join(lineTag),
            ' */',
            `export const ${requestItem.name} = function(${paramsStr}):Promise<${responseType}>{`,
            `${tabTag}return httpServer.${requestItem.type}(${urlStr}${dataStr});`,
            '};'
        ]
            .filter(it => it)
            .join(lineTag);
    };
    // 生成请求文件模板
    const toRequestFileTmpl = function (requestList) {
        // 提取使用的类型
        const useTypeList = (function () {
            const typeList = [];
            const baseTypeList = ['number', 'string', 'boolean', 'Array', '[]', 'any', 'object', 'Map', 'File', 'BaseResponse'];
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
        // 子项
        const itemsContent = requestList.map(requestItem => toRequestItemTmpl(requestItem)).join(lineTag);
        return [
            `import {HttpResponse, mergeUrl } from '@kjts20/tool';`,
            `import {httpServer } from '@kjts20/tool-weixin-mp';`,
            useTypeList.length > 0 ? `import {${useTypeList.join(', ')}} from '${typeFile}';` : null,
            itemsContent
        ]
            .filter(it => it)
            .join(lineTag);
    };
    const requestFileDict = listGroupBy(requestList, it => it.fileName);
    for (const fileName in requestFileDict) {
        writeFile(`${saveRoot}/${fileName}.ts`, toRequestFileTmpl(requestFileDict[fileName]));
    }
};

/**
 * 写入设置文件
 * @param {文件名称} fileName
 * @param {选择器实体名称} selectorOptionBeanList
 */
const writeSettingFile = function (fileName, selectorOptionBeanList) {
    const toItemTmpl = function (item) {
        return [, `// ${item.description}`, `export const ${item.name} = ${JSON.stringify(item.values, null, 4)};`].join(lineTag);
    };
    writeFile(fileName, selectorOptionBeanList.map(it => toItemTmpl(it)).join(lineTag));
};

/**
 * 生成表单验证列表
 * @param {请求列表} serviceList
 * @param {类型列表} typeList
 */
const toFormValidateList = function (serviceList, typeList) {
    const typeDict = list2dict(typeList, it => it.name);
    const validataList = [];
    serviceList.forEach(serviceItem => {
        serviceItem.params
            .filter(it => it.in === 'body' && typeDict[it.type])
            .forEach(it => {
                const typeObj = typeDict[it.type];
                const properties = typeObj.properties;
                // 如果参数是非必填的，那么里面所有的属性都非必填
                if (!it.required) {
                    properties.forEach(it => {
                        it.required = false;
                    });
                }
                validataList.push({
                    ...typeObj,
                    properties: properties.map(param => {
                        const validates = [];
                        const { type, required, format } = param;
                        // 校验规则
                        const isArr = /^Array<.*?>$/.test(type);
                        // 是否必填
                        if (required) {
                            if (isArr) {
                                validates.push('validateArrRequired');
                            } else {
                                validates.push('validateRequired');
                            }
                        }
                        // 格式校验
                        if (format) {
                            const validate = (isArr ? format2ArrValidateDict : format2validateDict)[format] || null;
                            if (validate) {
                                validates.push(validate);
                            } else {
                                console.log('无法识别的格式=>', param);
                            }
                        }
                        return {
                            ...param,
                            validates
                        };
                    }),
                    validateName: `validate${firstUpperCase(typeObj.name)}`
                });
            });
    });
    return dict2List(list2dict(validataList, it => it.name));
};

/**
 * 写入表单校验文件
 * @param {文件名称} fileName
 * @param {校验文件} validataList
 */
const writeFormValidateFile = function (fileName, validataList) {
    let validateList = [];
    const toItemParamsTmpl = function (param) {
        const { name, description, validates } = param;
        validateList = validateList.concat(validates);
        return `{column: '${name}', title: '${description}', validate: [${validates.join(', ')}]}`;
    };
    const toItemTmpl = function (item) {
        return [`// ${item.description}`, `export const ${item.validateName} = [`, item.properties.map(it => tabTag + toItemParamsTmpl(it)).join(',' + lineTag), '];'].join(lineTag);
    };
    const toFileTmpl = function (list) {
        const itemsContents = list.map(it => toItemTmpl(it));
        return [`import { ${Array.from(new Set(validateList)).join(', ')} } from "@kjts20/tool";`, ...itemsContents].join(lineTag.repeat(2));
    };
    writeFile(fileName, toFileTmpl(validataList));
};

/**
 * 生成类型与请求列表
 * @param {项目根目录} projectRoot
 */
const generateTypesAndServiceList = async function (projectRoot = 'miniprogram') {
    // 获取项目基础信息
    const { data: projectSetting } = await get(projectBaseUrl);
    const { selectorOptionBeanList, beanGenericityList, selectorMapperItemList } = projectSetting;
    const serviceRoot = 'services';
    const typeRoot = `types`;
    const apiRoot = `apis`;
    const validateRoot = `validates`;

    // 类型与服务列表
    const documentNoteList = [];
    for (const apiInfo of swaggerApiList) {
        const document = await get(apiInfo.docUrl);
        if (!document) {
            console.error('文档找不到=>', apiInfo);
            throw new Error('请到cli/config/document.js中验证文档地址、项目配置地址！！！');
        }
        const { tags, paths, definitions } = document;

        // 生成service
        const serviceList = toRequestList(tags, paths);

        // 生成类型数据
        const typeListSource = toTypesList(definitions, beanGenericityList);
        const typeWithMapper = typeDecorate(typeListSource, selectorMapperItemList, selectorOptionBeanList);
        const typeList = (function (types, services) {
            // 请求中可选参数的对象获取
            const noRequiredTypes = [];
            services.forEach(service => {
                service?.params?.forEach(param => {
                    if (param && param.in === 'body' && !param.required && !noRequiredTypes.includes(param.type)) {
                        noRequiredTypes.push(param.type);
                    }
                });
            });
            // 可选参数对象获取
            return types.map(it => {
                if (noRequiredTypes.includes(it.name) && !it.required) {
                    it.required = [];
                    it.properties.forEach(propertie => {
                        propertie.required = false;
                    });
                }
                return it;
            });
        })(typeWithMapper, serviceList);

        // 写入类型文件
        const typeDecrption = ['/*', ' * @author: sskj-generator', ` * @description: ${apiInfo.description}`, ` * @url: ${apiInfo.docUrl}`, ' */'].join(lineTag);
        const typeFileName = `${typeRoot}/${apiInfo.name}`;
        writeTypeFile(`${projectRoot}/${serviceRoot}/${typeFileName}.ts`, typeDecrption, typeList);

        // 写入service文件
        writeReqestFile(`${projectRoot}/${serviceRoot}/${apiRoot}/${apiInfo.name}`, `../../${typeFileName}`, serviceList);

        // 生成表单验证数据
        const validateList = toFormValidateList(serviceList, typeList);
        // 写入表单验证文件
        writeFormValidateFile(`${projectRoot}/${serviceRoot}/${validateRoot}/${apiInfo.name}.ts`, validateList);

        // 记录写入文件记录
        documentNoteList.push({
            ...apiInfo,
            typeList,
            serviceList,
            validateList
        });
    }

    // 写入枚举文件（系统配置文件）
    const settingRoot = `config`;
    writeSettingFile(`${projectRoot}/${settingRoot}/settings.ts`, selectorOptionBeanList);

    // 返回文档记录列表
    return documentNoteList;
};

// 生成类型、服务列表
(function (rootDir, scriptFileName) {
    try {
        generateTypesAndServiceList(rootDir).then(noteList => {
            writeJson(join(scriptFileName, '../note.json'), noteList);
        });
    } catch (e) {
        console.error('基础信息、文档信息写入错误：', e.message || e);
    }
})(process.argv[2], process.argv[1]);
