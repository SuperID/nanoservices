'use strict';

const fs = require('fs');
const path = require('path');
const readLine = require('lei-stream').readLine;
const clc = require('cli-color');

function whitespaceSeparatedBlocks(str, num) {
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
}

function getParentId(id) {
  const i = id.lastIndexOf(':');
  if (i === -1) return;
  return id.slice(0, i);
}

function takeSpaces(num) {
  let str = '';
  for (let i = 0; i < num; i++) {
    str += ' ';
  }
  return str;
}

function main() {
  const requestIdMap = {};
  readLine(path.resolve(__dirname, process.argv[2])).go((data, next) => {
    const blocks = whitespaceSeparatedBlocks(data, 5);
    const date = blocks[0];
    const time = blocks[1];
    const id = blocks[2].slice(1, -1);
    const type = blocks[3].slice(1, -1);
    const content = blocks[4];
    if (!Array.isArray(requestIdMap[id])) {
      requestIdMap[id] = [];
    }
    requestIdMap[id].push({date, time, id, type, content});
    next();
  }, function (err) {
    if (err) throw err;

    let requestIds = Object.keys(requestIdMap).sort();
    if (!process.argv[3]) {
      console.log(requestIds.filter(id => !getParentId(id)).join('\n'));
      return;
    }

    requestIds = requestIds.filter(id => id.indexOf(process.argv[3]) === 0);

    function getRequestIdInfo(id) {
      return {
        id,
        log: requestIdMap[id],
        call: [],
      };
    }

    const map = {};
    requestIds.forEach(id => {
      map[id] = getRequestIdInfo(id);
    });
    requestIds.forEach(id => {
      const parentId = getParentId(id);
      if (parentId) {
        map[parentId].call.push(map[id]);
      }
    });

    const top = map[requestIds[0]];
    if (top) {
      prettyPrint(top, 0);
    } else {
      console.log('cannot find %s', process.argv[3]);
    }
  });
}

function prettyPrint(data, level) {
  const indent = takeSpaces(level * 4);
  // console.log(indent + clc.magenta(`id: ${data.id}`));
  data.log.forEach(log => {
    switch (log.type) {
      case 'call': {
        const info = JSON.parse(log.content);
        if (info.service) {
          console.log(indent + clc.blue(`${clc.bold(info.service)}(${JSON.stringify(info.params)})`) + '  ' + clc.magenta(`[${data.id}]`));
        }
        break;
      }
      case 'result':
        console.log(indent + clc.bold(clc.green(`  - result: ${log.content}`)));
        break;
      case 'error':
        console.log(indent + clc.red(`  - error: ${log.content}`));
        break;
      case 'debug':
        console.log(indent + clc.magenta(`  - debug: ${log.content}`));
        break;
      case 'log':
        console.log(indent + clc.yellow(`  - log: ${log.content}`));
        break;
      default:
        console.log(indent + clc.yellow(`  - ${log.type}: ${log.content}`));
        break;
    }
  });
  data.call.forEach(info => {
    prettyPrint(info, level + 1);
  });
}

main();
