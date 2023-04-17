/**
 * @function 组件中需要的模版文件
 */
const jsonFile = `
{
    "component": true,
    "usingComponents": {}
}
`;

const tsFile = `
Component({
    options: {
        addGlobalClass: true
    },
    properties: {

    },
    data: {

    },
    lifetimes: {
        attached: function () {

        }
    },
    methods: {

    }
});
`;

const toScssFile = (styleAbsulute = "../../") => `
.component-container{
    
} 
`;

const wxmlFile = `
<view class="component-container">
  
</view>
`;

module.exports = {
    jsonFile,
    tsFile,
    toScssFile,
    wxmlFile
}