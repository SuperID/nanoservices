'use strict';

/**
 * super-microservices test
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const Context = require('../lib/context');
const Manager = require('../lib/manager');

describe('Context', function () {

  describe('new Context(options)', function () {

    const manager = new Manager();

    it('manager - 必须指定', function () {
      assert.throws(() => {
        new Context();
      }, /AssertionError/);
      new Context({ manager });
    });

    it('requestId - 可自定义', function () {
      const requestId = '123456';
      assert.equal(new Context({ manager, requestId }).requestId, requestId);
    });

    it('params - 只能为对象', function () {
      assert.throws(() => {
        new Context({ manager, params: 123 });
      }, /AssertionError/);
      assert.throws(() => {
        new Context({ manager, params: 'text' });
      }, /AssertionError/);
      const ctx = new Context({ manager, params: { a: 123 }});
      assert.deepEqual(ctx.params, { a: 123 });
    });

    it('params - 被冻结', function () {
      const ctx = new Context({ manager, params: { a: 123 }});
      assert.throws(() => {
        ctx.params.a = 456;
      });
      assert.throws(() => {
        ctx.params.b = 789;
      });
      assert.deepEqual(ctx.params, { a: 123 });
    });

    it('params - 解除原对象的引用', function () {
      const params = { a: 123 };
      const ctx = new Context({ manager, params });
      params.a = 456;
      params.b = 789;
      assert.notEqual(params, ctx.params);
      assert.deepEqual(params, { a: 456, b: 789 });
      assert.deepEqual(ctx.params, { a: 123 });
    });

    it('callback - 如果指定了，必须为一个函数', function () {
      assert.throws(() => {
        new Context({ manager, callback: 123 });
      });
      new Context({ manager, callback() {} });
    });

    it('writeLog - 如果指定了，必须为一个函数', function () {
      assert.throws(() => {
        new Context({ manager, writeLog: 123 });
      });
      new Context({ manager, writeLog() {} });
    });

  });

  describe('call(name, params)', function () {

    const manager = new Manager();
    manager.register('testSuccess', function (ctx) {
      setTimeout(() => {
        ctx.result(ctx.params.msg);
      }, Math.random() * 10);
    });
    manager.register('testError', function (ctx) {
      setTimeout(() => {
        ctx.error(new Error(ctx.params.msg));
      }, Math.random() * 10);
    });

    it('callback(null, ret)', function (done) {
      new Context({ manager }).call('testSuccess', { msg: 'test' }, (err, ret) => {
        assert.equal(err, null);
        assert.equal(ret, 'test');
        done();
      });
    });

    it('callback(err)', function (done) {
      new Context({ manager }).call('testError', { msg: 'test' }, (err, _) => {
        assert.notEqual(err, null);
        assert.equal(err.message, 'test');
        done();
      });
    });

    it('Promise.then(ret)', function (done) {
      new Context({ manager }).call('testSuccess', { msg: 'test' }).then(ret => {
        assert.equal(ret, 'test');
        done();
      }).catch(err => {
        done(err);
      });
    });

    it('Promise.catch(err)', function (done) {
      new Context({ manager }).call('testError', { msg: 'test' }).then(_ => {
        done(new Error('不应该捕捉到正常结果'));
      }).catch(err => {
        assert.equal(err.message, 'test');
        done();
      });
    });

  });

  describe('next(name, params)', function () {

    const manager = new Manager();
    manager.register('bridge', function (ctx) {
      ctx.next(ctx.params.name, { msg: ctx.params.msg });
    });
    manager.register('testSuccess', function (ctx) {
      setTimeout(() => {
        ctx.result(ctx.params.msg);
      }, Math.random() * 10);
    });
    manager.register('testError', function (ctx) {
      setTimeout(() => {
        ctx.error(new Error(ctx.params.msg));
      }, Math.random() * 10);
    });

    it('callback(null, ret)', function (done) {
      new Context({ manager }).call('bridge', { name: 'testSuccess', msg: 'test' }, (err, ret) => {
        assert.equal(err, null);
        assert.equal(ret, 'test');
        done();
      });
    });

    it('callback(err)', function (done) {
      new Context({ manager }).call('bridge', { name: 'testError', msg: 'test' }, (err, _) => {
        assert.notEqual(err, null);
        assert.equal(err.message, 'test');
        done();
      });
    });

    it('Promise.then(ret)', function (done) {
      new Context({ manager }).call('bridge', { name: 'testSuccess', msg: 'test' }).then(ret => {
        assert.equal(ret, 'test');
        done();
      }).catch(err => {
        done(err);
      });
    });

    it('Promise.catch(err)', function (done) {
      new Context({ manager }).call('bridge', { name: 'testError', msg: 'test' }).then(_ => {
        throw new Error('此处应该报错');
      }).catch(err => {
        assert.equal(err.message, 'test');
        done();
      });
    });

  });

  describe('prepareCall(name, params?)', function () {

    const manager = new Manager();
    manager.register('testSuccess', function (ctx) {
      setTimeout(() => {
        ctx.result(ctx.params.msg);
      }, Math.random() * 10);
    });

    it('不绑定参数', function (done) {
      const call = new Context({ manager }).prepareCall('testSuccess');
      call({ msg: 'ttt' }, (err, ret) => {
        assert.equal(err, null);
        assert.equal(ret, 'ttt');
        done();
      });
    });

    it('绑定参数不能覆盖', function (done) {
      const call = new Context({ manager }).prepareCall('testSuccess', { msg: 'oooo' });
      call({ msg: 'ttt' }, (err, ret) => {
        assert.equal(err, null);
        assert.equal(ret, 'oooo');
        done();
      });
    });

  });


});
