'use strict';

/**
 * super-microservices test
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const utils = require('../lib/utils');

describe('utils', function () {

  describe('newRequestId(size)', function () {

    it('不指定长度会报错', function () {
      assert.throws(() => {
        utils.newRequestId();
      }, /AssertionError/);
    });

    it('长度范围不正确会报错', function () {
      assert.throws(() => {
        utils.newRequestId(10);
      }, /AssertionError/);
      assert.throws(() => {
        utils.newRequestId(60);
      }, /AssertionError/);
    });

    it('指定长度', function () {
      assert.equal(utils.newRequestId(20).length, 20);
      assert.equal(utils.newRequestId(30).length, 30);
    });

  });

  describe('appendRequestId(id, index)', function () {

    it('生成的ID必须同时包含主ID和后缀', function () {
      const id = utils.newRequestId(20);
      const suffix = '5:6';
      const newId = utils.appendRequestId(id, suffix);
      assert.equal(newId.indexOf(id), 0);
      assert.notEqual(newId.indexOf(suffix), -1);
    });

  });

});
