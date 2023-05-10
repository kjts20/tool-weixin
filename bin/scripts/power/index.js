const { getPowerList } = require('./config');
const { lineTag, tabTag, writeFile } = require('../utils/file');
const { get } = require('../utils/request');

/**
 * 获取权限列表
 * 返回的数据：
 */
const getPowerData = async function () {
    const {
        data: { system, custom }
    } = await get(getPowerList);
    const listPower = (list, type) =>
        (list || []).map(it => ({
            type: type || it.type,
            name: it.name,
            description: it.description
        }));
    return {
        system: listPower(system, 'system'),
        custom: listPower(custom, 'custom')
    };
};

/**
 * 写入设置文件
 * @param {文件名称} fileName
 * @param {选择器实体名称} selectorOptionBeanList
 */
const writePowerFile = function (fileName, systemList, customList) {
    const toItemTmpl = function (item) {
        return [`${tabTag}// ${item.description}`, `${tabTag}${item.name}: '${item.type}.${item.name}'`].join(lineTag);
    };
    const toSectionTmpl = function (name, description, powerList) {
        return ['/**', ' * ' + description, ' */', `export const ${name}Power = {`, powerList.map(it => toItemTmpl(it)).join(',' + lineTag), '};'].join(lineTag);
    };
    writeFile(fileName, [toSectionTmpl('system', '系统权限', systemList), toSectionTmpl('custom', '自定义权限', customList)].join(lineTag.repeat(2)));
};

// 启动函数
(async function (rootDir) {
    try {
        // 获取权限菜单
        const { system, custom } = await getPowerData();
        // 写入文件
        writePowerFile(`${rootDir}/config/power.ts`, system, custom);
    } catch (e) {
        console.error('基础信息、文档信息写入错误：', e.message || e);
    }
})(process.argv[2]);
