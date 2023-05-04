import { isFunc, isObj, isStr, obj2RequestUrl, requestStr2Obj, toJson, urlDecode } from '@kjts20/tool';
import { error, getCurrentPage, getLoginUserId, goto } from '@kjts20/tool-weixin-mp';
import { selectedTabbar } from '../tools/customTabbar';
import { noteShare } from '../tools/sysShare';

/**
 * 扩展微信页面
 * @param UsePage
 */
const extendPage = (UsePage) => {
    /**
     * 预览图片
     */
    const previewImage = function ({ currentTarget: { dataset } }) {
        const { imgs, img } = dataset;
        const imgList = (imgs || []).map((it) => it.accessUrl || it);
        if (!imgList.includes(img)) {
            imgList.unshift(img);
        }
        wx.previewImage({
            current: img,
            urls: imgList
        });
    };

    /**
     * 跳转页面
     */
    const gotoPage = function ({ currentTarget: { dataset } }) {
        const { page, options } = dataset;
        if (isStr(page)) {
            goto(page, isObj(options) ? options : {});
        } else {
            error('page没有定义，无法跳转！！！', { page, options });
        }
    };

    return (pageObj) => {
        // 预览图片方法
        !pageObj.previewImage && (pageObj.previewImage = previewImage);
        // 页面跳转
        !pageObj.goto && (pageObj.goto = gotoPage);

        // 是否调用onShow方法
        const _isCanShow = pageObj.isCanShow;
        pageObj.isCanShow = function (...args) {
            const self = this;
            if (isFunc(_isCanShow)) {
                return _isCanShow.call(self, ...args);
            } else {
                return true;
            }
        };

        // 显示方法
        const _onShow = pageObj.onShow;
        pageObj.onShow = function (...args) {
            const self = this;
            // tabbar菜单选中
            selectedTabbar(self);

            // 是否调用onShow
            if (self.isCanShow() && isFunc(_onShow)) {
                _onShow.call(self, ...args);
            }
        };

        // 是否调用onShow方法
        const _isCanLoad = pageObj.isCanLoad;
        pageObj.isCanLoad = function (...args) {
            const self = this;
            if (isFunc(_isCanLoad)) {
                return _isCanLoad.call(self, ...args);
            } else {
                return true;
            }
        };

        // onLoad方法
        const _onLoad = pageObj.onLoad;
        pageObj.onLoad = function (options) {
            const self = this;
            // 后端生成的二维码，扫码进来时候携带scene，解析到options
            if (options && isStr(options.scene)) {
                options = {
                    ...options,
                    ...requestStr2Obj(urlDecode(urlDecode(options.scene)))
                };
            }

            // 统一url解密（在跳转时候统一进行url加密）
            for (const key in options || {}) {
                options[key] = urlDecode(options[key]);
            }

            // 记录溯源信息
            const pageOptions = options || {};
            const { _from, _share_options } = pageOptions;
            if (_from === 'share_menu') {
                noteShare('分享按钮', _from, _share_options);
            } else if (_from === 'share') {
                noteShare('页面分享', _from, _share_options);
            } else if (_from === 'qrcode') {
                noteShare('二维码分享', _from, _share_options);
            } else if (isStr(_from)) {
                noteShare('未知', _from, _share_options);
            }

            // 分享路径中有参数，那么就解析出来
            if (isStr(_share_options)) {
                const shareOpt = toJson(urlDecode(_share_options));
                for (const key in shareOpt) {
                    options[key] = shareOpt[key];
                }
                // [自定义分享函数] 回调到分享函数
                const _onLoadShare = pageObj.onLoadShare;
                if (isFunc(_onLoadShare)) {
                    _onLoadShare.call(self, shareOpt);
                }
            }
            delete pageOptions._share_options;
            delete pageOptions._from;

            // 保存参数
            if (isObj(options)) {
                self.pageReceiptArgs = pageOptions;
            }

            // 是否调用onLoad
            if (self.isCanLoad() && isFunc(_onLoad)) {
                _onLoad.call(self, pageOptions);
            }
        };

        // 分享
        const _onShareAppMessage = pageObj.onShareAppMessage;
        pageObj.onShareAppMessage = function (e) {
            const self = this;
            // 分享结果
            let shareRes = null;
            if (isFunc(_onShareAppMessage)) {
                shareRes = _onShareAppMessage.call(self, e);
            }
            if (isObj(shareRes)) {
                return shareRes;
            } else {
                const currentPage = getCurrentPage();
                const routeArgs = {
                    _from: e.from || 'share_menu',
                    _share_options: {
                        ...self.pageReceiptArgs,
                        shareUserId: getLoginUserId(),
                        ...(e.target?.dataset || {})
                    }
                };
                console.log(routeArgs);
                return {
                    title: '时时科技给您分享了小程序',
                    path: `/${currentPage.route}?` + obj2RequestUrl(routeArgs)
                };
            }
        };

        return UsePage(pageObj);
    };
};
const originalPage = Page;
Page = extendPage(originalPage);
