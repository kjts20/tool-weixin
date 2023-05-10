const toPageTs = (paramsType, responseType, document, service) => {
    return `import { error, resFilter } from '@kjts20/tool-weixin-mp';
import { defaultPaging, IKeyVal, isFunc, isStr, objFilter } from '@kjts20/tool';
import { ${service.name} } from '@/services/apis/${document.name}/${service.fileName}';
import { ${responseType.name} } from '@/services/types/${document.name}';

Page({
    data: {
        init: true,
        // 下拉刷新
        refreshStatus: false,
        // 筛选部分
        filterWinStatus: false,

        // 排序部分
        sortInfo: {},
        // 筛选部分
        filterInfo: {},
        // 搜索部分
        searchInfo: {},
        // 分页数据
        pagingInfo: {
            current: 1,
            pageSize: 10
        },

        // 分页状态
        pagingStatus: { ...defaultPaging },
        // 分页数据
        pagingData: [] as Array<${responseType.name}>,
        // 回到顶部
        backTopVisible: false,
        // 更多
        waiting: false
    },

    // 页面数据
    onLoad(options) {
        // 条件搜索
        isStr(options.keyword) && this.onSearchChange({ detail: { value: options.keyword } });
        // 开始搜索
        this.onSearch();
    },

    // 下拉刷新
    onPullDownRefresh() {
        const { refreshStatus } = this.data;
        if (!refreshStatus) {
            this.setData({ refreshStatus: true });
            this.refresh(() => {
                // 停止下拉刷新
                wx.stopPullDownRefresh();
                this.setData({ refreshStatus: false });
            });
        }
    },

    // 触底加载更多
    onReachBottom() {
        const { pagingStatus, pagingData } = this.data;
        const { hasMore, success, current } = pagingStatus;
        if (!hasMore && success) return;
        this.setData(
            {
                'pagingInfo.current': success ? current + 1 : current,
                waiting: true
            },
            () => {
                this.doGetPageData().then(({ data, paging }) => {
                    const { pageSize, current } = paging;
                    this.setData({
                        waiting: false,
                        pagingStatus: paging,
                        pagingData: [...pagingData, ...data],
                        pagingInfo: { pageSize, current }
                    });
                });
            }
        );
    },

    // 重新刷新数据
    refresh(finishCb?) {
        const {
            pagingStatus: { pageSize, current }
        } = this.data;
        this.doGetPageData({current: 1, pageSize: pageSize * current}).then(({ data, paging }) => {
            const { success, total } = paging;
            console.log(data, paging);
            if (success) {
                const pageNum = Math.ceil(total / pageSize);
                const curPage = current > pageNum ? pageNum : current;
                this.setData({
                    pagingStatus: {
                        ...paging,
                        current: curPage,
                        hasMore: total > curPage * pageSize,
                        empty: total <= 0
                    },
                    pagingData: data
                });
            } else {
                error('刷新错误，请稍后重试~', paging);
            }
            isFunc(finishCb) && finishCb({ data, paging });
        });
    },

    // 搜索内容变化
    onSearchChange({ detail: { value } }) {
        this.setData({ 'searchInfo.keyword': value });
    },
    onSearchClear(e) {
        this.onSearchChange(e);
        setTimeout(this.onSearch.bind(this), 100);
    },

    // 搜索
    onSearch() {
        this.setData(
            {
                'pagingInfo.current': 1
            },
            () => {
                this.setData({ waiting: true, init: true, pagingStatus: defaultPaging, pagingData: [] });
                this.doGetPageData().then(({ data, paging }) => {
                    const { pageSize, current } = paging;
                    this.setData({
                        waiting: false,
                        init: false,
                        pagingStatus: paging,
                        pagingData: data,
                        pagingInfo: { pageSize, current }
                    });
                });
            }
        );
    },

    // 排序
    onSort({ detail: { column, value } }) {
        const sortInfo: IKeyVal = {};
        if (column && value) {
            sortInfo[column] = value;
        }
        this.setData(
            {
                sortInfo,
                'pagingInfo.current': 1
            },
            () => {
                this.setData({ waiting: true, init: true, pagingStatus: defaultPaging, pagingData: [] });
                this.doGetPageData().then(({ data, paging }) => {
                    const { pageSize, current } = paging;
                    this.setData({
                        waiting: false,
                        init: false,
                        pagingStatus: paging,
                        pagingData: data,
                        pagingInfo: { pageSize, current }
                    });
                });
            }
        );
    },

    // 筛选
    showFilterWin() {
        this.setData({ filterWinStatus: true });
    },
    hideFilterWin() {
        this.setData({ filterWinStatus: false });
    },
    onFilter({ detail: filterInfo }) {
        this.hideFilterWin();
        this.setData(
            {
                filterInfo,
                'pagingInfo.current': 1
            },
            () => {
                this.setData({ waiting: true, init: true, pagingStatus: defaultPaging, pagingData: [] });
                this.doGetPageData().then(({ data, paging }) => {
                    const { pageSize, current } = paging;
                    this.setData({
                        waiting: false,
                        init: false,
                        pagingStatus: paging,
                        pagingData: data,
                        pagingInfo: { pageSize, current }
                    });
                });
            }
        );
    },

    // 页面滚动
    onScroll({ detail: { scrollTop } }) {
        // 跳转到顶部
        this.setData({
            backTopVisible: scrollTop > 100
        });
    },

    // 获取数据
    doGetPageData(appendData?: IKeyVal) {
        // 筛选、排序、分页、搜索内容
        const { searchInfo, filterInfo, sortInfo, pagingInfo } = this.data;
        const params = { ...filterInfo, ...sortInfo, ...pagingInfo, ...objFilter(searchInfo, (val) => isStr(val)), ...(appendData || {})};
        return resFilter.pageFilter(${service.name}(params));
    }
});
`;
};

