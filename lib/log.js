'use strict';

/**
 * super-microservices
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const EventEmitter = require('events').EventEmitter;
const utils = require('./utils');
const error = require('./error');


/**
 * 解析一行日志
 *
 * @param {String} line
 * @reutrn {Object}
 *   - {String} date
 *   - {String} time
 *   - {String} id
 *   - {Stirng} type
 *   - {String} content
 */
function parseLine(line) {
  const blocks = utils.whitespaceSeparatedBlocks(line, 5);
  if (blocks.length < 5) return;
  const date = blocks[0];
  const time = blocks[1];
  const id = blocks[2].slice(1, -1);
  const type = blocks[3].slice(1, -1);
  const content = blocks[4];
  return { date, time, id, type, content };
}

class LogFilter extends EventEmitter {

  /**
   * 日志筛选器
   *
   * @param {Object} options
   *   - {Boolean} ignoreErrorLine
   *   - {String} requestId
   */
  constructor(options) {
    super();
    this._options = utils.merge(options || {});
    this._options.ignoreErrorLine = !!this._options.ignoreErrorLine;
    this._options.requestId = this._options.requestId || undefined;
    this._lines = [];
  }

  /**
   * 写入一行日志
   *
   * @param {String} line
   */
  writeLine(line) {
    const log = parseLine(line);
    if (log) {
      this._filterLine(log);
    } else if (!this._options.ignoreErrorLine) {
      throw new error.InvalidLogLineFormatError(line);
    }
  }

  _filterLine(log) {
    const requestId = this._options.requestId;
    if (requestId) {
      if (log.id.indexOf(requestId) !== 0) {
        return;
      }
    }
    this._lines.push(log);
    this.emit('log', log);
  }

  forEach(fn) {
    this._lines.forEach(fn);
  }

}

module.exports = LogFilter;
