/**
 * @function 每一页中需要的模版文件
 */
const jsonFile = `
{
    "usingComponents": {}
}
`;

const tsFile = `
import { globalHooks } from "@/lib/global-hooks";
const pageKey = 'info';
Page(globalHooks({
    data: {
        info: {params: {}}
    },

    onLoad(options) {

    },

    onShow() {
        const page = this.data[pageKey];
        if (page && page.hasBeenLoad) {
            this.reloadData();
        } else {
            this.initLoadData();
        }
    },

    // 加载页面数据
    initLoadData() {
        // this.initPageData(pageKey, this.loadData);
    },
    loadData() {
        // this.loadPageData(getTuisonsPage, pageKey);
    },
    reloadData() {
        // if (this.isHasGetPageData(pageKey)) {
        //     this.reloadPageData(getTuisonsPage, pageKey);
        //}
    },

    // 搜索
    onSearch({ detail, currentTarget: { dataset: { column } } }) {
        //const dataBox = this.data[pageKey];
        //const params = dataBox.params || {};
        //params[column] = detail;
        //dataBox.params = params;
        //this.setData(toObj(pageKey, dataBox), this.initLoadData);
    }
}));
`;

// 生成scss文件的模板
const toScssFile = (styleAbsulute = '../../') => `
@import "${styleAbsulute}style/variable.scss";
@import "${styleAbsulute}style/base.scss";
.page-body-container {
    width: 100%;
    height: 100%;
}
`;

const wxmlFile = `
<custom-page title="标题">
    <page-scroll-view slot="body" custom-class="bg-3" class="block-self padding-v-20" data="{{info}}" bind:refresherrefresh="initLoadData" bind:scrolltolower="loadData">
        <view class="content-area">
            <block wx:for="{{info.pageData}}" wx:key="index">
                <view>这里是列表数据</view>
            </block>
        </view>
    </page-scroll-view>
</custom-page>
`;

module.exports = {
    jsonFile,
    tsFile,
    toScssFile,
    wxmlFile
};
