const { writeProjectConfig, readProjectConfig, writeTsConfigJson, allEnv, readAppJson, writeAppJson } = require('./common');

/**
 * 环境修改
 */
const changeEnv = function (envStr) {
    if (typeof envStr === 'string' && envStr !== '') {
        const env = envStr.replace(/^env=(.*?)$/, '$1');
        const envIt = allEnv[env];
        if (typeof envIt === 'object' && envIt !== null) {
            const curPc = readProjectConfig();
            if (typeof curPc === 'object' && curPc !== null) {
                // 不检查url合法性
                if (/^http:\/\/.*?$/.test(envIt.host)) {
                    curPc.setting.urlCheck = false;
                } else {
                    curPc.setting.urlCheck = true;
                }
                return writeProjectConfig(curPc, envIt);
            } else {
                return console.log('project.config.json无法读取');
            }
        } else {
            return console.log('无法识别的环境', envStr, env, envit);
        }
    } else {
        return console.log('无法识别的环境', envStr);
    }
};

// 启动环境
(function (typeStr, args2) {
    //获取命令参数
    const typeRe = /^type=(.*?)$/;
    if (typeRe.test(typeStr)) {
        const type = typeStr.replace(typeRe, '$1');
        switch (type) {
            case 'route':
                writeAppJson(readAppJson());
                break;
            case 'project':
                // 项目配置文件书写
                const projectTmpJson = require('./templates/project.config.tmp');
                const rootDir = args2 || 'miniprogram';
                writeProjectConfig(projectTmpJson, allEnv.dev, rootDir);
                // 生成tsconfig.ts
                writeTsConfigJson(require('./templates/tsconfig.tmp'), rootDir);
                // 删除根目录typings文件
                deleteFolderOrFile('./typings');
                break;
            case 'changeEnv':
                changeEnv(args2);
                break;
            default:
                console.error('无法识别的类型：', type);
        }
    } else {
        console.error('第二个参数：type=xxx', typeStr);
    }
})(process.argv[2], process.argv[3]);
