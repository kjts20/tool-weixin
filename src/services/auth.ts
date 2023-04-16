import { confirm, error, hideLoading, toast } from '../wx.tools';
import { toIndex, goto, isTabbarPage, getCurrentPage } from '../navigator';
import { isFunc, isNum, isObj, isStr, json2Obj } from '@kjts20/tool';
import { storage } from '../storage';
import { get, postJson } from '../httpServer';
// ======================= 配置 ================================
const config = {
    api: {
        login: '/common/user/get-auth-login',
        register: '/common/user/register-user',
        getByKey: '/common/setting/getByKey',
        checkToken: '/common/user/check-token'
    },
    routes: {
        login: 'routes.main.commonLogin'
    }
};
export const setApi = function (key, value) {
    config.api[key] = value;
};
export const setRoute = function (key, value) {
    config.routes[key] = value;
};
// ======================= 登录与注销  ==========================
// 保存用户信息key
const saveUserInfoKey = 'login-userInfo';
// 保存登录token
const saveUseTokenKey = 'login-token';

// 登录接口
export const authLogin = function (code, userInfo, signature, iv, rawData, encryptedData) {
    return userLoginAfter(
        postJson(config.api.login, {
            code,
            signature,
            iv,
            rawData,
            encryptedData,
            userInfo: JSON.stringify(userInfo)
        })
    );
};

// 用户登录
const userLoginAfter = function (loginPromise: Promise<any>) {
    return new Promise((resolve: (res: { user: Object; token: string }) => void, reject) => {
        loginPromise
            .then(res => {
                if (res.success) {
                    const loginInfo = updateLoginUserInfo(res.data);
                    if (loginInfo) {
                        return resolve(loginInfo);
                    } else {
                        console.error('写入登录信息错误=>', res);
                        return reject(res);
                    }
                } else {
                    console.error('授权登录失败=>', res);
                    return reject(res);
                }
            })
            .catch(err => {
                error('授权登录错误', err);
                return reject(err);
            });
    });
};

// 用户注册
export const weixinUserRegisterAndLogin = function (params, userInfo) {
    return userLoginAfter(
        postJson(config.api.register, {
            ...params,
            userInfo: JSON.stringify(userInfo)
        })
    );
};

// 获取登录的用户
export const getLoginUser = function () {
    const user = wx.getStorageSync(saveUserInfoKey);
    if (isLegalUser(user)) {
        return user;
    } else {
        return null;
    }
};

// 是否登录
export const getLoginStatus = function () {
    const loginUser = getLoginUser();
    const token = getToken();
    return isStr(token) && isObj(loginUser) && loginUser.id;
};

// 获取登录用户的用户id
export const getLoginUserId = function () {
    const user = getLoginUser();
    if (isObj(user) && user.id) {
        return user.id;
    } else {
        return -1;
    }
};

// 删除token
export const removeToken = function () {
    storage.removeStorage(saveUseTokenKey);
};

// 退出登录
export const logout = function () {
    storage.removeStorage(saveUserInfoKey);
    storage.removeStorage(saveUseTokenKey);
    return Promise.resolve();
};

// 更新用户信息
export const updateLoginUser = function (updateObj) {
    if (isObj(updateObj)) {
        storage.getStorage(saveUserInfoKey).then(user => {
            if (isObj(user)) {
                setLoginUser({ ...user, ...updateObj });
            }
        });
    } else {
        console.error('更新信息错误，必须是一个对象', updateObj);
    }
};

// 设置登录信息
export const setLoginUser = function (user) {
    if (isLegalUser(user)) {
        storage.setStorageSync(saveUserInfoKey, user);
        return true;
    } else {
        console.error('用户信息不合法');
        return false;
    }
};

// 清除用户信息
export const clearUser = function () {
    return storage.removeStorage(saveUserInfoKey);
};

// 保存token信息
export const setToken = function (token) {
    if (token) {
        storage.setStorageSync(saveUseTokenKey, token);
        return true;
    } else {
        console.error('token不存在或者非法', token);
        return false;
    }
};

// 获取token
export const getToken = function () {
    return storage.getStorageSync(saveUseTokenKey);
};

// 更新登录用户信息
export const updateLoginUserInfo = function (data, cb?) {
    if (isObj(data) && isStr(data.token) && isObj(data.sysUser)) {
        const { sysUser, token, extension, userExtraInfo } = data;
        const user = { ...sysUser, extension, userExtraInfo };
        // 更新用户信息
        setLoginUser(user);
        setToken(token);
        if (isFunc(cb)) {
            cb(user, token);
        }
        return { user, token };
    } else {
        return null;
    }
};

// 记录中断请求
let checkTokenTask: Array<any> = [];
const abortCheckTokenTask = function () {
    for (const task of checkTokenTask) {
        try {
            task.abort();
        } catch (error) {}
    }
    checkTokenTask = [];
};

//检查是否登录
export const checkToken = function (cb?) {
    return new Promise((resolve, reject) => {
        abortCheckTokenTask();
        getUserInfo()
            .then(userInfo => {
                postJson(config.api.checkToken, userInfo, {
                    getRequestTask(task) {
                        checkTokenTask.push(task);
                    }
                }).then(res => {
                    if (res.success) {
                        updateLoginUserInfo(res.data, cb);
                        resolve(res.data);
                    } else {
                        console.error('系统错误', res);
                        reject(res);
                    }
                });
            })
            .catch(err => {
                reject(err);
            });
    });
};

