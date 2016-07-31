'use strict';

/**
 * super-microservices test
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const Manager = require('../lib/manager');

describe('Manager', function () {

  describe('new Manager(options)', function () {

    it('不允许设置未知的选项', function () {
      assert.throws(() => {
        new Manager({ aaaa: 123 });
      });
      assert.throws(() => {
        new Manager({ bbbb: 123 });
      });
    });

    it('writeLog - 必须是一个函数', function () {
      assert.throws(() => {
        new Manager({ writeLog: 1 });
      });
      new Manager({
        writeLog() {},
      });
    });

  });

  describe('setOption(name, value)', function () {

    const m = new Manager();

    it('不允许设置未知的选项', function () {
      assert.throws(() => {
        m.setOption('cccc', 111);
      });
      assert.throws(() => {
        m.setOption('dddd', 222);
      });
    });

    it('writeLog - 必须是一个函数', function () {
      assert.throws(() => {
        m.setOption('writeLog', 'test');
      });
      m.setOption('writeLog', function () {});
    });

  });

  describe('getOption(name)', function () {

    function writeLog() {}
    const m = new Manager({ writeLog });

    it('成功', function () {
      assert.equal(m.getOption('writeLog'), writeLog);
    });

    it('更新option再获取成功', function () {
      function writeLog2() { return 2; }
      m.setOption('writeLog', writeLog2);
      assert.equal(m.getOption('writeLog'), writeLog2);
    });

  });

  describe('newContext(options)', function () {

    function writeLog() {}
    const m = new Manager({ writeLog });

    it('传递 writeLog', function () {
      const ctx = m.newContext();
      assert.equal(ctx._writeLog, writeLog);
    });

    it('传递自定义的 params', function () {
      const params = { a: 123, b: 456 };
      const ctx = m.newContext({ params });
      assert.deepEqual(ctx.params, params);
    });

  });

  describe('register(name, handler) & getService(name)', function () {

    const m = new Manager();
    function handler(_) {}

    it('register(name, handler) - 成功', function () {
      m.register('test', handler);
    });

    it('getService(name) - 成功', function () {
      const s = m.getService('test');
      assert(s, `无法获取service`);
      assert.equal(s.name, 'test');
      assert.equal(s.handler, handler);
    });

  });

  describe('call(name, params)', function () {

    const m = new Manager();
    m.register('testSuccess', function (ctx) {
      setTimeout(() => {
        ctx.result(ctx.params.msg);
      }, Math.random() * 10);
    });
    m.register('testError', function (ctx) {
      setTimeout(() => {
        ctx.error(new Error(ctx.params.msg));
      }, Math.random() * 10);
    });

    it('callback(null, ret)', function (done) {
      m.call('testSuccess', { msg: 'test' }, (err, ret) => {
        assert.equal(err, null);
        assert.equal(ret, 'test');
        done();
      });
    });

    it('callback(err)', function (done) {
      m.call('testError', { msg: 'test' }, (err, _) => {
        assert.notEqual(err, null);
        assert.equal(err.message, 'test');
        done();
      });
    });

    it('Promise.then(ret)', function (done) {
      m.call('testSuccess', { msg: 'test' }).then(ret => {
        assert.equal(ret, 'test');
        done();
      }).catch(err => {
        throw err;
      });
    });

    it('Promise.catch(err)', function (done) {
      m.call('testError', { msg: 'test' }).then(_ => {
        throw new Error('此处应该报错');
      }).catch(err => {
        assert.equal(err.message, 'test');
        done();
      });
    });

  });

});
