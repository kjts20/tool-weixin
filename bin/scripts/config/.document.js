// swagger文档设置
const swaggerApiList = [
    {
        name: 'baseService',
        docUrl: 'http://127.0.0.1:8886/v2/api-docs?group=基础服务',
        description: '基础服务'
    },
    {
        name: 'commonApi',
        docUrl: 'http://127.0.0.1:8886/v2/api-docs?group=公共代码接口',
        description: '公共代码接口'
    },
    {
        name: 'baseApi',
        docUrl: 'http://127.0.0.1:8886/v2/api-docs?group=基础接口',
        description: '基础接口'
    },
    {
        name: 'collection',
        docUrl: 'http://127.0.0.1:8886/v2/api-docs?group=集合接口',
        description: '集合接口'
    }
];

// 项目基础配置文件
const projectBaseUrl = 'http://127.0.0.1:8886/common/tools/selector/options-relation';

module.exports = {
    swaggerApiList: swaggerApiList,
    projectBaseUrl: projectBaseUrl
};
