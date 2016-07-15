'use strict';

/**
 * super-microservices
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const {format} = require('util');
const utils = module.exports = exports = require('lei-utils').extend();

exports.format = format;

/**
 * 生成新的requestId
 *
 * @param {Number} size 长度，默认24，范围 [16...48]
 * @return {String}
 */
exports.newRequestId = function (size = 24) {
  size = Number(size);
  assert(size >= 16, `utils.newRequestId(size:${size}): size必须大于或等于16`);
  assert(size <= 48, `utils.newRequestId(size:${size}): size必须小于或等于48`);
  return `${Date.now()}${utils.randomString(48)}`.slice(0, size);
};

/**
 * 根据调用顺序生成新的requestId
 *
 * @param {String} prefix
 * @param {Number} index
 * @return {String}
 */
exports.appendRequestId = function (prefix, index) {
  return `${prefix}:${index}`;
};
