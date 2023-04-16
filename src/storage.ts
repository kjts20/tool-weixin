import { CommonStorage } from '@kjts20/tool';
import { error } from './wx.tools';

export const storage = new CommonStorage(
    {
        getStorage: wx.getStorage,
        getStorageSync: wx.getStorageSync,
        setStorage: wx.setStorage,
        setStorageSync: wx.setStorageSync,
        removeStorage: wx.removeStorage,
        clearStorage: wx.clearStorage
    },
    error
);
