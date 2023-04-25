import { biList2Dict } from '@kjts20/tool';
import { storage } from '@kjts20/tool-weixin-mp';

// 权限字段
const powserKey = 'system-powser';

// 设置权限
export const setPowserFromApi = function () {
    setTimeout(() => {
        const powserList = [
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
                value: "true"
            }
        ];
        storage.setStorageSync(
            powserKey,
            biList2Dict(
                powserList,
                (it) => `${it.type}.${it.name}`,
                (it) => it.value
            )
        );
    }, 2000);
};

// 清除权限
export const clearPowser = function () {
    return storage.removeStorage(powserKey);
};

// 获取权限
export const getPowser = function (powserName) {
    const powserDict = storage.getStorageSync(powserKey) || {};
    return powserDict[powserName];
};
