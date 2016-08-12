'use strict';

/**
 * super-microservices
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const os = require('os');
const assert = require('assert');
const Promise = require('bluebird');
const utils = module.exports = exports = require('lei-utils').extend();
const util = require('util');
const format = util.format;

exports.format = format;
exports.Promise = Promise;

/**
 * 生成新的requestId
 *
 * @param {Number} size 长度，默认24，范围 [16...48]
 * @return {String}
 */
exports.newRequestId = function (size) {
  const num = Number(size);
  assert(num >= 16, `utils.newRequestId(size:${ num }): size必须大于或等于16`);
  assert(num <= 48, `utils.newRequestId(size:${ num }): size必须小于或等于48`);
  return `${ Date.now() }.${ utils.randomString(48) }`.slice(0, num);
};

/**
 * 根据调用顺序生成新的requestId
 *
 * @param {String} prefix
 * @param {Number} index
 * @return {String}
 */
exports.appendRequestId = function (prefix, index) {
  return `${ prefix }:${ index }`;
};

/**
 * 生成一个Promise对象
 *
 * @param {Function} init
 * @return {Promise}
 */
exports.newPromise = function (init) {
  return new Promise(init);
};

/**
 * 使用空格将字符串分隔成多块
 *
 * @param {String} str
 * @param {Number} num
 * @return {Array}
 */
exports.whitespaceSeparatedBlocks = function (str, num) {
  const blocks = [];
  let i = 0;
  while (blocks.length < num - 1) {
    const j = str.indexOf(' ', i);
    if (j === -1) {
      blocks.push(str.slice(i).trim());
      i = str.length;
      break;
    } else {
      blocks.push(str.slice(i, j).trim());
      i = j + 1;
    }
  }
  if (i < str.length) {
    blocks.push(str.slice(i).trim());
  }
  return blocks;
};

/**
 * 获取requestId的最顶级requestId，没有则返回undefined
 *
 * @param {String} id
 * @return {String}
 */
exports.getParentRequestId = function (id) {
  const i = id.lastIndexOf(':');
  if (i === -1) return;
  return id.slice(0, i);
};

/**
 * 生成指定数量的字符
 *
 * @param {Stirng} char
 * @param {Number} num
 * @return {String}
 */
exports.takeChars = function (char, num) {
  let str = '';
  for (let i = 0; i < num; i++) {
    str += char;
  }
  return str;
};

/**
 * 检查是否为有效的logRecorder
 *
 * @param {Object} recorder
 * @return {Boolean}
 */
exports.isValidLogRecorder = function (recorder) {
  return recorder && typeof recorder.write === 'function';
};

/**
 * 编译日志格式模板
 *
 * @param {String} template
 *    可用的变量如下：
 *      - $id requestId
 *      - $date 日期，如 2016/08/02
 *      - $time 时间，如 14:01:37
 *      - $datetime 日期时间，如 2016/08/02 14:01:37
 *      - $timestamp 毫秒级的Unix时间戳，如1470980387892
 *      - $timestamps 秒级的Unix时间戳，如1470980387
 *      - $type 日志类型，如 debug, log, error, call, result
 *      - $content 内容字符串
 *      - $pid 当前进程PID
 *      - $hostname 当前主机名
 * @return {Function}
 */
exports.compileLogFormat = function (template) {
  const vars = {};
  const str = template.replace(/\$([a-z]+)/g, (a, b) => {
    vars[b] = true;
    return '${' + b + '}';
  }).replace(/`/g, '\\`');
  const lines = Object.keys(vars).map(n => {
    if (n === 'id') return `const id = ctx.requestId;`;
    if (n === 'date') return `const date = utils.date('Y/m/d');`;
    if (n === 'time') return `const time = utils.date('H:i:s');`;
    if (n === 'datetime') return `const datetime = utils.date('Y/m/d H:i:s');`;
    if (n === 'timestamp') return `const timestamp = Date.now();`;
    if (n === 'timestamps') return `const timestamps = parseInt(Date.now() / 1000, 10);`;
    if (n === 'type') return '';
    if (n === 'content') return '';
    if (n === 'pid') return `const pid = ${ process.pid };`;
    if (n === 'hostname') return `const hostname = '${ os.hostname().replace(/'/g, '\'') }'`;
    throw new Error(`不支持的日志模板变量：${ n }`);
  }).filter(a => a);
  return eval(`
(function format(ctx, type, content) {
${ lines.join('\n') }
return \`${ str }\`;
})
  `.trim());
};
