'use strict';

const {globalManager, register, call} = require('../');

register('divide', function (ctx) {
  const a = Number(ctx.params.a);
  const b = Number(ctx.params.b);
  ctx.result(a / b);
});

register('add', function (ctx) {
  if (isNaN(ctx.params.a)) return ctx.error('参数a不是一个数值');
  if (isNaN(ctx.params.b)) return ctx.error('参数a不是一个数值');
  ctx.debug('add: a=%s, b=%s', ctx.params.a, ctx.params.b);

  const a = Number(ctx.params.a);
  const b = Number(ctx.params.b);

  // 返回结果
  ctx.result(a + b);
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

call('hello', {}, (err, ret) => {
  if (err) {
    console.error(err);
  } else {
    console.log('result=%j', ret);
  }
});
