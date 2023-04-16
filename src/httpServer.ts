import { HttpResponse, HttpServer, isStr } from '@kjts20/tool';
import { getToken } from './services/auth';

export const httpServer = new HttpServer({
    host: '',
    apiPrefix: '/api',
    setHeader: function () {
        // 登录token
        const token = getToken();
        const useHeader = {};
        if (isStr(token)) {
            useHeader['token'] = token;
        }
        return useHeader;
    },
    request: wx.request,
    uploadFile: wx.request,
    responseIntercept: (response: HttpResponse) => response
});
export const get: HttpServer['get'] = (...args) => httpServer.get(...args);
export const post: HttpServer['post'] = (...args) => httpServer.post(...args);
export const postJson: HttpServer['postJson'] = (...args) => httpServer.postJson(...args);
export const put: HttpServer['put'] = (...args) => httpServer.put(...args);
export const del: HttpServer['del'] = (...args) => httpServer.del(...args);
export const upload: HttpServer['upload'] = (...args) => httpServer.upload(...args);
