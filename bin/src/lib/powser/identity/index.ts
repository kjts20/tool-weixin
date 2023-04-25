import { getLoginUser, isLogin } from '@kjts20/tool-weixin-mp';

Component({
    options: {
        multipleSlots: true
    },
    properties: {
        // 显示loading
        loading: {
            type: Boolean,
            value: true
        }
    },
    pageLifetimes: {
        show() {
            this.updateLoginStatus();
        }
    },
    lifetimes: {
        created() {
            this.updateLoginStatus();
        }
    },
    methods: {
        updateLoginStatus() {
            if (isLogin()) {
                const loginUser = getLoginUser();
                this.setData(
                    {
                        init: true,
                        loginStatus: true
                    },
                    () => {
                        this.triggerEvent('user', loginUser);
                    }
                );
            } else {
                this.setData({
                    init: true,
                    loginStatus: false
                });
            }
        }
    }
});
