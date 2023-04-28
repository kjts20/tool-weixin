const { getPowerList } = require('./config/power');
const { lineTag, tabTag, writeFile } = require('./utils/file');
const { get } = require('./utils/request');
/**
 * 模拟接口数据
 */
// const mock = {data: {
//     system: [
//         {name: 'productSalePrice',description: '商品>售价'},
//         {name: 'productPifaPrice',description: '商品>售价'}
//     ],
//     custom: [
//         {name: 'indexBabber', description: '首页tabbar'},
//         {name: 'controlMenu',description: '工作台菜单'}
//     ]
// }};

/**
 * 获取权限列表
 * 返回的数据：
 */
const getPowserData = async function () {
    const {
        data: { system, custom }
    } = await get(getPowerList);
    const listPowser = (list, type) =>
        (list || []).map((it) => ({
            type: type || it.type,
            name: it.name,
            description: it.description
        }));
    return {
        system: listPowser(system, 'system'),
        custom: listPowser(custom, 'custom')
    };
};

/**
 * 写入设置文件
 * @param {文件名称} fileName
 * @param {选择器实体名称} selectorOptionBeanList
 */
const writePowserFile = function (fileName, systemList, customList) {
    const toItemTmpl = function (item) {
        return [`${tabTag}// ${item.description}`, `${tabTag}${item.name}: '${item.type}.${item.name}'`].join(lineTag);
    };
    const toSectionTmpl = function (name, description, powserList) {
        return ['/**', ' * ' + description, ' */', `export const ${name}Powser = {`, powserList.map((it) => toItemTmpl(it)).join(',' + lineTag), '};'].join(lineTag);
    };
    writeFile(fileName, [toSectionTmpl('system', '系统权限', systemList), toSectionTmpl('custom', '自定义权限', customList)].join(lineTag.repeat(2)));
};

// 启动函数
(async function (rootDir) {
    try {
        // 获取权限菜单
        const { system, custom } = await getPowserData();
        // 写入文件
        writePowserFile(`${rootDir}/config/power.ts`, system, custom);
    } catch (e) {
        console.error('基础信息、文档信息写入错误：', e.message || e);
    }
})(process.argv[2]);
