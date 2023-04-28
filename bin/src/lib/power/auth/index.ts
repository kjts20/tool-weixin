import { getPower } from '@/lib/power/power';
import { isUndefined, toJson } from '@kjts20/tool';

Component({
    options: {
        multipleSlots: true
    },
    properties: {
        // 权限名称
        name: {
            type: String,
            observer(name) {
                // 获取权限相关信息
                const powserVal = getPower(name);
                // 没有设置就是没有权限
                const hasAuth = !isUndefined(powserVal);
                this.setData({ init: true, hasAuth }, () => {
                    if (hasAuth) {
                        this.triggerEvent('auth', { name, value: toJson(powserVal) });
                    } else {
                        this.triggerEvent('no-auth', { name });
                    }
                });
            }
        },
        // 显示loading
        loading: {
            type: Boolean,
            value: true
        }
    }
});
