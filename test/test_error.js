'use strict';

/**
 * super-microservices test
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const Manager = require('../lib/manager');

describe('Service', function () {

  describe('function', function () {

    it('在 service 内出错被捕捉到', function (done) {
      const manager = new Manager();
      manager.register('test', function (ctx) {
        if (Date.now() > 0) {
          throw new Error('test');
        }
        ctx.result({ ok: true });
      });
      manager.call('test', {}, (err, _ret) => {
        assert.equal(err && err.message, 'test');
        done();
      });
    });

  });

  describe('async function (Promise)', function () {

    it('在 service 内出错被捕捉到', function (done) {
      const manager = new Manager();
      manager.register('test', function (ctx) {
        return new Promise((resolve, reject) => {
          if (Date.now() > 0) {
            throw new Error('test');
          }
          ctx.result({ ok: true });
        });
      });
      manager.call('test', {}, (err, _ret) => {
        assert.equal(err && err.message, 'test');
        done();
      });
    });

  });

});
