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

#### 本地化 wxs 与脚手架

执行指令：`./node_modules/.bin/weixin-mp-eject`
