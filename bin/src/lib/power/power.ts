import { biList2Dict } from '@kjts20/tool';
import { storage } from '@kjts20/tool-weixin-mp';

// 权限字段
const powerKey = 'system-power';

// 设置权限
export const setPowerFromApi = function () {
    setTimeout(() => {
        const powerList = [
            {
                type: 'custom',
                name: 'controlMenu',
                value: `[{"icon": "home", "text":"首页", "path":"/pages/index/index"}]`
            },
            {
                type: 'custom',
                name: 'indexBabber',
                value: `["http://www.ts20.cn/ttt.png"]`
            },
            {
                type: 'system',
                name: 'productSalePrice',
                value: 'true'
            }
        ];
        storage.setStorageSync(
            powerKey,
            biList2Dict(
                powerList,
                it => `${it.type}.${it.name}`,
                it => it.value
            )
        );
    }, 2000);
};

// 清除权限
export const clearPower = function () {
    return storage.removeStorage(powerKey);
};

// 获取权限
export const getPower = function (powerName) {
    const powerDict = storage.getStorageSync(powerKey) || {};
    return powerDict[powerName];
};
