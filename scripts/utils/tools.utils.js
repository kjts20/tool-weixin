/**
 * 获取node参数字典
 * @param  argsList  node参数（process.argv）
 */
function getArgs(argsList) {
    // 参数获取
    const args = {};
    const argsRe = /^\s*([a-zA-Z0-9$_-]+)=(.*?)\s*$/;
    for (const it of argsList) {
        if (argsRe.test(it)) {
            args[it.replace(argsRe, '$1')] = it.replace(argsRe, '$2');
        }
    }
    return args;
}

// 数组生成目录
function arr2Path(paths) {
    if (Array.isArray(paths)) {
        return paths.join('/').replace(/\\/g, '/')
    } else {
        return '';
    }
}

module.exports = {
    getArgs: getArgs,
    arr2Path: arr2Path
}