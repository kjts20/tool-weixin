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

module.exports = {
    firstLowerCase: firstLowerCase,
    firstUpperCase: firstUpperCase
};