const toPageWxml = (sortProperties, responseProperties) => {
    console.log('toPageWxml=>', responseProperties);
    const sorts = [{ name: '', description: '综合' }, ...sortProperties];
    return `<custom-page>
    <view class="block-self">
        <view class="height-120  bg-white padding-20-30">
            <t-search model:value="{{searchInfo.keyword}}" placeholder="角色搜索" shape="round" bind:submit="onSearch" bind:change="onSearchChange" bind:clear="onSearchClear" />
        </view>
        <filter
                bind:sour="handleFilterChange"
                columns="{{ [${sorts.map((it) => `{column: '${it.name}', title: '${it.description}'}`).join(', ')}] }}"
                bind:sort="onSort"
                bind:showFilterWin="showFilterWin">
            <filter-popup slot="filterPopup" show="{{filterWinStatus}}" bind:close="hideFilterWin">
                <filter-form wx:if="{{filterWinStatus}}" data="{{filterInfo}}" bind:filter="onFilter" />
            </filter-popup>
        </filter>
        <view wx:if="{{init}}" class="height-100 flex-center">
            <t-loading theme="dots" size="80rpx" />
        </view>
        <view wx:else class="height--200">
            <t-pull-down-refresh
                                    value="{{refreshStatus}}"
                                    loadingTexts="{{['下拉刷新', '松手刷新', '正在刷新', '刷新完成']}}"
                                    bind:refresh="onPullDownRefresh"
                                    bind:scrolltolower="onReachBottom"
                                    bind:scroll="onScroll">
                <view wx:for="{{pagingData}}" wx:key="index" class="font-32 padding-20-30 bg-white margin-top-20">
                    ${responseProperties.map((it) => `<view>${it.description}：{{item.${it.name}}}</view>`).join('\r\n                    ')}
                </view>
                <t-back-top wx:if="{{backTopVisible}}" text="顶部" />
                <load-more waiting="{{waiting}}" paging="{{pagingStatus}}" bind:retry="onReachBottom" />
            </t-pull-down-refresh>
        </view>
    </view>
</custom-page>
`;
};

const toPageJson = (title) => `
{
    "navigationBarTitleText": "${title || 'xxx'}",
    "usingComponents": {
        "filter": "/components/filter/index",
        "filter-popup": "/components/filter-popup/index",
        "t-pull-down-refresh": "tdesign-miniprogram/pull-down-refresh/pull-down-refresh",
        "t-search": "tdesign-miniprogram/search/search",
        "t-back-top": "tdesign-miniprogram/back-top/back-top",
        "filter-form": "./filter/index"
    }
}

`;
const toPageScss = (paramsType, responseType) => `

`;

const toFilterTs = (paramsType, responseType, document, validate) => {
    return `import { isObj, isStr,validateForm } from '@kjts20/tool';
import { ${validate.validateName} } from '@/services/validates/${document.name}';


Component({
    options: {
        styleIsolation: 'apply-shared'
    },
    properties: {
        data: {
            type: Object,
            observer(data) {
                this.setData({
                    formData: isObj(data) ? data : {}
                });
            }
        }
    },
    // 表单数据
    data: {
        formData: {},
        formErr: {}
    },

    methods: {
        onSubmit({ detail: { value } }) {
            this.setData({ formData: value });
            const data = {};
            for (const key in value) {
                const val = value[key];
                isStr(val) && (data[key] = val);
            }
            const formErr = validateForm(${validate.validateName}, data);
            this.setData({ formErr });
            if (Object.keys(formErr).length <= 0) {
                this.triggerEvent('filter', data);
            }
        },
        onReset() {
            this.setData({ formData: {} });
            this.triggerEvent('filter', {});
        }
    }
});

`;
};

const toFilterWxml = (properties, responseType) => `
<form class="block-self" bindsubmit="onSubmit" bindreset="onReset">
    <scroll-view class="height--120" scroll-y>
        <view class="padding-bottom-30">
            ${properties
                .map(
                    (it) => `<t-input label="${it.description}" name="${it.name}" value="{{formData.${it.name}}}" placeholder="请输入${it.description}" status="error" tips="{{formErr.${it.name}}}"/>`
                )
                .join('\r\n            ')}
        </view>
    </scroll-view>
    <view class="height-120 padding-20-30">
        <view class="btn-group">
            <button class="btn color-3" form-type="reset">重置</button>
            <button class="btn danger color-white" form-type="submit">确定</button>
        </view>
    </view>
</form>
`;
const toFilterJson = (paramsType, responseType) => `{
    "component": true,
    "usingComponents": {
        "t-input": "tdesign-miniprogram/input/input"
    }
}

`;
const toFilterScss = (paramsType, responseType) => `

`;

module.exports = {
    // 页面部分
    toPageTs,
    toPageWxml,
    toPageJson,
    toPageScss,
    // 筛选表单
    toFilterTs,
    toFilterWxml,
    toFilterScss,
    toFilterJson
};
