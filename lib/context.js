'use strict';

/**
 * super-microservices
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const utils = require('./utils');
const error = require('./error');
const Service = require('./service');
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
   *   - {Object} logRecorder
   */
  constructor(options) {

    const opts = Object.assign({}, options || {});

    // 严格要求输入的params必须是一个对象
    if (opts.params) {
      const paramsType = typeof opts.params;
      assert(paramsType === 'object', `new Context({params}): params只能为一个对象，不能为${ paramsType }类型`);
    }

    // manager对象
    this._manager = opts.manager || null;
    // service对象
    this._service = opts.service || null;
    // 拼接requestId
    this.requestId = opts.requestId || utils.newRequestId(Context.REQUEST_ID_MIN_SIZE);
    // 复制并冻结参数对象
    this.params = Object.freeze(Object.assign({}, opts.params || {}));
    // 回调函数
    this._callback = opts.callback || null;
    // 打印日志函数
    this._logRecorder = opts.logRecorder || null;

    assert(!!this._manager, `new Context({ manager }): manager不能为空`);
    assert(typeof this._manager.getService === 'function', `new Context({ manager }): manager.getService()未定义`);
    assert(typeof this._manager.newContext === 'function', `new Context({ manager }): manager.newContext()未定义`);

    if (this._callback) assert(typeof this._callback === 'function', `new Context({ callback }): callback必须为一个函数`);
    if (this._logRecorder) assert(utils.isValidLogRecorder(this._logRecorder), `new Context({ logRecorder }): logRecorder必须是一个有效的LogRecorder`);
    if (this._service) assert(this._service instanceof Service, `new Context(service): service必须为Service的实例`);

    // 执行结束相关的信息
    this.startTime = new Date();
    this.stopTime = null;
    this.spent = 0;
    this._isCallbacked = false;

    this._counter = 0;

    this.writeJSON('call', { service: this._service && this._service.name, params: this.params });
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
    setImmediate(() => {

      // 不允许重复执行回调
      if (this._isCallbacked) {
        return this.debug('context.callback(): callback many times, ignore');
      }

      this.stopTime = new Date();
      this.spent = this.stopTime - this.startTime;

      if (!this._callback) {
        return this.debug('context.callback(): has no callback handler');
      }

      this._isCallbacked = true;
      if (err) {
        this.writeJSON('error', { spent: this.spent, error: err });
      } else {
        this.writeJSON('result', { spent: this.spent, result: ret });
      }
      this._callback(err, ret);

    });
  }

  /**
   * 打印日志
   *
   * @param {String} type 日志类型
   * @param {String} text 内容
   */
  write(type, text) {
    if (this._logRecorder) {
      this._logRecorder.write(this, type, text);
    }
  }

  /**
   * 打印日志（JSON对象）
   *
   * @param {String} type 日志类型
   * @param {String} text 内容
   */
  writeJSON(type, data) {
    this.write(type, JSON.stringify(data));
  }

  /**
   * 打印调试信息
   */
  debug() {
    this.write('debug', utils.format.apply(null, arguments));
  }

  /**
   * 打印日志信息
   */
  log() {
    this.write('log', utils.format.apply(null, arguments));
  }

  /**
   * 调用服务
   *
   * @param {String} name
   * @param {Object} params
   * @param {Function} callback
   */
  call(name, params, callback) {
    return utils.newPromise((resolve, reject) => {
      const cb = (err, ret) => {
        if (err) {
          reject(err);
          callback && callback(err);
        } else {
          resolve(ret);
          callback && callback(null, ret);
        }
      };
      // 查询服务
      const service = this._manager.getService(name);
      if (!service) return cb(new ServiceNotFoundError(`服务"${ name }"未注册`));
      // 生成requestId
      this._counter += 1;
      const requestId = utils.appendRequestId(this.requestId, this._counter);
      // 生成新的Context
      const ctx = this._manager.newContext({ service, requestId, params, callback: cb });
      // 调用服务
      service.call(ctx);
    });
  }

  /**
   * 调用服务，并将调用结果作为当前服务的结果返回
   *
   * @param {String} name
   * @param {Function} params
   */
  next(name, params) {
    this.call(name, params, (err, ret) => {
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
    return utils.newPromise((resolve, reject) => {
      const cb = (err, ret) => {
        if (err) {
          reject(err);
          callback && callback(err);
        } else {
          resolve(ret);
          callback && callback(null, ret);
        }
      };
      const rest = list.slice();
      const next = (err, params) => {
        if (err) return cb(err);
        if (rest.length < 1) return cb(null, params);
        const item = rest.shift();
        item(params, next);
      };
      next();
    });
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
