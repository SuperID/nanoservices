'use strict';

/**
 * super-microservices test
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const coroutine = require('lei-coroutine');
const Manager = require('../lib/manager');

describe('完全使用 Promise', function () {

  it('正常', function () {
    const manager = new Manager();

    manager.register('test1', coroutine.wrap(function* serviceTest1(ctx) {
      yield coroutine.delay(10);
      ctx.result({ value: ctx.params.a + ctx.params.b });
    }));

    manager.register('test2', coroutine.wrap(function* serviceTest2(ctx) {
      yield coroutine.delay(10);
      ctx.result({ value: ctx.params.a * ctx.params.b });
    }));

    return coroutine(function* main() {
      const v1 = yield manager.call('test1', { a: 10, b: 22 });
      const v2 = yield manager.call('test2', { a: 11, b: 22 });
      assert.deepEqual(v1, { value: 10 + 22 });
      assert.deepEqual(v2, { value: 11 * 22 });
    });

  });

  it('出错情况 - ctx.result() 之后抛出异常不影响结果', function () {
    const manager = new Manager();

    manager.register('test1', coroutine.wrap(function* serviceTest1(ctx) {
      yield coroutine.delay(10);
      ctx.result({ value: ctx.params.a + ctx.params.b });
      throw new Error('haha test1');
    }));

    manager.register('test2', coroutine.wrap(function* serviceTest2(ctx) {
      yield coroutine.delay(10);
      ctx.result({ value: ctx.params.a * ctx.params.b });
      throw new Error('haha test2');
    }));

    return coroutine(function* main() {
      const v1 = yield manager.call('test1', { a: 10, b: 22 });
      const v2 = yield manager.call('test2', { a: 11, b: 22 });
      assert.deepEqual(v1, { value: 10 + 22 });
      assert.deepEqual(v2, { value: 11 * 22 });
    });

  });

  it('出错情况 - ctx.result() 之前抛出异常', function () {
    const manager = new Manager();

    const TRUE = true;

    manager.register('test1', coroutine.wrap(function* serviceTest1(ctx) {
      yield coroutine.delay(10);
      if (TRUE) throw new Error('haha test1');
      ctx.result({ value: ctx.params.a + ctx.params.b });
    }));

    manager.register('test2', coroutine.wrap(function* serviceTest2(ctx) {
      yield coroutine.delay(10);
      if (TRUE) throw new Error('haha test2');
      ctx.result({ value: ctx.params.a * ctx.params.b });
    }));

    return coroutine(function* main() {
      try {
        yield manager.call('test1', { a: 10, b: 22 });
      } catch (err) {
        assert.equal(err.message, 'haha test1');
      }
      try {
        yield manager.call('test2', { a: 11, b: 22 });
      } catch (err) {
        assert.equal(err.message, 'haha test2');
      }
    });

  });

});
