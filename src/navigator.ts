import { mergeUrl, isFunc, isNum, isObj, isStr, deepClone, objEq, trim } from '@kjts20/tool';
// =================== 设置 ============================
const config = {
    tabBar: { list: [] },
    routes: {}
};
export const setTabBar = function (tabBar) {
    config.tabBar = tabBar;
};
export const setRoutes = function (routes) {
    config.routes = routes;
};
// tabbar页面列表
export const toTabbarPageList = () => config.tabBar.list;

// tabbar路径列表
export const toTabbarList = () =>
    toTabbarPageList()
        .filter(it => it)
        .map(it => it.pagePath);

// tabbar首页路径
export const toTabbarIndexPath = () => `/${config.tabBar.list[0].pagePath}`;

// =================== 变量 ===================

// 使用API
export enum EUseApi {
    reLaunch = 'reLaunch',
    redirectTo = 'redirectTo',
    navigateTo = 'navigateTo',
    switchTab = 'switchTab'
}

// 页面栈类型
type TPageHistory = WechatMiniprogram.Page.Instance<Record<string, any>, Record<string, any>>;

/**
 * 获取当前路径
 */
export const getCurrentPage = function (): TPageHistory {
    return getExistPage(0)!;
};

/**
 * 获取在页面栈中存在的页面
 *
 * @param topOrder 页面栈顶排序（当前页面为0，上一级为1）
 */
export const getExistPage = function (topOrder = 0): TPageHistory | null {
    if (isNum(topOrder) && topOrder >= 0) {
        const pages = getCurrentPages();
        const pageNum = pages.length;
        // 获取实际层级（去掉相同页面）
        topOrder = getActualDeltaFromPageStack(pages, topOrder);
        // 存在就直接返回
        if (topOrder < pageNum) {
            return pages[pageNum - (topOrder + 1)];
        } else {
            return null;
        }
    } else {
        throw new Error('栈顶排序不合法');
    }
};

/**
 * 通过页面栈获取页面实际层
 * @param pages 页面栈
 * @param delta 级数
 */
const getActualDeltaFromPageStack = function (pages: Array<TPageHistory>, delta: number) {
    const pageNum = pages.length;
    let newDelta = delta;
    let lastPage: TPageHistory | null = null;
    for (let i = 1; i <= delta; i++) {
        const page = pages[pageNum - i];
        if (isSamePage(lastPage, page)) {
            newDelta++;
        } else {
            lastPage = page;
        }
    }
    return newDelta;
};

/**
 * 获取不带参数的路径
 *
 * @param route 页面路径
 */
