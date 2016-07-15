'use strict';

/**
 * super-microservices
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const utils = require('./utils');

class Service {

  /**
   * Service
   *
   * @param {String} name
   * @param {Function} handler
   * @return {Object}
   */
  constructor(name, handler) {
    assert(typeof name === 'string', `new Service(name, handler): name必须是字符串类型`)
    assert(typeof handler === 'function', 'new Service(name, handler): handler必须为一个函数');
    assert(handler.length === 1, 'new Service(name, handler): handler函数只能有一个参数，比如function (ctx) {}');
    this.name = name;
    this.handler = handler;
  }

  /**
   * 执行服务
   *
   * @param {Object} ctx
   */
  call(ctx) {
    process.nextTick(() => {
      try {
        this.handler.call(ctx, ctx);
      } catch (err) {
        ctx.error(err);
      }
    });
  }

}

module.exports = Service;