// 检查是否是合法的用户信息
const isLegalUser = function (user) {
    return typeof user === 'object' && user !== null && user.id;
};

// 是否登录
export const isLogin = function (showTip = false) {
    const user = getLoginUser();
    if (isObj(user) && isNum(user.id) && isStr(getToken())) {
        return true;
    } else {
        if (showTip) {
            setTimeout(() => {
                hideLoading();
            });
            confirm('需要登录才能体验完整功能', '登录提示', '去登录', '再看看')
                .then(() => {
                    goto(config.routes.login);
                })
                .catch(() => {
                    const lastRouter = getCurrentPage();
                    if (!isTabbarPage(lastRouter?.route)) {
                        toIndex();
                    }
                });
        }
        return false;
    }
};

// 获取用户信息（如果成功就直接登录）
interface IGetUserResolve {
    code: string;
    encryptedData: string;
    iv: string;
    userInfo: string;
    signature: string;
    rawData: string;
}
const getUserInfo = function () {
    return new Promise((resolve: (res: IGetUserResolve) => void, reject) => {
        wx.getSetting({
            success: function (res) {
                if (res && res.authSetting && res.authSetting['scope.userInfo'] === true) {
                    wx.login({
                        success: res => {
                            const code = res.code;
                            if (typeof code === 'string' && code !== '') {
                                wx.getUserInfo({
                                    lang: 'zh_CN',
                                    success: getUserRes => {
                                        const { encryptedData, iv, userInfo, signature, rawData } = getUserRes;
                                        if (typeof encryptedData === 'string' && encryptedData !== '' && typeof iv === 'string' && iv !== '') {
                                            resolve({
                                                code,
                                                encryptedData,
                                                iv,
                                                userInfo: JSON.stringify(userInfo),
                                                signature,
                                                rawData
                                            });
                                        } else {
                                            reject('用户信息错误=>' + JSON.stringify(getUserRes));
                                        }
                                    },
                                    fail: err => {
                                        reject(err);
                                    }
                                });
                            } else {
                                reject('wx.login的code不合法=>' + code);
                            }
                        },
                        fail: err => {
                            reject(err);
                        }
                    });
                } else {
                    reject('没有授权过');
                }
            },
            fail: function (err) {
                reject(err);
            }
        });
    });
};

// ================== 设置 ===================

// 设置里面键的类型
enum ESettingKT {
    listImg = 'list-img',
    listString = 'list-string'
}

// 保存数据格式
interface ISetting {
    key: string;
    val: any;
    keyType: ESettingKT;
    description: string;
}

// 保存设置的key
const saveSettingKey = 'sskj-setting';

// 保存用户设置到缓存
export const saveSetting = function (data: ISetting[], host?: string) {
    const goalData: any[] = [];
    // 解析数据
    if (Array.isArray(data) && data.length > 0) {
        data.forEach(it => {
            if (isObj(it) && isStr(it.keyType) && isStr(it.key)) {
                let val = json2Obj(it.val);
                goalData.push({
                    key: it.key,
                    val,
                    description: it.description,
                    keyType: it.keyType
                });
            }
        });
    }
    storage.setStorage(saveSettingKey, goalData);
    return goalData;
};

// 获取用户设置（缓存）
export const getSettingStorage = function () {
    return storage.getStorageSync(saveSettingKey);
};

// 获取用户设置
export const getSetting = function (fromApi = false) {
    return new Promise((resolve: (list: ISetting[]) => void, reject) => {
        if (isLogin(false)) {
            const _resolve = function (listData: ISetting[]) {
                if (Array.isArray(listData) && listData.length > 0) {
                    resolve(listData.filter(it => isObj(it)));
                } else {
                    reject({
                        msg: '数据错误',
                        data: listData
                    });
                }
            };
            const _getDataFromApi = function () {
                getSettingFromApi()
                    .then(list => {
                        _resolve(list);
                    })
                    .catch(err => {
                        reject({
                            msg: '请求设置数据错误',
                            data: err
                        });
                    });
            };
            if (fromApi) {
                _getDataFromApi();
            } else {
                wx.getStorage({
                    key: saveSettingKey,
                    success: function (res) {
                        let list = res.data;
                        if (Array.isArray(list) && list.length > 0) {
                            _resolve(list);
                        } else {
                            _getDataFromApi();
                        }
                    },
                    fail: function () {
                        _getDataFromApi();
                    }
                });
            }
        } else {
            reject({
                msg: '未登录'
            });
        }
    });
};

// 通过接口获取api信息
const getSettingFromApi = function () {
    return new Promise((resolve: (data: ISetting[]) => void, reject) => {
        get(config.api.getByKey)
            .then(res => {
                if (res.success && res.data) {
                    const { host, setting } = res.data;
                    if (isStr(host) && Array.isArray(setting)) {
                        return resolve(saveSetting(setting, host));
                    }
                }
                reject({
                    msg: '数据请求错误',
                    data: res
                });
            })
            .catch(err => {
                reject({
                    msg: '网络错误',
                    data: err
                });
            });
    });
};
