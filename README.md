## 时时工具包-微信小程序工具

### 安装方式

```shell
npm install @kjts20/tool-weixin-mp
```

### 直接引入就即可使用

#### 初始化方法，在 app.js 中执行方法中的初始化方法

```ts
import { httpServer } from '@kjts20/tool-weixin-mp';

// 修改host
httpServer.setHost('/');
// 发送get请求
httpServer.get('/url', { id: 5 });
```

### 功能

#### 请求封装为 httpServer 形式

#### 仓库封装为 store 调用

#### 事件实例化

#### 跳转

-   goto

执行指令：

### 前序说明

#### 下载依赖

-   `npm install @kjts20/tool`

### 小程序初始化操作

#### 一、本地化 wxs 与脚手架

-   `./node_modules/.bin/weixin-mp-eject`

#### 二、修改根目录（可选）

-   修改./package.json 的 scripts 中的 project 指令，把 miniprogram 修改为自定义项目名称

#### 三、修改环境变量

-   修改./cli/common.js 中的环境配置（allEnv 变量，填充好 appId、host 等）

#### 四、初始化项目(生成项目配置文件、tsconfig.js)

-   `npm run project`

#### 五、测试
