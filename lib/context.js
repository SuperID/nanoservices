'use strict';

/**
 * super-microservices
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const utils = require('./utils');
const error = require('./error');
// TODO: 升级到Node v6时去掉
const ServiceNotFoundError = error.ServiceNotFoundError;

class Context {

  /**
   * Context
   *
   * @param {Object} options
   *   - {Object} manager
   *   - {Object} service
   *   - {String} requestId
   *   - {Object} params
   *   - {Function} callback
   *   - {Function} writeLog
   */
  constructor(options) {

    options = options || {};
    // manager对象
    this._manager = options.manager || null;
    // service对象
    this._service = options.service || null;
    // 拼接requestId
    this.requestId = options.requestId || utils.newRequestId(Context.REQUEST_ID_MIN_SIZE);
    // 冻结参数对象
    this.params = Object.freeze(options.params || {});
    // 回调函数
    this._callback = options.callback || null;
    // 打印日志函数
    this._writeLog = options.writeLog || null;

    assert(!!this._manager, `new Context({manager}): manager不能为空`);
    if (this._callback) assert(typeof this._callback === 'function', `new Context({callback}): callback必须为一个函数`);
    if (this._writeLog) assert(typeof this._writeLog === 'function', `new Context({writeLog}): writeLog必须为一个函数`);

    // 执行结束相关的信息
    this.startTime = new Date();
    this.stopTime = null;
    this.spent = 0;
    this._isCallbacked = false;

    this._counter = 0;

    this.log('[init] %j', {service: this._service && this._service.name, params: this.params});
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
    this.log('[callback] %j', {spent: this.spent, error: err, result: ret});
    this._callback(err, ret);
  }

  /**
   * 打印调试信息
   */
  debug() {
    this._writeLog && this._writeLog(`${utils.date('Y-m-d H:i:s')} ${this.requestId} [debug] ${utils.format.apply(null, arguments)}`);
  }

  /**
   * 打印日志信息
   */
  log() {
    this._writeLog && this._writeLog(`${utils.date('Y-m-d H:i:s')} ${this.requestId} [log] ${utils.format.apply(null, arguments)}`);
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
    const ctx = this._manager.newContext({service, requestId, params, callback});

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

  /**
   * 顺序调用多个服务
   *
   * @param {Array} list 每个元素使用context.prepareCall(name, params)创建
   * @param {Function} callback
   */
  series(list, callback) {
    const rest = list.slice();

    const next = (err, params) => {
      if (err) return callback(err);
      if (rest.length < 1) return callback(null, params);
      const item = rest.shift();
      item(params, next);
    };

    next();
  }

  /**
   * 构建预调用服务函数
   *
   * @param {String} name
   * @param {Object} specifyParams 如果指定了此参数，会覆盖在调用时指定的参数
   * @return {Function}
   */
  prepareCall(name, specifyParams) {
    return (params, callback) => {
      const newParams = arguments.length > 1 ? specifyParams : params;
      this.call(name, newParams, callback);
    };
  }

}

Context.REQUEST_ID_MIN_SIZE = 24;

module.exports = Context;
