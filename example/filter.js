'use strict';

const fs = require('fs');
const path = require('path');
const clc = require('cli-color');
const microservices = require('../');

function tailf(filename, delay, callback) {

  const fd = fs.openSync(filename, 'r');
  const CHUNK_SIZE = 64 * 1024;

  let position = 0;
  let lastBuf = new Buffer(0);

  function next() {

    const buf = new Buffer(CHUNK_SIZE);
    const bytesRead = fs.readSync(fd, buf, 0, CHUNK_SIZE, position);

    position += bytesRead;
    const readBuf = Buffer.concat([lastBuf, buf.slice(0, bytesRead)]);
    let lastIndex = 0;
    for (let i = 0; i < readBuf.length; i++) {
      if (readBuf[i] === 10) {
        callback(readBuf.slice(lastIndex, i).toString().trim());
        lastIndex = i;
      }
    }
    lastBuf = readBuf.slice(lastIndex);

    if (bytesRead < CHUNK_SIZE) {
      setTimeout(next, delay);
    } else {
      next();
    }

  }
  next();
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
  tailf(path.resolve(__dirname, process.argv[2]), 100, line => {
    filter.writeLine(line);
  });
}

main();
