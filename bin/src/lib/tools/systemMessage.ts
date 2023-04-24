import { routes } from '@/config/route';
import { getMessageInterval } from '@/config/env';
import { systemEvent, EVEVT_VAR } from './systemEvent';

// 消息定时器
let msgIntervalTimer;

/**
 * 启动系统消息
 */
export const startSystemMesssage = function () {
    msgIntervalTimer = setInterval(() => {
        const num = Math.floor(Math.random() * 120);
        systemEvent.emit(EVEVT_VAR.SYSTEM_MESSAGE, routes.main.index, num);
    }, getMessageInterval);
};

/**
 * 关闭消息定时器
 */
export const stopSystemMessage = function () {
    clearInterval(msgIntervalTimer);
};
