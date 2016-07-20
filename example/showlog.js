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
    console.log(requestIds.join('\n'));
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

  function getParentId(id) {
    const i = id.lastIndexOf(':');
    if (i === -1) return;
    return id.slice(0, i);
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
  prettyPrint(top, 0);
});

function takeSpaces(num) {
  let str = '';
  for (let i = 0; i < num; i++) {
    str += ' ';
  }
  return str;
}

function prettyPrint(info, level) {
  const indent = takeSpaces(level * 4);
  console.log(indent + `id: ${clc.yellow(info.id)}`);
  info.log.forEach(log => {
    console.log(indent + `  - ${clc.cyan(log.time)} ${log.type} ${clc.green(log.content)}`);
  });
  info.call.forEach(info => {
    prettyPrint(info, level + 1);
  });
}
