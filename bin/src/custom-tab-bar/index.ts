import { goto, storage } from '@kjts20/tool-weixin-mp';
import { tabBar } from '@/config/tabbar';
import { isNumStr, getListIndex } from '@kjts20/tool';
import { getTabbarMsgDict, saveMsgDictKey, saveTabbarMsgDict } from '@/lib/tools/customTabbar';
import { EVEVT_VAR, systemEvent } from '@/lib/tools/systemEvent';

Component({
    data: {
        value: '',
        list: tabBar.list.map((it) => ({
            value: it.pagePath,
            label: it.text,
            icon: it['icon'],
            pagePath: it.pagePath,
            count: 0
        })),
        // 消息条数字典
        msgCountDict: {}
    },
    lifetimes: {
        ready() {
            // 监听tabbar消息
            const msgEvent = systemEvent.on(EVEVT_VAR.SYSTEM_MESSAGE, (route, num) => {
                const index = getListIndex(this.data.list, (it) => it.pagePath === route);
                this.setMsgNum({ index, num });
            });
            this.setData({ msgEvent });
        },
        detached() {
            // 取消监听
            systemEvent.off(EVEVT_VAR.SYSTEM_MESSAGE, this.data.msgEvent);
        }
    },
    methods: {
        listenerMsgChange(route: string, num: number) {},
        onShow({ index }) {
            const { list } = this.data;
            this.setData({
                value: list[index].value,
                msgCountDict: getTabbarMsgDict()
            });
        },

        // 跳转
        goto({ currentTarget: { dataset } }) {
            goto(dataset.page);
        },

        // 设置消息
        setMsgNum({ index, num }) {
            if (isNumStr(index) && index >= 0) {
                const msgCountDict = storage.getStorageSync(saveMsgDictKey) || {};
                msgCountDict[index] = num;
                this.setData({ msgCountDict });
                saveTabbarMsgDict(msgCountDict);
            }
        }
    }
});
