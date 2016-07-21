'use strict';

/**
 * super-microservices test
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const Context = require('../lib/context');

describe('Context', function () {

  describe('new Context(options)', function () {

    it('manager - 必须指定');

    it('requestId - 未指定时自动生成');

    it('params - 被冻结');
    it('params - 不影响原来的对象');

    it('callback - 必须指定，且为一个函数');

    it('writeLog - 必须为一个函数');

  });

});
