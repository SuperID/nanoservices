'use strict';

/**
 * super-microservices
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const Service = require('./service');
const Context = require('./context');
const utils = require('./utils');

// 允许设置的 options
const ALLOWED_OPTIONS = ['writeLog'];

class Manager {

  /**
   * Manager
   *
   * @param {Object} options
   *   - {Function} writeLog
   * @return {Object}
   */
  constructor(options) {
    options = Object.assign({}, options || {});
    this._options = options;
    this._services = new Map();
    this._checkOptions();
  }

  /**
   * 检查options是否正确
   */
  _checkOptions(options) {
    options = utils.merge(this._options, options || {});
    for (const name in options) {
      assert(ALLOWED_OPTIONS.indexOf(name) !== -1, `${ name } 配置项不存在`);
    }
    if (options.writeLog) {
      assert(typeof options.writeLog === 'function', `options.writeLog 必须是一个函数`);
    }
  }

  /**
   * 更新配置
   *
   * @param {String} name
   * @param {Mixed} value
   * @return {this}
   */
  setOption(name, value) {
    this._checkOptions({[name]: value});
    this._options[name] = value;
    return this;
  }

  /**
   * 获取配置
   *
   * @param {String} name
   * @return {Mixed}
   */
  getOption(name) {
    return this._options[name];
  }

  /**
   * 注册服务
   *
   * @param {String} name
   * @param {Function} handler
   * @return {this}
   */
  register(name, handler) {
    this._services.set(name, new Service(name, handler));
    return this;
  }

  /**
   * 查询服务
   *
   * @param {String} name
   * @return {Object}
   */
  getService(name) {
    return this._services.get(name) || null;
  }

  /**
   * 调用服务
   *
   * @param {String} name
   * @param {Object} params
   * @param {Function} callback
   */
  call(name, params, callback) {
    const ctx = this.newContext();
    return ctx.call(name, params, callback);
  }

  /**
   * 创建新的Context
   *
   * @param {Object} options
   * @return {Object}
   */
  newContext(options) {
    return new Context(Object.assign({
      manager: this,
      writeLog: this.getOption('writeLog'),
    }, options));
  }

}

module.exports = Manager;
