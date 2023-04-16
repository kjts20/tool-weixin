import { isNum, isObj, isStr } from '@kjts20/tool';
const logger = wx.getRealtimeLogManager();

// 记录日志
export const sendErr = function (...args) {
    console.warn('发送错误：', ...args);
    logger.error(...args);
};

export const error = function (title, err: any = null, callback?, waitTime?) {
    console.warn('error函数提醒=>', { title, err });
    logger.warn('error函数提醒=>', title, err);
    wx.showToast({
        title: title || '系统开小差了～',
        icon: 'none',
        duration: 2500,
        complete: () => {
            if (typeof callback === 'function') {
                let time = parseInt(waitTime);
                time = isNaN(time) ? 0 : time;
                setTimeout(() => {
                    callback();
                }, time);
            }
        }
    });
};

export const success = function (title, cb?, timer?) {
    const time = parseInt(timer);
    const showTimer = isNaN(time) ? 1500 : time;
    wx.showToast({
        title,
        duration: showTimer,
        complete: function () {
            if (typeof cb === 'function') {
                setTimeout(cb, showTimer);
            }
        }
    });
};

export const toast = function (title, isShowIcon = false) {
    wx.showToast({
        title,
        icon: isShowIcon === true ? 'success' : 'none',
        duration: 1500
    });
};

export const confirm = function (content, confirmText = '确定', cancelText = '取消', title = '') {
    return new Promise((resolve, reject) => {
        wx.showModal({
            title,
            content,
            confirmText,
            cancelText,
            success: function (res) {
                if (res.confirm) {
                    return resolve(true);
                } else {
                    return reject();
                }
            },
            fail: function (err) {
                console.error('confirm弹窗错误=>', { err });
                return reject();
            }
        });
    });
};

export const alert = function (content, confirmText = '确定', title = '系统提醒你') {
    return new Promise((resolve, reject) => {
        wx.showModal({
            title,
            content,
            showCancel: false,
            confirmText: confirmText ? confirmText : '确定',
            success: function (res) {
                if (res.confirm) {
                    return resolve(true);
                } else {
                    return reject();
                }
            },
            fail: function (err) {
                console.log('【alert错误】=>', err);
                return reject();
            }
        });
    });
};

export const hideTabBar = function () {
    wx.hideTabBar({
        fail: err => {
            console.log('隐藏失败=>', err);
        }
    });
};

let loadingTimer;
export const customLoading = function (title = '加载中', time, callback?, maskStatus: boolean = true) {
    hideLoading();
    wx.showLoading({
        mask: maskStatus,
        title
    });
    const hideTime = isNum(time) && time > 0 ? time : 3000;
    loadingTimer = setTimeout(() => {
        hideLoading();
        if (typeof callback === 'function') {
            callback();
        }
    }, hideTime);
};

export const loading = function (title = '加载中', callback?: Function, time?: number, maskStatus: boolean = true) {
    // 最长30s
    const hideTime = time !== undefined && isNum(time) && time > 0 ? time : 30 * 1000;
    customLoading(title, hideTime, callback, maskStatus);
};

let hideLoadingTimer;
export const hideLoading = function (time = 0) {
    clearTimeout(loadingTimer);
    if (typeof time === 'number' && time > 0) {
        clearTimeout(hideLoadingTimer);
        hideLoadingTimer = setTimeout(() => {
            wx.hideLoading();
        }, time);
    } else {
        wx.hideLoading();
    }
};

// 获取节点信息
export const querySelector = function (componentThis, selector) {
    return new Promise((resolve: (list: any[]) => void, reject) => {
        if (isStr(selector)) {
            const query = wx.createSelectorQuery().in(componentThis);
            query.select(selector).boundingClientRect();
            query.selectViewport();
            query.exec(res => {
                if (Array.isArray(res)) {
                    const selectors = res.filter(it => isObj(it));
                    if (selectors.length > 0) {
                        resolve(selectors);
                        return;
                    }
                }
                reject({
                    msg: '节点没有找到',
                    data: res
                });
            });
        } else {
            reject({
                msg: '节点错误',
                data: selector
            });
        }
    });
};

// 获取登录的code
export const getLoginCode = function () {
    return new Promise((resolve: (res: string) => void, reject) => {
        wx.login({
            success: res => {
                resolve(res.code);
            },
            fail: err => {
                reject(err);
            }
        });
    });
};

// 是否是ios
export const isIos = function () {
    const systemInfo = wx.getSystemInfoSync();
    const platform = systemInfo.platform.toUpperCase();
    return platform === 'IOS';
};

