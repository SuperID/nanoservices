'use strict';

const fs = require('fs');
const path = require('path');
const stream = require('stream');
const clc = require('cli-color');
const readLine = require('lei-stream').readLine;
const microservices = require('../');


class TailStream extends stream.Readable {

  /**
   * TailStream
   *
   * @param {Object} options
   *   - {String} file
   *   - {Number} delay defaults=100
   */
  constructor(options) {
    options = options || {};
    super(options);
    this._file = options.file;
    this._delay = options.delay || 100;
    this._position = 0;
    this._fd = fs.openSync(this._file, 'r');
    this._delayId = null;
    this._reading = false;
  }

  _getHighWaterMark() {
    return this._readableState.highWaterMark;
  }

  _read(size) {
    if (this._reading) return;
    this._reading = true;
    fs.read(this._fd, new Buffer(size), 0, size, this._position, (err, bytesRead, buf) => {
      this._reading = false;
      if (err) {
        process.nextTick(() => this.emit('error', err));
        return;
      }
      if (bytesRead > 0) {
        this._position += bytesRead;
        this.push(buf.slice(0, bytesRead));
      } else {
        this._delayId = setTimeout(() => this._read(size), this._delay);
      }
    });
  }

  pause() {
    super.pause();
    clearTimeout(this._delayId);
    this._delayId = setTimeout(() => this._read(this._getHighWaterMark()), 0x7FFFFFFF);
  }

  resume() {
    super.resume();
    this._read(this._getHighWaterMark());
  }

  close() {
    clearTimeout(this._delayId);
    this.push(null);
  }

}


function getRequestLevel(id) {
  return id.split(':').length;
}

const typeColorMap = {
  call: 'yellow',
  result: 'yellow',
  debug: 'blue',
  log: 'green',
  error: 'red',
};

function typeColor(type, content) {
  if (typeColorMap[type]) {
    return clc[typeColorMap[type]](content);
  }
  return content;
}

function mutedColor(content) {
  return clc.magenta(content);
}

function printLog(log) {
  const indent = microservices.utils.takeChars(' ', getRequestLevel(log.id) * 4);
  console.log(log.time + indent + mutedColor(log.id) + typeColor(log.type, ` ${clc.bold(log.type)} ${log.content}`));
}

function main() {

  const filter = new microservices.LogFilter({
    requestId: process.argv[3],
  });
  filter.on('log', printLog);

  const stream = new TailStream({
    file: path.resolve(__dirname, process.argv[2]),
    delay: 100,
  });
  readLine(stream).go((line, next) => {
    filter.writeLine(line);
    next();
  });
}

main();
