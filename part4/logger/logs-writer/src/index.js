const { writeFile } = require('fs');
const path = require('path');

const dir = path.join('/', 'usr', 'src', 'app', 'files');
const filepath = path.join(dir, 'logs.txt');

const writeLog = () => {
  const time = new Date().toISOString();

  writeFile(filepath, time, (err) => {
    err && console.error(`error: ${err}`);
  });

  setTimeout(writeLog, 5000);
};

writeLog();
