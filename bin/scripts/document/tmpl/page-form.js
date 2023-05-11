const toFormTs = (paramsType, document, service, validate) => {
    return `import { validateForm } from '@kjts20/tool';
import { hideLoading, loading, resFilter } from '@kjts20/tool-weixin-mp';
import { ${service.name} } from '@/services/apis/${document.name}/${service.fileName}';
import { ${validate.validateName} } from '@/services/validates/${document.name}';

Page({
    data: {
        formData: {},
        formErr: {},
        canSubmit: true
    },
    onLoad() {},
    onSubmit({ detail: { value } }) {
        this.setData({ formData: value });
        const formErr = validateForm(${validate.validateName}, value);
        this.setData({ formErr });
        if (Object.keys(formErr).length <= 0) {
            this.setData({ canSubmit: false });
            loading('提交中');
            resFilter
                .unifyRemind(${service.name}(value))
                .then(() => {
                    hideLoading();
                    this.setData({ canSubmit: true });
                })
                .catch(() => {
                    this.setData({ canSubmit: true });
                });
        }
    },
    onReset() {
        this.setData({ formData: {}, formErr: {}, version: Math.random() });
    }
});
`;
};

const toFormWxml = requestProperties => {
    return `<custom-page>
    <form bindsubmit="onSubmit" bindreset="onReset">
        <scroll-view class="height--120" scroll-y>
            ${requestProperties
                .map(it => `<t-input label="${it.description}" value="{{formData.${it.name}}}" name="${it.name}"  placeholder="请输入${it.description}" status="error" tips="{{formErr.${it.name}}}"/>`)
                .join('\r\n            ')}
        </scroll-view>
        <view class="height-120 padding-20-30">
            <view class="btn-group">
                <button class="btn ghost" form-type="reset">重置</button>
                <button disabled="{{!canSubmit}}" class="btn danger color-white" form-type="submit">提交</button>
            </view>
        </view>
    </form>
</custom-page>`;
};

const toFormJson = title => `{
    "navigationBarTitleText": "${title}",
    "usingComponents": {
        "t-input": "tdesign-miniprogram/input/input"
    }
}
`;
const toFormScss = (paramsType, responseType) => `

`;

module.exports = {
    toFormTs,
    toFormWxml,
    toFormJson,
    toFormScss
};
