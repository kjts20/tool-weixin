// swagger文档设置
const swaggerApiList = [
    {
        name: 'baseService',
        docUrl: 'http://127.0.0.1:8098/v2/api-docs?group=基础服务',
        description: '基础服务'
    }
];

// 项目基础配置文件
const projectBaseUrl = 'http://127.0.0.1:8098/common/tools/selector/options-relation';

module.exports = {
    swaggerApiList: swaggerApiList,
    projectBaseUrl: projectBaseUrl
};
