'use strict';

/**
 * super-microservices
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const utils = require('../utils');

class LoggerRecorder {

  /**
   * 基于logger接口的日志记录器
   *
   * @param {Object} logger
   * @param {Object} options
   *   - {String} format 格式
   */
  constructor(logger, options) {

    assert.ok(logger, `new LoggerRecorder(logger): 缺少logger参数`);
    assert.equal(typeof logger.debug, 'function', `new LoggerRecorder(logger): logger.debug不是一个函数`);
    assert.equal(typeof logger.log, 'function', `new LoggerRecorder(logger): logger.log不是一个函数`);
    assert.equal(typeof logger.error, 'function', `new LoggerRecorder(logger): logger.error不是一个函数`);
    assert.equal(typeof logger.info, 'function', `new LoggerRecorder(logger): logger.info不是一个函数`);
    this.logger = logger;

    const opts = Object.assign({
      format: '$type $id $content',
    }, options);

    assert.equal(typeof opts.format, 'string', `new LoggerRecorder(logger, { format }): format不是字符串`);
    this.format = utils.compileLogFormat(opts.format);

  }

  /**
   * 打印日志
   *
   * @param {Object} ctx 当前的context
   * @param {String} type 日志类型
   * @param {String} content 内容
   */
  write(ctx, type, content) {
    const lowerType = type.toLowerCase();
    const method = selectLoggerMethod(this.logger, lowerType);
    method.call(this.logger, this.format(ctx, type, content));
  }

}

function selectLoggerMethod(logger, type) {
  if (type === 'debug') return logger.debug;
  if (type === 'log') return logger.log;
  if (type === 'error') return logger.error;
  return logger.info;
}

module.exports = LoggerRecorder;
