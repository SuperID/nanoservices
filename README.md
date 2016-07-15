# super-microservices
基于Node.js的微服务框架

## 安装

```bash
$ npm install super-microservices --save
```

**要求 Node.js v4.0.0 或更高版本**


## 设计目标

+ [ ] 将项目代码服务化，每一个「微服务」完成一个小功能
+ [ ] 通过`requestId`来跟踪记录完整的调用链
+ [ ] 自动记录日志，结合相应的调试信息方便开发调试
+ [ ] 考虑接驳`clouds`系统，可以使得不同主机/进程间的调用也适用


## 使用方法

```javascript
'use strict';

const {Manager} = require('super-microservices');

// 创建管理器
const services = new Manager();


// 注册服务
services.register('add', function (ctx) {
  // ctx.params 为输入的参数，该对象已冻结不能对其更改
  // ctx.error(err) 返回出错信息
  // ctx.result(ret) 返回调用结果
  // ctx.debug(msg) 输出调试信息

  if (isNaN(ctx.params.a)) return ctx.error('参数a不是一个数值');
  if (isNaN(ctx.params.b)) return ctx.error('参数a不是一个数值');

  ctx.debug('add: a=%s, b=%s', ctx.params.a, ctx.params.b);

  const a = Number(ctx.params.a);
  const b = Number(ctx.params.b);

  // 返回结果
  ctx.result(a + b);
});


// 调用服务
services.call('add', {a: 123, b: 456}, (err, ret) => {
  if (err) {
    console.error(err);
  } else {
    console.log('result=%s', ret);
  }
});
```


## Context对象

服务的处理函数只接收一个参数，该参数为一个`Context`对象，通过该对象完成读取参数、返回结果等所有操作。

`Context`对象结构如下：

```typescript
interface Context {

  // 请求ID
  requestId: String;

  // 调用开始时间
  startTime: Date;

  // 参数对象，该对象已被冻结，不能在对象上做修改
  params: Object;

  // 返回执行结果
  result(ret: Any);

  // 返回执行出错
  error(err: Any);

  // 打印调试信息，支持 debug('msg=%s', msg) 这样的格式
  debug(msg: Any);

  // 调用其他服务，并传递 requestId
  call(name: String, params: Object, callback: Function);

  // 调用服务器，并传递 requestId，该调用的结果作为当前服务的执行结果返回
  next(name: String, params: Object);

  // 顺序调用一系列的服务，上一个调用的结果作为下一个调用的参数，如果中途出错则直接返回
  series(calls: [CallService], callback: Function);

  // 返回一个 CallService 对象，与 series() 结合使用
  // params 表示绑定的参数，如果补指定，则使用上一个调用的结果
  prepareCall(name: String, params?: Object);

}
```


## 调用链

各个服务之间的调用会通过传递`requestId`来记录调用来源以及整个调用链结构（请求参数、返回结果等），
还可以通过`debug()`方法来打印调试信息，这些信息会根据需要记录到日志文件中，
只要通过`requestId`即可查询到完整的调用信息。

### 在服务外部调用多个服务

默认情况下使用`services.call()`会自动生成一个`requestId`并调用服务，但调用方无法获得这个`requestId`，
我们可以通过`services.newContext()`来获得一个新的`Context`对象：

```javascript
// 创建Context
const ctx = services.newContext();
// 如果要自定义requestId，可以这样：
// const ctx = services.newContext(requestId);

// 调用服务
ctx.call('add', {a: 1, b: 2}, (err, ret) => {
  if (err) return console.error(err);
  console.log(ret);

  // 调用第二个服务
  ctx.call('devide', {a: 123, b: 456}, (err, ret) => {
    if (err) return console.error(err);
    console.log(ret);

    // ...
  });
});
```

### 顺序调用多个服务

有时候某个服务实际上是通过顺序调用一系列服务来完成操作的，可以使用`ctx.series()`方法：

```javascript
ctx.series([

  // 第一个服务必须手动绑定调用参数，因为它没有上一个服务调用结果可用
  ctx.prepareCall('add', {a: 123, b: 456}),

  ctx.prepareCall('divide'),
  ctx.prepareCall('times'),

], (err, ret) => {
  if (err) {
    ctx.error(err);
  } else {
    ctx.result(ret);
  }
});
```



## License

```
The MIT License (MIT)

Copyright (c) 2016 SuperID | 免费极速身份验证服务

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
