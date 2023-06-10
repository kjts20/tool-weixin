import { HttpResponse, HttpServer, firstUpperCase, isFunc, isStr } from '@kjts20/tool';
import { getToken } from './services/auth';

export const httpServer = new HttpServer({
    host: '',
    apiPrefix: '/api',
    setHeader: function () {
        const func = httpServerConfig.setHeader;
        return isFunc(func) ? func() : {};
    },
    request: wx.request,
    uploadFile: wx.uploadFile,
    responseIntercept(response: HttpResponse) {
        const func = httpServerConfig.responseIntercept;
        return isFunc(func) ? func(response) : response;
    }
});
/**
 * 请求配置
 */
export const httpServerConfig = {
    // 设置头部
    setHeader() {
        // 登录token
        const token = getToken();
        const useHeader = {};
        if (isStr(token)) {
            useHeader['token'] = token;
        }
        return useHeader;
    },
    // 设置响应拦截
    responseIntercept(response: HttpResponse) {
        return response;
    }
};

export const get: HttpServer['get'] = (...args) => httpServer.get(...args);
export const post: HttpServer['post'] = (...args) => httpServer.post(...args);
export const postJson: HttpServer['postJson'] = (...args) => httpServer.postJson(...args);
export const put: HttpServer['put'] = (...args) => httpServer.put(...args);
export const del: HttpServer['del'] = (...args) => httpServer.del(...args);
export const upload: HttpServer['upload'] = (...args) => httpServer.upload(...args);

// 初始化请求
export const initHttpServer = function (host) {
    httpServer.host = host;
    return httpServer;
};
