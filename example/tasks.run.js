'use strict';

/* global register, path, fs, exec */

register('logstash', function () {
  const f = path.resolve(__dirname, 'logstash.conf');
  let c = fs.readFileSync(f).toString().trim();
  c = c.replace(/\$dir/g, __dirname);
  exec(`logstash -e '${ c }'`);
});

register('test', function () {
  exec(`node test`);
});
