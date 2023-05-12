const { list2dict, dict2List } = require('../../utils/object');
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
        this.setData({ formData: {}, formErr: {} });
    }
});
`;
};

const toFormWxml = (requestProperties) => {
    const params = requestProperties.map((it) => {
        const { valueType, enumValues } = it;
        if (valueType.isDateArr) {
            return `<form-date-range label="${it.label}" name="${it.name}" value="{{formData.${it.name}}}" placeholder="请输入${it.label}" status="error" tips="{{formErr.${it.name}}}"/>`;
        } else if (valueType.isArray || Array.isArray(enumValues)) {
            const enumVals = (Array.isArray(enumValues) ? enumValues : []).map((it) => `{name: '${it.name}', value: '${it.value}'}`).join(', ');
            return `<form-value-array label="${it.label}" name="${it.name}" value="{{formData.${it.name}}}" list="{{ [${enumVals}] }}" placeholder="请输入${it.label}" status="error" tips="{{formErr.${it.name}}}"/>`;
        } else if (valueType.isDate) {
            return `<form-date label="${it.label}" name="${it.name}" value="{{formData.${it.name}}}" placeholder="请输入${it.label}" status="error" tips="{{formErr.${it.name}}}"/>`;
        } else if (valueType.isInt) {
            return `<t-input label="${it.label}" name="${it.name}" value="{{formData.${it.name}}}" type="number" placeholder="请输入${it.label}" status="error" tips="{{formErr.${it.name}}}"/>`;
        } else {
            return `<t-input label="${it.label}" name="${it.name}" value="{{formData.${it.name}}}" placeholder="请输入${it.label}" status="error" tips="{{formErr.${it.name}}}"/>`;
        }
    });
    return `<custom-page>
    <form bindsubmit="onSubmit" bindreset="onReset">
        <scroll-view class="height--120" scroll-y>
            ${params.join('\r\n            ')}
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

const toFormJson = (title, properties) => {
    const useComponents = [];
    properties.forEach((it) => {
        const { valueType, enumValues } = it;
        if (valueType.isDateArr) {
            useComponents.push('"form-date-range": "xxx"');
        } else if (valueType.isArray || Array.isArray(enumValues)) {
            useComponents.push('"form-value-array": "xxx"');
        } else if (valueType.isDate) {
            useComponents.push('"form-date": "xxx"');
        } else {
            useComponents.push(' "t-input": "tdesign-miniprogram/input/input"');
        }
    });
    return `{
    "navigationBarTitleText": "${title}",
    "usingComponents": {
        ${dict2List(list2dict(useComponents, (it) => it)).join(',\r\n         ')}
    }
}`;
};
const toFormScss = (paramsType, responseType) => `

`;

module.exports = {
    toFormTs,
    toFormWxml,
    toFormJson,
    toFormScss
};
