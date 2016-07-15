'use strict';

/**
 * super-microservices
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const Context = exports.Context = require('./lib/context');
const Manager = exports.Manager = require('./lib/manager');
const Service = exports.Service = require('./lib/service');
const utils = exports.utils = require('./lib/utils');
const error = exports.error = require('./lib/error');

const globalManager = new Manager();

exports.globalManager = globalManager;
exports.register = globalManager.register.bind(globalManager);
exports.call = globalManager.call.bind(globalManager);
