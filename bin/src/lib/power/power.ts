import { biList2Dict } from '@kjts20/tool';
import { resFilter, storage } from '@kjts20/tool-weixin-mp';
import { powerGetUserPowerList } from '@/services/apis/baseService/PowerController';

// 权限字段
const powerKey = 'system-power';

// 设置权限
export const setPowerFromApi = function () {
    resFilter.unifyRemind(powerGetUserPowerList()).then(list => {
        const powerList = (list || []).filter(it => it && it.status).map(({ type, name, value }) => ({ type, name, value }));
        storage.setStorageSync(
            powerKey,
            biList2Dict(
                powerList,
                it => `${it.type}.${it.name}`,
                it => it.value
            )
        );
    });
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
