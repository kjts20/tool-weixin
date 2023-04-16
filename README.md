## 时时工具包-微信小程序工具

### 安装方式

```shell
npm install @kjts20/tool-weixin-mp
```

### 直接引入就即可使用

#### 请求类

```TS
import {httpServer} from "@kjts20/tool-weixin-mp";
// 修改host
httpServer.setHost("/");
// 发送get请求
httpServer.get("/url", {id: 5});
```

### 功能

#### 提供基础的 wxs

-   字符串
-   对象

#### 请求封装为 httpServer 形式

#### 仓库封装为 store 调用

#### 事件实例化

#### 跳转

#### 启动的一些脚本
