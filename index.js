'use strict';

/**
 * super-microservices
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

exports.Context = require('./lib/context');
const Manager = exports.Manager = require('./lib/manager');
exports.Service = require('./lib/service');
exports.utils = require('./lib/utils');
exports.error = require('./lib/error');
exports.LogFilter = require('./lib/log_filter');

const globalManager = new Manager();

exports.globalManager = globalManager;
exports.register = globalManager.register.bind(globalManager);
exports.call = globalManager.call.bind(globalManager);
