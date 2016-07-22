'use strict';

/**
 * super-microservices
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const Promise = require('bluebird');
const utils = module.exports = exports = require('lei-utils').extend();
// TODO: 升级到Node v6时去掉
const util = require('util');
const format = util.format;

exports.format = format;

/**
 * 生成新的requestId
 *
 * @param {Number} size 长度，默认24，范围 [16...48]
 * @return {String}
 */
exports.newRequestId = function (size) {
  size = Number(size);
  assert(size >= 16, `utils.newRequestId(size:${size}): size必须大于或等于16`);
  assert(size <= 48, `utils.newRequestId(size:${size}): size必须小于或等于48`);
  return `${Date.now()}.${utils.randomString(48)}`.slice(0, size);
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

/**
 * 生成一个Promise对象
 *
 * @param {Function} init
 * @return {Promise}
 */
exports.newPromise = function (init) {
  return new Promise(init);
};

/**
 * 使用空格将字符串分隔成多块
 *
 * @param {String} str
 * @param {Number} num
 * @return {Array}
 */
exports.whitespaceSeparatedBlocks = function (str, num) {
  const blocks = [];
  let i = 0;
  while (blocks.length < num - 1) {
    const j = str.indexOf(' ', i);
    if (j === -1) {
      blocks.push(str.slice(i).trim());
      i = str.length;
      break;
    } else {
      blocks.push(str.slice(i, j).trim());
      i = j + 1;
    }
  }
  if (i < str.length) {
    blocks.push(str.slice(i).trim());
  }
  return blocks;
};

/**
 * 获取requestId的最顶级requestId，没有则返回undefined
 *
 * @param {String} id
 * @return {String}
 */
exports.getParentRequestId = function (id) {
  const i = id.lastIndexOf(':');
  if (i === -1) return;
  return id.slice(0, i);
};

/**
 * 生成指定数量的字符
 *
 * @param {Stirng} char
 * @param {Number} num
 * @return {String}
 */
exports.takeChars = function (char, num) {
  let str = '';
  for (let i = 0; i < num; i++) {
    str += char;
  }
  return str;
};
