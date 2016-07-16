'use strict';

const fs = require('fs');
const path = require('path');
const {readLine} = require('lei-stream');

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

const requestIds = {};
readLine(path.resolve(__dirname, './call.log')).go((data, next) => {
  const [date, time, id, logType, title, content] = whitespaceSeparatedBlocks(data, 6);
  if (!Array.isArray(requestIds[id])) {
    requestIds[id] = [];
  }
  requestIds[id].push({date, time, id, logType, title, content});
  next();
}, function () {
  console.log(Object.keys(requestIds).sort());
});

