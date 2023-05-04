/**
 * 记录分享
 */

import { IKeyVal, isObj } from '@kjts20/tool';
import { storage } from '@kjts20/tool-weixin-mp';

// 保存分享信息的键
const saveShareKey = '__sskj-share';

/**
 * 保存分享信息
 * @param title 标题
 * @param from 来源
 * @param options 参数
 */
export const noteShare = function (title, from, options) {
    return storage.setStorage(saveShareKey, { title, from, options });
};

/**
 * 获取分享信息
 */
export const getShare = function () {
    return new Promise((resolve: (res: { title: string; from: string; options: IKeyVal }) => void) => {
        const data = storage.getStorageSync(saveShareKey);
        if (isObj(data) && data.from) {
            resolve(data);
        }
    });
};

/**
 * 清空分享信息
 */
export const clearShare = function () {
    storage.removeStorage(saveShareKey);
};