// 检查更新
export const checkUpdate = function () {
    if (canUse()) {
        // 可用情况下才进行版本检查
        const updateManager = wx.getUpdateManager();
        if (checkSDKVersion() && updateManager) {
            updateManager.onCheckForUpdate(function (res) {
                if (res.hasUpdate) {
                    wx.showLoading({
                        title: '版本更新中'
                    });
                }
            });
            updateManager.onUpdateReady(function () {
                wx.hideLoading();
                wx.showModal({
                    title: '更新提醒',
                    content: '系统已经更新完毕',
                    confirmText: '重启系统',
                    showCancel: false,
                    success: function (res) {
                        if (res.confirm) {
                            updateManager.applyUpdate();
                        }
                    }
                });
            });
            updateManager.onUpdateFailed(function () {
                wx.showModal({
                    title: '更新提示',
                    showCancel: false,
                    content: '检查到有新版本，但下载失败，请检查网络设置',
                    success: function (res) {
                        if (res.confirm) {
                            updateManager.applyUpdate();
                        }
                    }
                });
            });
        } else {
            wx.updateWeChatApp();
        }
    } else {
        // 不可用，就直接提示更新微信
        wx.showModal({
            title: '微信版本提醒',
            content: '微信版本过低',
            showCancel: false,
            confirmText: '更新微信版本',
            success: function (res) {
                wx.updateWeChatApp();
            },
            fail: function () {
                wx.updateWeChatApp();
            }
        });
    }
};

/**
 * 版本号转换为int
 * @param version
 */
const toIntVersion = function (version) {
    return Number(
        version
            .split('.')
            .map(it => parseInt(it))
            .filter(it => isNum(it))
            .map(it => (it < 10 ? '0' : '') + it)
            .join('')
    );
};

/**
 * 获取当前版本
 */
export const getCurSdkVersion = () => toIntVersion(wx.getSystemInfoSync().SDKVersion);

// 检查版本是否可用
const checkSDKVersion = function (version = '2.20.3') {
    return getCurSdkVersion() >= toIntVersion(version);
};

// 是否可以使用
const canUse = function () {
    const checkUseApi = ['button.open-type.getUserInfo', 'button.open-type.getPhoneNumber', 'getSystemInfoSync.return.safeArea', 'openBluetoothAdapter'];
    for (const it of checkUseApi) {
        if (!wx.canIUse(it)) {
            return false;
        }
    }
    return true;
};

// 用户自动登录
export const getUserInfo = function () {
    return new Promise((resolve: (res: any) => void, reject) => {
        wx.login({
            success({ code }) {
                wx.getUserInfo({
                    success(res) {
                        resolve({
                            code,
                            ...res
                        });
                    },
                    fail(err) {
                        reject(err);
                    }
                });
            },
            fail(err) {
                reject(err);
            }
        });
    });
};

// 保存图片
const wxSaveImageToPhotosAlbum = function (src, saveName?) {
    return new Promise((resolve, reject) => {
        //文件名设置为时间戳
        let fileName = saveName || new Date().valueOf();
        //下载图片到本地
        wx.downloadFile({
            url: src,
            filePath: wx.env.USER_DATA_PATH + '/' + fileName + '.png',
            success(res) {
                if (res.statusCode === 200) {
                    let img = res.filePath;
                    // 只支持本地图片所以要先把图片下载下来
                    wx.saveImageToPhotosAlbum({
                        filePath: img,
                        success(result) {
                            toast('已保存至相册');
                            resolve(result);
                        },
                        fail(err) {
                            if (/cancel/.test(err.errMsg)) {
                                toast('取消保存');
                            } else {
                                error('保存失败', err);
                            }
                            reject(err);
                        }
                    });
                } else {
                    error('保存失败', res);
                    reject(res);
                }
            },
            fail(err) {
                error('下载图片失败', err);
                reject(err);
            }
        });
    });
};

// 保存图片
export const saveImageToPhotosAlbum = function (src) {
    return new Promise((resolve, reject) => {
        wx.getSetting({
            success: res => {
                if (res.authSetting['scope.writePhotosAlbum']) {
                    wxSaveImageToPhotosAlbum(src).then(resolve).catch(reject);
                } else if (res.authSetting['scope.writePhotosAlbum'] === undefined) {
                    wx.authorize({
                        scope: 'scope.writePhotosAlbum',
                        success() {
                            wxSaveImageToPhotosAlbum(src).then(resolve).catch(reject);
                        },
                        fail(err) {
                            if (!/cancel/.test(err.errMsg)) {
                                error('您没有授权，无法保存到相册', err);
                            } else {
                                toast('授权取消');
                            }
                            reject(err);
                        }
                    });
                } else {
                    wx.openSetting({
                        success(res) {
                            if (res.authSetting['scope.writePhotosAlbum']) {
                                wxSaveImageToPhotosAlbum(src).then(resolve).catch(reject);
                            } else {
                                error('您没有授权，无法保存到相册', res);
                                reject(res);
                            }
                        },
                        fail(err) {
                            reject(err);
                        }
                    });
                }
            },
            fail(err) {
                error('获取授权失败', err);
                reject(err);
            }
        });
    });
};
