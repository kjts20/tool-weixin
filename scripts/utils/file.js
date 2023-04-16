const {
    join
} = require('path');
const fs = require('fs');
const {
    error
} = require('console');
const {
    fileURLToPath
} = require('url');

//读取所有的文件
function scanDir(fileOrDir, fileHandler, folderHandler) {
    if (fs.existsSync(fileOrDir)) {
        const stat = fs.statSync(fileOrDir);
        if (stat.isFile()) {
            if (typeof fileHandler === 'function') {
                fileHandler(fileOrDir);
            }
        } else if (stat.isDirectory()) {
            // 文件夹处理函数
            if (typeof folderHandler === 'function') {
                folderHandler(folderName);
            }
            fs.readdir(fileOrDir, function (err, files) {
                if (err || !Array.isArray(files)) {
                    return console.error('读取文件夹错误', err);
                } else {
                    files.forEach(file => {
                        scanDir(join(fileOrDir, file), fileHandler, folderHandler);
                    });
                }
            });
        } else {
            console.error('文件类型识别错误', stat, fileOrDir);
        }
    } else {
        console.error('文件夹不存在！！！', dir);
    }
}

// 删除文件夹
function deleteFolderOrFile(fileOrDir) {
    if (fs.existsSync(fileOrDir)) {
        const stat = fs.statSync(fileOrDir);
        if (stat.isFile()) {
            fs.unlinkSync(fileOrDir);
        } else if (stat.isDirectory()) {
            fs.readdirSync(fileOrDir).forEach(file => {
                deleteFolderOrFile(join(fileOrDir, file));
            });
            fs.rmdirSync(fileOrDir);
        } else {
            console.error('文件类型识别错误', stat, fileOrDir);
        }
    }
}

//读取文件夹
const readDir = (dir, fileHandle) => scanDir(dir, fileHandle)

//删除文件夹
const deleteDir = dir => deleteFolderOrFile(dir)

//创建文件的文件夹
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

// 写入json文件
const writeJson = function (fileName, jsonObj) {
    fs.writeFile(fileName, JSON.stringify(jsonObj, null, '\t'), err => {
        if (!err) {
            console.log(`写入${fileName}成功`);
        } else {
            console.error(`写入${fileName}失败：`, err);
        }
    });
}

// 写入ts文件
const writeTsConfig = function (fileName, exportDict) {
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

// 读取json文件
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

// 读取文件
const readFile = function (fileName) {
    return fs.readFileSync(fileName).toString();
}

// 写入文件（普通文件）
const writeFile = function (fileName, fileContent) {
    createFileDir(fileName);
    const trim = txt => txt.replace(/^\n*([\w\W]*)\n*$/, '$1');
    //创建文件
    fs.writeFileSync(fileName, trim(fileContent));
};

module.exports = {
    readDir,
    scanDir,
    deleteDir,
    createFileDir,
    writeTsConfig,
    writeJson,
    readJson,
    writeFile,
    readFile
}