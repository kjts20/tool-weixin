// swagger文档设置
const swaggerApiList = [
    {
        name: 'baseService',
        docUrl: 'http://192.168.0.158:8091/v2/api-docs?group=基础服务',
        description: '基础服务'
    },
    {
        name: 'commonService',
        docUrl: 'http://192.168.0.158:8091/v2/api-docs?group=公共服务',
        description: '公共服务'
    },
    {
        name: 'client',
        docUrl: 'http://192.168.0.158:8091/v2/api-docs?group=客户端',
        description: '客户端'
    }
];

// 项目基础配置文件
const projectBaseUrl = 'http://192.168.0.158:8091/common/tools/selector/options-relation';

module.exports = {
    swaggerApiList: swaggerApiList,
    projectBaseUrl: projectBaseUrl
};
