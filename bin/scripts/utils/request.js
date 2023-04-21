let http = require('http');
let qs = require('querystring');

// 生成相应的数据
const toResponseData = function (data, headers) {
    if (/application\/json/.test(headers['content-type']) && typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch (error) {}
    }
    return data;
};

/**
 * post请求
 * @param {请求地址} url
 * @param {数据} data
 * @param {请求头} headers
 * @returns
 */
const post = function (url, data, headers) {
    return new Promise((resolve, reject) => {
        const req = http.request(
            {
                url,
                method: 'POST',
                headers
            },
            res => {
                res.setEncoding('utf8');
                // 监听返回的数据
                const chunkList = [];
                res.on('data', chunk => chunkList.push(chunk));
                res.on('end', () => {
                    resolve(toResponseData(chunkList.join(''), res.headers));
                });
            }
        );
        if (typeof data !== 'undefined' && data !== null && data !== '') {
            req.write(typeof data === 'object' ? qs.stringify(data) : data);
        }
        req.on('error', reject);
    });
};

// 封装get请求
const get = function (url, data, headers = {}) {
    return new Promise((resolve, reject) => {
        const queryUrl = [url, qs.stringify(data || {})].filter(it => it).join(/\?/.test(url) ? '&' : '?');
        const req = http.get(
            queryUrl,
            {
                headers
            },
            res => {
                res.setEncoding('utf8');
                // 监听返回的数据
                const chunkList = [];
                res.on('data', chunk => chunkList.push(chunk));
                res.on('end', () => {
                    resolve(toResponseData(chunkList.join(''), res.headers));
                });
            }
        );
        req.on('error', reject);
    });
};

// 发送postJson
const postJson = function (url, data, headers = {}) {
    return request(url, data, {
        'content-type': 'application/json',
        ...(headers || {})
    });
};

module.exports = {
    get,
    post,
    postJson
};
