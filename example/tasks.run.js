'use strict';

register('logstash', function () {
  let f = fs.readFileSync(path.resolve(__dirname, 'logstash.conf')).toString();
  f = f.replace(/\$dir/g, __dirname);
  exec(`logstash -e '${ f }'`);
});
