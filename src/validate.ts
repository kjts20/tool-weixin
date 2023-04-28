import { IColumn, validateForm } from '@kjts20/tool';
import { error } from './wx.tools';

/**
 * 表单校验
 * @param validateRules 验证规则
 * @param formData 表单数据
 * @param showTip 是否显示提示
 * @returns
 */
export const formValidate = function <TData = any>(validateRules: Array<IColumn>, formData: TData, showTip = true) {
    return new Promise((resolve: (data: TData) => void, reject: (err: object) => void) => {
        const errDict = validateForm(validateRules, formData);
        const keys = Object.keys(errDict);
        if (keys.length > 0) {
            if (showTip) {
                error(errDict[keys[0]]);
            }
            reject(errDict);
        } else {
            resolve(formData);
        }
    });
};
