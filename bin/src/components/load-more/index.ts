Component({
    options: {
        styleIsolation: 'apply-shared',
        multipleSlots: true
    },
    properties: {
        waiting: {
            type: Boolean,
            value: false
        },
        paging: Object,
        loadingText: {
            type: String,
            value: '加载中...'
        },
        noMoreText: {
            type: String,
            value: '没有更多了~'
        },
        emptyText: {
            type: String,
            value: '没有任何数据～'
        },
        useEmptySlot: {
            type: Boolean,
            value: false
        }
    },

    data: {},

    methods: {
        // 重试
        onRetry() {
            this.triggerEvent('retry');
        }
    }
});
