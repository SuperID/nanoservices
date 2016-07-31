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
   *   - {String} file 文件名
   */
  constructor(options) {
    const opts = options || {};
    // 调用基类的构造函数
    super(opts);
    // 文件名
    this._file = opts.file;
    // 标记是否准备就绪
    this._ready = false;
    // 开始打开文件
    this._openFile();
  }

  // 打开文件
  _openFile() {
    fs.open(this._file, 'r', (err, fd) => {
      if (err) return this.emit('error', err);
      this._fd = fd;
      this._watchFile();
      this._ready = true;
      this._tryRead();
    });
  }

  // 监听文件内容变化
  _watchFile() {
    this._watcher = fs.watch(this._file, (event, _filename) => {
      if (event === 'change') {
        this._tryRead();
      }
    });
  }

  // 获取每次合适的读取字节数
  _getHighWaterMark() {
    return this._readableState.highWaterMark;
  }

  // 尝试读取数据
  _tryRead() {
    this._read(this._getHighWaterMark());
  }

  // 读取数据
  _read(size) {
    if (this._ready) {
      this._ready = false;
      fs.read(this._fd, new Buffer(size), 0, size, this._position,
      (err, bytesRead, buf) => {
        this._ready = true;
        if (err) return this.emit('error', err);
        if (bytesRead > 0) {
          // 将数据推送到队列
          this._position += bytesRead;
          this.push(buf.slice(0, bytesRead));
        }
      });
    }
  }

  // 关闭
  close() {
    this._watcher.close();
    fs.close(this._fd, err => {
      if (err) return this.emit('error', err);
    });
  }

}


// function getRequestLevel(id) {
//   return id.split(':').length;
// }

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
  // const indent = microservices.utils.takeChars(' ', getRequestLevel(log.id) * 2);
  const indent = ' ';
  console.log(log.time + indent + mutedColor(log.id) + typeColor(log.type, ` ${ clc.bold(log.type) } ${ log.content }`));
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
