'use strict';

const fs = require('fs');
const path = require('path');
const {globalManager, register, call} = require('../');

const logStream = fs.createWriteStream(path.resolve(__dirname, 'call.log'), {
  flags: 'a',
});
globalManager.setOption('writeLog', str => {
  logStream.write(str + '\n');
});

register('divide', function (ctx) {
  const a = Number(ctx.params.a);
  const b = Number(ctx.params.b);
  setTimeout(() => {
    ctx.result(a / b);
  }, Math.random() * 10);
});

register('add', function (ctx) {
  if (isNaN(ctx.params.a)) return ctx.error('参数a不是一个数值');
  if (isNaN(ctx.params.b)) return ctx.error('参数a不是一个数值');
  ctx.debug('add: a=%s, b=%s', ctx.params.a, ctx.params.b);

  const a = Number(ctx.params.a);
  const b = Number(ctx.params.b);

  // 返回结果
  setTimeout(() => {
    ctx.result(a + b);
  }, Math.random() * 10);
});

register('hello', function (ctx) {

  ctx.call('add', {a: 123, b: 456}, (err, ret1) => {
    if (err) return ctx.error(err);

    ctx.call('divide', {a: 123, b: 456}, (err, ret2) => {
      if (err) return ctx.error(err);

      ctx.result({a: ret1, b: ret2});
    });
  })
});

register('series', function (ctx) {
  ctx.series([
    ctx.prepareCall('echo', "I am first"),
    ctx.prepareCall('echo'),
    ctx.prepareCall('echo', "I am thrid"),
    ctx.prepareCall('echo'),
    ctx.prepareCall('echo'),
    ctx.prepareCall('echo'),
    ctx.prepareCall('echo'),
  ], (err, ret) => {
    if (err) {
      ctx.error(err);
    } else {
      ctx.result(ret);
    }
  })
});

register('echo', function (ctx) {
  setTimeout(() => {
    console.log('echo: %s', ctx.params);
    ctx.result(ctx.params + '+');
  }, Math.random() * 10);
});

call('hello', {}, (err, ret) => {
  if (err) {
    console.error(err);
  } else {
    console.log('result=%j', ret);
  }
});

call('series', {}, (err, ret) => {
  if (err) {
    console.error(err);
  } else {
    console.log(ret);
  }
});
