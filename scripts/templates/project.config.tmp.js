module.exports = {
    description: '项目配置文件，详见文档：https://developers.weixin.qq.com/miniprogram/dev/devtools/projectconfig.html',
    packOptions: {
        ignore: [],
        include: []
    },
    miniprogramRoot: 'src/',
    compileType: 'miniprogram',
    projectname: 'sskj-tmpl',
    setting: {
        useCompilerPlugins: ['typescript', 'sass'],
        urlCheck: true,
        coverView: true,
        es6: true,
        postcss: true,
        lazyloadPlaceholderEnable: false,
        preloadBackgroundData: false,
        minified: true,
        autoAudits: false,
        uglifyFileName: false,
        uploadWithSourceMap: true,
        enhance: true,
        useMultiFrameRuntime: true,
        showShadowRootInWxmlPanel: true,
        packNpmManually: true,
        packNpmRelationList: [
            {
                packageJsonPath: './package.json',
                miniprogramNpmDistDir: './src/'
            }
        ],
        minifyWXSS: true,
        useStaticServer: true,
        showES6CompileOption: false,
        checkInvalidKey: true,
        babelSetting: {
            ignore: [],
            disablePlugins: [],
            outputPath: ''
        },
        disableUseStrict: false,
        minifyWXML: true,
        ignoreDevUnusedFiles: false,
        ignoreUploadUnusedFiles: false
    },
    simulatorType: 'wechat',
    simulatorPluginLibVersion: {},
    condition: {},
    srcMiniprogramRoot: 'src/',
    appid: 'wx012ce8ab843b6995',
    libVersion: '2.24.5',
    editorSetting: {
        tabIndent: 'insertSpaces',
        tabSize: 4
    }
};
