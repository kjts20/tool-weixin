/**
 * 列表转字典
 * @param {列表} list
 * @param {生成键函数} toKeyHandler
 * @returns
 */
const list2dict = function (list, toKeyHandler) {
    const dict = {};
    for (const it of list) {
        dict[toKeyHandler(it)] = it;
    }
    return dict;
};

/**
 * 列表分组
 * @param {列表} list
 * @param {生成键函数} toKeyHandler
 * @returns
 */
const listGroupBy = function (list, toKeyHandler) {
    const dict = {};
    for (const it of list) {
        const key = toKeyHandler(it);
        if (!Array.isArray(dict[key])) {
            dict[key] = [];
        }
        dict[key].push(it);
    }
    return dict;
};

/**
 * 字典转列表
 * @param {字典} dict
 * @param {保存的键名} keyName
 * @returns
 */
const dict2List = function (dict, keyName) {
    const list = [];
    for (const key in dict) {
        const it = dict[key];
        if (keyName) {
            it[keyName] = key;
        }
        list.push(it);
    }
    return list;
};

module.exports = {
    list2dict: list2dict,
    dict2List: dict2List,
    listGroupBy: listGroupBy
};
