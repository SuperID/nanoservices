'use strict';

/**
 * super-microservices test
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const Context = require('../lib/context');
const Manager = require('../lib/manager');
const Service = require('../lib/service');
const utils = require('../lib/utils');
const error = require('../lib/error');
const microservices = require('../');

describe('exports', function () {

  it('Context', function () {
    assert.equal(microservices.Context, Context);
  });

  it('Manager', function () {
    assert.equal(microservices.Manager, Manager);
  });

  it('Service', function () {
    assert.equal(microservices.Service, Service);
  });

  it('utils', function () {
    assert.equal(microservices.utils, utils);
  });

  it('error', function () {
    assert.equal(microservices.error, error);
  });

  it('globalManager', function () {
    assert(microservices.globalManager instanceof Manager);
  });

  it('call()', function () {
    assert(typeof microservices.call === 'function');
  });

  it('register()', function () {
    assert(typeof microservices.register === 'function');
  });

  it('快速使用', function (done) {
    microservices.register('hello', function (ctx) {
      ctx.result('world');
    });
    microservices.call('hello', {}, (err, ret) => {
      assert.equal(err, null);
      assert.equal(ret, 'world');
      done();
    });
  });

});
