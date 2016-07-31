'use strict';

const fs = require('fs');
const path = require('path');
const microservices = require('../');
const globalManager = microservices.globalManager;
const register = microservices.register;
const utils = microservices.utils;

const stream = fs.createWriteStream(path.resolve(__dirname, `call-${ utils.date('Y-m-d') }.log`), {
  flags: 'a',
});
globalManager.setOption('logRecorder', new microservices.StreamRecorder(stream, '\n'));

// console.debug = console.log;
// globalManager.setOption('logRecorder', new microservices.LoggerRecorder(console));

function asyncOperate(fn) {
  setTimeout(fn, Math.random() * 50);
}

function randomBoolean() {
  return Math.random() >= 0.5;
}


// 注册新用户
register('api.superid.signup', function (ctx) {
  ctx.debug('start signup new user, phone=%s', ctx.params.phone);
  ctx.call('user.getOrCreate', { phone: ctx.params.phone }, (err, user) => {
    if (err) return ctx.error(err);

    ctx.debug('user id=%s', user.id);
    ctx.call('face.compare', { user, face: ctx.params.face }, (err, compareResult) => {
      if (err) return ctx.error(err);

      ctx.debug('cool, the last step, generate new access token');
      ctx.call('user.generateNewAccessToken', { user }, (err, token) => {
        if (err) return ctx.error(err);

        ctx.result({
          phone: user.phone,
          success: true,
          score: compareResult.score,
          token,
        });
      });
    });
  });
});

register('user.get', function (ctx) {
  asyncOperate(() => {
    if (randomBoolean()) {
      ctx.result({
        id: Date.now(),
        phone: ctx.params.phone,
        name: '老雷',
      });
    } else {
      ctx.debug('oh no, user does not exists');
      ctx.result(null);
    }
  });
});
register('user.create', function (ctx) {
  asyncOperate(() => {
    ctx.result({
      id: Date.now(),
      phone: ctx.params.phone,
      name: '老雷',
    });
  });
});
register('user.getOrCreate', function (ctx) {
  ctx.call('user.get', ctx.params, (err, user) => {
    if (err) return ctx.error(err);
    if (user) return ctx.result(user);
    ctx.debug('ok, let me create a new user');
    ctx.next('user.create', ctx.params);
  });
});
register('user.generateNewAccessToken', function (ctx) {
  asyncOperate(() => {
    ctx.result(utils.randomString(20));
  });
});

register('face.compare', function (ctx) {
  ctx.debug('upload image firstly, it may take a minute');
  ctx.call('face.upload', { face: ctx.params.face }, (err, face) => {
    if (err) console.error(err);
    if (randomBoolean()) {
      ctx.result({
        uuid: face.uuid,
        score: Math.random() * 100,
      });
    } else {
      ctx.debug('compare fail, maybe set a higher minScore to avoid this problem');
      ctx.error('compare fail');
    }
  });
});
register('face.upload', function (ctx) {
  asyncOperate(() => {
    ctx.result({
      uuid: utils.randomString(20),
    });
  });
});


const ctx = globalManager.newContext();
setInterval(() => {
  ctx.call('api.superid.signup', { phone: 123456, face: utils.randomString(20) + '.jpg' })
    .then(ret => console.log('ok', ret))
    .catch(err => console.log('fail', err));
  ctx.call('api.superid.signup', { phone: 123456, face: utils.randomString(20) + '.jpg' })
    .then(ret => console.log('ok', ret))
    .catch(err => console.log('fail', err));
}, 1000);
