/**
 * 首字母大写
 * @param {字符串} str
 * @returns
 */
var firstUpperCase = function (str) {
    if (typeof str === 'string') {
        return str.slice(0, 1).toUpperCase() + str.slice(1);
    } else {
        return str;
    }
};

/**
 * 首字母小写
 * @param {字符串} str
 * @returns
 */
var firstLowerCase = function (str) {
    if (typeof str === 'string') {
        return str.slice(0, 1).toLocaleLowerCase() + str.slice(1);
    } else {
        return str;
    }
};

/**
 * js语法冲突
 */
const jsSyntaxConflict = {
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
    name.replace(/\-([a-z])/g, (_, $1) => $1.toUpperCase()).replace(/[a-zA-Z0-9\_\$]+/g, $0 => namePart.push($0));
    const nameStr = namePart.join('');
    // 过滤关键字
    return jsSyntaxConflict[nameStr] || nameStr;
};

module.exports = {
    firstLowerCase: firstLowerCase,
    firstUpperCase: firstUpperCase,
    toJsName: toJsName
};
