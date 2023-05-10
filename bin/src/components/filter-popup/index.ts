Component({
    externalClasses: ['wr-class'],
    properties: {
        show: {
            type: Boolean,
            observer(val) {
                this.setData({ visible: val });
            }
        },
        closeBtn: {
            type: Boolean,
            value: false
        }
    },
    data: { visible: false },
    methods: {
        close() {
            this.triggerEvent('close');
            this.setData({ visible: false });
        }
    }
});
