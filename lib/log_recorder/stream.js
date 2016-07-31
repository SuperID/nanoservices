'use strict';

/**
 * super-microservices
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const utils = require('../utils');

class StreamRecorder {

  /**
   * 基于流的日志记录器
   *
   * @param {Object} stream
   * @param {String} newLine 换行符，为空时不自动加上换行符
   */
  constructor(stream, newLine) {
    assert.ok(stream, `new StreamRecorder(stream): 缺少stream参数`);
    assert.equal(typeof stream.write, 'function', `new StreamRecorder(stream): stream.write不是一个函数`);
    this.stream = stream;
    this.newLine = newLine;
  }

  /**
   * 打印日志
   *
   * @param {Object} ctx 当前的context
   * @param {String} type 日志类型
   * @param {String} text 内容
   */
  write(ctx, type, text) {
    let content = `${ utils.date('Y-m-d H:i:s') } [${ ctx.requestId }] [${ type.toLowerCase() }] ${ text }`;
    if (this.newLine) content += this.newLine;
    this.stream.write(content);
  }

}

module.exports = StreamRecorder;
