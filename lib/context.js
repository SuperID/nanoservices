'use strict';

/**
 * super-microservices
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const utils = require('./utils');
const {ServiceNotFoundError} = require('./error');

class Context {

  /**
   * Context
   *
   * @param {Object} manager
   * @param {Object} options
   *   - {Object} service
   *   - {String} requestId
   *   - {Object} params
   *   - {Function} callback
   */
  constructor(manager, options) {
    this._manager = manager;

    options = options || {};
    // service对象
    this._service = options.service || null;
    // 拼接requestId
    this.requestId = options.requestId || utils.newRequestId();
    // 冻结参数对象
    this.params = Object.freeze(options.params || {});
    // 回调函数
    this._callback = options.callback || null;

    if (this._callback) assert(typeof this._callback === 'function', `new Context(manager, {callback}): callback必须为一个函数`);

    // 执行结束相关的信息
    this.startTime = new Date();
    this.stopTime = null;
    this.spent = 0;
    this._isCallbacked = false;

    this._counter = 0;

    this.log('[init] service=%s, params=%j', this._service && this._service.name, this.params);
  }

  /**
   * 返回结果
   *
   * @param {Object} ret
   */
  result(ret) {
    this.callback(null, ret);
  }

  /**
   * 返回错误
   *
   * @param {Error} err
   */
  error(err) {
    this.callback(err);
  }

  /**
   * 执行回调
   *
   * @param {Error} err
   * @param {Object} ret
   */
  callback(err, ret) {

    // 不允许重复执行回调
    if (this._isCallbacked) {
      return this.debug('context.callback(): callback many times, ignore');
    }

    this.stopTime = new Date();
    this.spent = this.startTime - this.stopTime;

    if (!this._callback) {
      return this.debug('context.callback(): has no callback handler');
    }

    this._isCallbacked = true;
    this.log('[callback] err=%s, ret=%j', err, ret);
    this._callback(err, ret);
  }

  /**
   * 打印调试信息
   */
  debug(...args) {
    console.log(utils.date('Y-m-d H:i:s'), this.requestId, '[debug]', utils.format(...args));
  }

  /**
   * 打印日志信息
   */
  log(...args) {
    console.log(utils.date('Y-m-d H:i:s'), this.requestId, '[log]', utils.format(...args));
  }

  /**
   * 调用服务
   *
   * @param {String} name
   * @param {Function} params
   */
  call(name, params, callback) {

    // 查询服务
    const service = this._manager.getService(name);
    if (!service) return callback(new ServiceNotFoundError(`服务"${name}"未注册`));

    // 生成requestId
    const requestId = utils.appendRequestId(this.requestId, this._counter++);

    // 生成新的Context
    const ctx = new Context(this._manager, {service, requestId, params, callback});

    // 调用服务
    return service.call(ctx);
  }

  /**
   * 调用服务，并将调用结果作为当前服务的结果返回
   *
   * @param {String} name
   * @param {Function} params
   */
  next(name, params) {
    return this.call(name, params, (err, ret) => {
      if (err) {
        this.error(err);
      } else {
        this.result(ret);
      }
    });
  }

}

module.exports = Context;
