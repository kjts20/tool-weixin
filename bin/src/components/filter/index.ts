import { isArr } from '@kjts20/tool';

// 排序枚举
const sortEnum = {
    ASC: 'asc',
    DESC: 'desc'
};
// 默认排序
const defaultColumnList = [
    {
        column: '',
        title: '综合'
    },
    {
        column: 'createTimeSort',
        title: '时间'
    }
];
Component({
    externalClasses: ['wr-class'],
    options: {
        multipleSlots: true
    },

    properties: {
        // 字段列表（Array<{column: string, title: String}>）
        columns: {
            type: Array,
            value: [...defaultColumnList],
            observer(val) {
                const columnList = isArr(val) && val.length > 0 ? val : defaultColumnList;
                this.setData({
                    colums: columnList,
                    sort: {
                        column: columnList[0].column,
                        value: ''
                    }
                });
            }
        },
        // 选中的颜色
        selectColor: {
            type: String,
            value: 'var(--sort-selected-color, #FA550F)'
        },
        // 显示filter
        showFilter: {
            type: Boolean,
            value: true
        }
    },

    data: {
        sortEnum,
        // 排序字段
        colums: defaultColumnList,
        // 排序的字段
        sort: {
            column: defaultColumnList[0].column,
            value: ''
        }
    },

    methods: {
        onSort({ currentTarget: { dataset } }) {
            const { column } = dataset;
            const { sort } = this.data;
            if (sort.column === column) {
                // 切换排序类型
                sort.value = sort.value === sortEnum.ASC ? sortEnum.DESC : sortEnum.ASC;
            } else {
                // 切换排序字段
                sort.column = column;
                sort.value = sortEnum.DESC;
            }
            this.setData({ sort });
            this.triggerEvent('sort', sort);
        },

        // 显示查询弹窗
        showFilterPopup() {
            this.triggerEvent('showFilterWin', { show: true });
        }
    }
});
