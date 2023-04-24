import { isObj, isStr } from '@kjts20/tool';
import { error, goto } from '@kjts20/tool-weixin-mp';

/**
 * 扩展微信组件
 * @param UseComponent
 */
const extendComponent = (UseComponent) => {
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

    return (componentObj) => {
        // 预览图片方法
        !componentObj.previewImage && (componentObj.previewImage = previewImage);
        // 页面跳转
        !componentObj.goto && (componentObj.goto = gotoPage);
        return UseComponent(componentObj);
    };
};
const originalComponent = Component;
Component = extendComponent(originalComponent);
