'use strict';

/**
 * super-microservices
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const utils = require('./utils');

exports.ServiceNotFoundError = utils.customError('ServiceNotFoundError', {
  code: 'SERVICE_NOT_FOUND',
});
