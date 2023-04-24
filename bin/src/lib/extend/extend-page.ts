import { isFunc, isObj, isStr } from '@kjts20/tool';
import { error, goto } from '@kjts20/tool-weixin-mp';
import { selectedTabbar } from '../tools/customTabbar';

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

        return UsePage(pageObj);
    };
};
const originalPage = Page;
Page = extendPage(originalPage);
