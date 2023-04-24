import { isTabbarPage, getTabbarPageIndex, storage } from '@kjts20/tool-weixin-mp';
import { isObj, isFunc } from '@kjts20/tool';

/**
 * 设置tabbar状态（是否显示tabbar）
 * @param self 页面对象
 * @param status 状态
 */
const setTabbarStatus = function (pageThis, status: boolean) {
    if (isTabbarPage()) {
        if (isObj(self) && isFunc(pageThis.getTabBar)) {
            const tabbarPage = pageThis.getTabBar();
            if (isObj(tabbarPage) && isFunc(tabbarPage.setData)) {
                tabbarPage.setData({
                    hideTabbar: status
                });
            }
        }
    }
};
export const hideTabbar = function (pageThis: WechatMiniprogram.Page.Instance<any, any>) {
    setTabbarStatus(pageThis, true);
};
export const showTabbar = function (pageThis: WechatMiniprogram.Page.Instance<any, any>) {
    setTabbarStatus(pageThis, false);
};

/**
 * 设置tabbar使用tabbar
 * @param self 页面对象
 * @param pageRoute
 */
export const selectedTabbar = function (pageThis: WechatMiniprogram.Page.Instance<any, any>) {
    const route = pageThis.route;
    const selectedIndex = getTabbarPageIndex(route);
    if (selectedIndex >= 0) {
        const tabbarPage = pageThis.getTabBar();
        if (isObj(tabbarPage) && isFunc(tabbarPage.onShow)) {
            tabbarPage.onShow({ index: selectedIndex, route });
        }
    }
};

/**
 * 设置tabbar的消息数量
 * @param pageThis
 * @param pageRoute
 * @param msgNum
 */
export const setTabbarMsgNum = function (pageThis: WechatMiniprogram.Page.Instance<any, any>, msgNum: number) {
    const route = pageThis.route;
    if (route) {
        const index = getTabbarPageIndex(route);
        if (index >= 0) {
            const tabbarPage = pageThis.getTabBar();
            if (isObj(tabbarPage) && isFunc(tabbarPage.setMsgNum)) {
                tabbarPage.setMsgNum({ index, num: msgNum });
            }
        }
    } else {
        console.error('路由加载错误~~', route);
    }
};

/**
 * 保存tabbar消息的键
 */
export const saveMsgDictKey = 'tabbar-msg';

/**
 * 消息列表
 */
export const crearTabbarMsg = function () {
    return storage.removeStorage(saveMsgDictKey);
};
export const saveTabbarMsgDict = function (msgCountDict) {
    return storage.setStorageSync(saveMsgDictKey, msgCountDict);
};
export const getTabbarMsgDict = function () {
    return storage.getStorageSync(saveMsgDictKey) || {};
};
