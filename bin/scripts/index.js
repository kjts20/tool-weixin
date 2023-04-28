const fs = require('fs');
const { readDir } = require('./utils/file');
const { scss2Css } = require('./utils/compile');
const { outDir, srcDir } = require('./common');
const childProcess = require('child_process');

//获取参数
const args = {};
const argsList = process.argv;
if (Array.isArray(argsList)) {
    const re = /^\s*(.*?)\s*=\s*(.*?)\s*$/;
    argsList.forEach(it => {
        if (re.test(it)) {
            let res = it.match(re);
            if (res) {
                args[res[1]] = res[2];
            }
        }
    });
}
//是否生产环境
const productMode = args.mode === 'product';

//ts编译js
const ts2jsCmd = ['node', './node_modules/typescript/lib/tsc.js', '--outDir', outDir];

//包含的文件进行，编译成相应的文件
let inputDir = null;
if (Array.isArray(srcDir)) {
    inputDir = [...srcDir];
} else {
    inputDir = [srcDir];
}
//遍历使用的入口文件
inputDir.forEach(input => {
    if (typeof input === 'string' && input !== '' && fs.existsSync(input)) {
        const toDistPath = fileName => (typeof fileName === 'string' ? fileName.replace(input, outDir) : '');
        //判断类型并重新编译
        const compileFile = function (fileName, ignored) {
            if (fs.existsSync(fileName)) {
                //判断是否忽略
                !Array.isArray(ignored) && (ignored = [ignored]);
                if (ignored.filter(it => typeof it === 'object' && it !== null && typeof it.test === 'function' && it.test(fileName)).length > 0) {
                    return;
                }
                let distPath = toDistPath(fileName);
                if (/\.scss$/.test(fileName)) {
                    scss2Css(fileName, distPath.replace(/^(.*?)\.scss$/, '$1.wxss'));
                }
            } else {
                console.warn('源文件不存在已经跳过=>', fileName);
            }
        };
        if (productMode) {
            //编译scss、sass
            ((fileOrDir, ignored) => {
                if (fs.existsSync(fileOrDir)) {
                    const stat = fs.statSync(fileOrDir);
                    if (stat.isFile()) {
                        compileFile(fileOrDir, compileIgnored);
                    } else if (stat.isDirectory()) {
                        readDir(input, function (fileName) {
                            compileFile(fileName, ignored);
                        });
                    } else {
                        console.log('无法识别的文件类型：', fileOrDir);
                    }
                }
            })(input, [/[\/\\]\./, /\.ts$/]);
            //编译ts文件
            try {
                childProcess.exec(ts2jsCmd.join(' ')); //编译ts文件
            } catch (err) {
                return console.log('ts编译出错：', err.stdout.toString());
            }
        } else {
            throw new Error('没有识别命令: ' + args.mode);
        }
    }
});