const getWithoutArgsRoute = function (route) {
    if (isStr(route)) {
        return route.replace(/^(.*?)\?.*?$/, '$1').replace(/^\/*(.*?)\/*$/, '$1');
    } else {
        console.error('【获取不带参数的路径-路径不是可用的字符串】', route);
        return '';
    }
};

// 判断是否tabbar页面
export const isTabbarPage = function (route?) {
    let pageRoute: string = route;
    if (!isStr(pageRoute)) {
        pageRoute = getCurrentPage()?.route;
    }
    return toTabbarList().includes(getWithoutArgsRoute(pageRoute));
};

// 获取tabbar页面的索引
export const getTabbarPageIndex = function (route?) {
    if (isTabbarPage(route)) {
        const pageRoute = getWithoutArgsRoute(route);
        const tabbarList = toTabbarPageList();
        for (let i = 0; i < tabbarList.length; i++) {
            const it = tabbarList[i];
            if (it.pagePath === pageRoute) {
                return i;
            }
        }
        return -1;
    } else {
        return -1;
    }
};

// 是否相同页面
const isSamePage = function (page1: TPageHistory | null, page2: TPageHistory | null) {
    if (isObj(page1) && isObj(page2)) {
        const router1: any = deepClone(page1);
        const router2: any = deepClone(page2);
        delete router1.options[refreshTagKey];
        delete router2.options[refreshTagKey];
        if (router1.route === router2.route && objEq(router1.options, router2.options)) {
            return true;
        }
    }
    return false;
};

interface IGotoOptions {
    type?: EUseApi;
    sendData?: ISendData;
}
interface ISendData {
    [key: string]: any;
}
// 跳转
export const goto = function (route: string, options: object = {}, other?: IGotoOptions) {
    const { type = EUseApi.navigateTo, sendData = {} } = other || {};
    return new Promise((resolve, reject) => {
        if (isStr(route)) {
            // 判断跳转的类型处理
            let jumpType = type;
            if (isTabbarPage(route) && type !== EUseApi.reLaunch) {
                // tabbar页面不使用relauch，那么就使用switchTab
                jumpType = EUseApi.switchTab;
            } else if (type === EUseApi.switchTab) {
                // 非tabbar页面切换为navigateTo
                console.error(route + '页面不是tabbar页面已经自动切换为navigateTo');
                jumpType = EUseApi.navigateTo;
            }

            // 请求地址处理
            const url = jumpType === EUseApi.switchTab ? getWithoutArgsRoute(route) : mergeUrl(route, options);
            const useApi = wx[jumpType];
            if (isFunc(useApi)) {
                // 如果是reLaunch，就重新调起全局的reLaunch
                if (jumpType === EUseApi.reLaunch) {
                    const app = getApp();
                    app.onLaunch(app.globalData.options);
                }
                // @ts-ignore
                useApi({
                    url: '/' + url,
                    success: function (res) {
                        if (isObj(sendData)) {
                            // 页面传值
                            for (const key in sendData) {
                                res.eventChannel.emit(key, sendData[key]);
                            }
                        }
                        resolve(true);
                    },
                    fail: function (err) {
                        reject({ route, options, err, msg: '跳转失败' });
                    },
                    complete: console.log
                });
            } else {
                reject({ msg: '跳转方式不存在', route, options, jumpType, useApi });
            }
        } else {
            reject({ msg: '跳转失败-页面路径错误', route, options });
        }
    });
};

// 页面刷新的标记（配置中键名）
const refreshTagKey = 'fresh_jump_tag';

// 刷新页面
export const refresh = function (options: object | null = null, type: EUseApi = EUseApi.redirectTo) {
    return new Promise((resolve, reject) => {
        const lastRouter = getCurrentPage();
        if (lastRouter !== null) {
            const newOptions: object = { ...lastRouter.options, ...(options ? options : {}) };
            newOptions[refreshTagKey] = Math.random();
            goto(lastRouter.route, newOptions, { type })
                .then(function () {
                    resolve(true);
                })
                .catch(function () {
                    reject('跳转错误');
                });
        } else {
            reject('页面不存在');
        }
    });
};

/**
 * 返回
 *
 * @param delta 返回的级数
 */
export const back = function (delta: any = 1, ...args) {
    return new Promise((resolve, reject) => {
        const pages = getCurrentPages();
        if (delta && isNum(delta) && delta > 0) {
            // 去掉相同页面
            const pageNum = pages.length;
            if (delta <= pageNum) {
                // 获取实际层级（去掉相同页面）
                delta = getActualDeltaFromPageStack(pages, delta);
            }
            // 创建一个返回回调
            const backPage = pages[pages.length - delta - 1];
            if (isObj(backPage)) {
                const backFunc = backPage.onBack;
                if (isFunc(backFunc)) {
                    backFunc(...args);
                }
            }
        }
        // 页面栈顶中存在多个相同页面
        wx.navigateBack({
            delta,
            success: function (res) {
                resolve(res);
            },
            fail: function (err) {
                reject({ ...(isObj(err) ? err : { err }), delta, pages });
            }
        });
    });
};

/**
 * 跳转到首页
 */
export const toIndex = function () {
    return goto(toTabbarIndexPath(), {}, { type: EUseApi.switchTab });
};

// 系统中所有的路径
const toSysRouters = function (allRoutes) {
    const paths: string[] = [];
    function scanPath(routerDict) {
        if (isObj(routerDict)) {
            for (const name in routerDict) {
                const it = routerDict[name];
                if (isStr(it)) {
                    paths.push(trim(it, '/'));
                } else {
                    scanPath(it);
                }
            }
        }
    }
    scanPath(allRoutes);
    return paths;
};

// 系统是否存在路径
export const routerIsExist = function (router) {
    if (isStr(router)) {
        const r = trim(router.replace(/^(.*?)\?.*?$/, '$1'), '/');
        return toSysRouters(config.routes).includes(r);
    }
    return false;
};
