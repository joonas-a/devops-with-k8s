const fs = require('fs').promises;
const Koa = require('koa');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = new Koa();

const port = process.env.PORT || 2341;
const envMessage = process.env.MESSAGE || 'N/A';

// Path for local testing (remember to uncomment)
//const dir = path.join(__dirname, 'files');
const dir = path.join('/', 'usr', 'src', 'app', 'files');
const config = path.join('/', 'usr', 'src', 'app', 'config');

const filepath = path.join(dir, 'logs.txt');
const configpath = path.join(config, 'information.txt');

const hash = uuidv4();

app.use(async (ctx) => {
  try {
    const time = await fs.readFile(filepath, 'utf8');
    const information = await fs.readFile(configpath, 'utf8');
    const pongs = await axios
      .get('http://pong-svc:2350/api')
      .then((res) => res.data)
      .catch((err) => {
        console.error('Failed to fetch pong count from pong-svc', err);
        return 'N/A';
      });
    ctx.type = 'html';
    ctx.body = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Logger App</title>
      </head>
      <body>
        <p>file content: ${information}</p>
        <p>env variable: ${envMessage}</p>
        <p>${time} ${hash}</p>
        <p>Ping / Pongs: ${pongs}</p>
      </body>
      </html>
    `;
  } catch (err) {
    console.error('FAILED TO READ FILE', err);
    ctx.status = 500;
    ctx.body = 'Internal Server Error';
  }
});

app.listen(port, () => {
  console.log(`Server started in port ${port}`);
});
