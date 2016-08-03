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
   * @param {Object} options
   *   - {String} format 格式
   *   - {String} newLine 换行符，为空时不自动加上换行符
   */
  constructor(stream, options) {

    assert.ok(stream, `new StreamRecorder(stream): 缺少stream参数`);
    assert.equal(typeof stream.write, 'function', `new StreamRecorder(stream): stream.write不是一个函数`);
    this.stream = stream;

    const opts = Object.assign({
      format: '$date $time $type: [$id] $content',
      newLine: false,
    }, options);

    assert.equal(typeof opts.format, 'string', `new LoggerRecorder(logger, { format }): format不是字符串`);
    this.format = utils.compileLogFormat(opts.format);

    this.newLine = opts.newLine;

  }

  /**
   * 打印日志
   *
   * @param {Object} ctx 当前的context
   * @param {String} type 日志类型
   * @param {String} content 内容
   */
  write(ctx, type, content) {
    let str = this.format(ctx, type, content);
    if (this.newLine) str += this.newLine;
    this.stream.write(str);
  }

}

module.exports = StreamRecorder;
