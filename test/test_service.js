'use strict';

/**
 * super-microservices test
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const Service = require('../lib/service');

describe('Service', function () {

  describe('new Service(name, handler)', function () {

    it('name 参数不正确报错', function () {
      assert.throws(function () {
        new Service(123, function (ctx) {});
      }, /AssertionError/);
    });

    it('handler 参数不正确报错', function () {
      assert.throws(function () {
        new Service('test', 123);
      }, /AssertionError/);
      assert.throws(function () {
        new Service('test', function () {});
      }, /AssertionError/);
    });

    it('正确存储了 name 和 handler', function () {
      const name = 'test';
      const handler = function (ctx) {};
      const s = new Service(name, handler);
      assert.equal(s.name, name);
      assert.equal(s.handler, handler);
    });

  });

  describe('call()', function () {

    it('必须异步执行', function (done) {
      const ctx = {
        started: false,
        done: ret => {
          assert.equal(ret, 123456);
          assert.equal(ctx.started, true);
          done();
        },
      };
      const s = new Service('test', function (ctx) {
        ctx.started = true;
        ctx.done(123456);
      });
      s.call(ctx);
      // service handler 还未执行
      assert.equal(ctx.started, false);
    });

    it('执行出错时能捕捉到', function (done) {
      const ctx = {
        error: err => {
          assert.equal(err.message, 'must catch this error');
          done();
        },
      };
      const s = new Service('test', function (ctx) {
        throw new Error('must catch this error');
      });
      s.call(ctx);
    });

  });

});
