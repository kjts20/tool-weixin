const { updateRoutes, writeProjectConfig, readProjectConfig, allEnv, readAppJson, writeAppJson } = require('./common');

//获取命令参数
const argsList = process.argv;
const typeStr = argsList[2];
const typeRe = /^type=(.*?)$/;
if (typeRe.test(typeStr)) {
    const type = typeStr.replace(typeRe, '$1');
    switch (type) {
        case 'route':
            // 格式化app.json && 路由更新
            return writeAppJson(readAppJson());
        case 'project':
            // 项目初始化
            return writeProjectConfig(require('./templates/project.config.tmp'), allEnv.dev);
        case 'changeEnv': {
            // 环境修改
            let envStr = argsList[3];
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
        }
        default:
            console.error('无法识别的类型：', type);
    }
} else {
    console.error('第二个参数：type=xxx', typeStr);
}
