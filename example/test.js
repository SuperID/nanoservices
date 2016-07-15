'use strict';

const {globalManager, register, call} = require('../');

register('add', function (ctx) {
  if (isNaN(ctx.params.a)) return ctx.error('参数a不是一个数值');
  if (isNaN(ctx.params.b)) return ctx.error('参数a不是一个数值');
  ctx.debug('add: a=%s, b=%s', ctx.params.a, ctx.params.b);

  const a = Number(ctx.params.a);
  const b = Number(ctx.params.b);

  // 返回结果
  ctx.result(a + b);
});

call('add', {a: 123, b: 456}, (err, ret) => {
  if (err) {
    console.error(err);
  } else {
    console.log('result=%s', ret);
  }
});

console.log(globalManager.getService('add'));
