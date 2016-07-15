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

class Manager {

  /**
   * Manager
   *
   * @return {Object}
   */
  constructor() {
    this._services = new Map();
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
    return new Context(this, options);
  }

}

module.exports = Manager;
