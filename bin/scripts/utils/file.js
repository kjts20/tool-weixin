const fs = require('fs');
const { resolve, join } = require('path');

// 换行标记
const lineTag = '\r\n';
// tab标记
const tabTag = '    ';

/**
 * 扫描文件夹
 * @param {文件夹或者名称} fileOrFolder
 * @param {选项} options
 */
function scanFolderOrFile(fileOrFolder, options) {
    if (fs.existsSync(fileOrFolder)) {
        // 整理处理函数
        const { fileHandler, beforeFolderReadHandler, afterFolderReadHandler } = options || {};
        const sFileHandler = typeof fileHandler === 'function' ? fileHandler : () => {};
        const sBeforeFolderReadHandler = typeof beforeFolderReadHandler === 'function' ? beforeFolderReadHandler : () => true;
        const sAfterFolderReadHandler = typeof afterFolderReadHandler === 'function' ? afterFolderReadHandler : () => {};
        // 判断类型并进行回调
        const stat = fs.statSync(fileOrFolder);
        if (stat.isFile()) {
            sFileHandler(fileOrFolder);
        } else if (stat.isDirectory()) {
            if (sBeforeFolderReadHandler(fileOrFolder)) {
                fs.readdirSync(fileOrFolder).forEach(file => {
                    scanFolderOrFile(resolve(fileOrFolder, file), options);
                });
                sAfterFolderReadHandler(fileOrFolder);
            }
        }
    }
}

/**
 * 删除目录/文件
 * @param {文件夹或者名称} fileOrFolder
 */
function deleteFolderOrFile(fileOrFolder) {
    scanFolderOrFile(fileOrFolder, {
        fileHandler: function (fileName) {
            fs.unlinkSync(fileName);
        },
        afterFolderReadHandler: function (folder) {
            fs.rmdirSync(folder);
        }
    });
}

/**
 * 复制目录/文件
 * @param {源文件夹} fromFolderOrFile
 * @param {目标文件夹} toFolderOrFile
 */
function copyFolderOrFile(fromFolderOrFile, toFolderOrFile) {
    scanFolderOrFile(fromFolderOrFile, {
        fileHandler: function (fileName) {
            const targetSrc = join(toFolderOrFile, fileName.replace(fromFolderOrFile, ''));
            fs.copyFileSync(fileName, targetSrc);
        },
        beforeFolderReadHandler: function (folderName) {
            const targetSrc = join(toFolderOrFile, folderName.replace(fromFolderOrFile, ''));
            !fs.existsSync(targetSrc) && fs.mkdirSync(targetSrc, { recursive: true });
            return true;
        }
    });
}

/**
 * 创建文件的文件夹
 * @param {文件名称} fileName
 */
const createFileDir = function (fileName) {
    if (typeof fileName === 'string') {
        //先把fileName进行切割，再进行合并
        const fileDirList = fileName.replace(/\\/g, '/').split('/');
        fileDirList.pop(); //去掉文件名
        const fileDir = fileDirList.join('/');
        if (!fs.existsSync(fileDir)) {
            fs.mkdirSync(fileDir, {
                recursive: true
            });
        }
    }
};

/**
 * 写入json文件
 * @param {文件名称} fileName
 * @param {文件对象} jsonObj
 */
const writeJson = function (fileName, jsonObj) {
    fs.writeFile(fileName, JSON.stringify(jsonObj, null, 4), err => {
        if (!err) {
            console.log(`写入${fileName}成功`);
        } else {
            console.error(`写入${fileName}失败：`, err);
        }
    });
};

/**
 * 写入ts文件
 * @param {文件名} fileName
 * @param {导出的对象} exportDict
 */
const writeTsConfig = function (fileName, exportDict) {
    createFileDir(file);
    const fileContentList = [];
    if (typeof exportDict === 'object' && exportDict !== null) {
        for (const exportName in exportDict) {
            fileContentList.push(`export const ${exportName}  = ${JSON.stringify(exportDict[exportName], null, 4)};`);
        }
    }
    fs.writeFile(fileName, fileContentList.join('\r\n'), err => {
        if (!err) {
            console.log(`写入${fileName}成功`);
        } else {
            console.error(`写入${fileName}失败：`, err);
        }
    });
};

/**
 * 读取json文件
 * @param {文件名} fileName
 * @returns
 */
const readJson = function (fileName) {
    if (fs.existsSync(fileName) && fs.statSync(fileName).isFile()) {
        try {
            return JSON.parse(fs.readFileSync(fileName).toString());
        } catch (err) {
            console.error(`读取${fileName}文件失败：`, err);
        }
    }
    return null;
};

/**
 * 读取文件
 * @param {文件名} fileName
 * @returns
 */
const readFile = function (fileName) {
    return fs.readFileSync(fileName).toString();
};

/**
 * 写入文件（普通文件）
 * @param {文件名称} fileName
 * @param {文件内容} fileContent
 */
const writeFile = function (fileName, fileContent) {
    createFileDir(fileName);
    const trim = txt => txt.replace(/^\n*([\w\W]*)\n*$/, '$1');
    //创建文件
    fs.writeFileSync(fileName, trim(fileContent));
};

module.exports = {
    lineTag,
    tabTag,
    scanFolderOrFile,
    deleteFolderOrFile,
    copyFolderOrFile,
    createFileDir,
    writeTsConfig,
    writeJson,
    readJson,
    writeFile,
    readFile
};
