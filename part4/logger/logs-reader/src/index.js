const fs = require('fs').promises;
const Koa = require('koa');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = new Koa();

const port = process.env.PORT || 2341;
const envMessage = process.env.MESSAGE || 'N/A';

const fileDir = path.join('/', 'usr', 'src', 'app', 'files');
const configDir = path.join('/', 'usr', 'src', 'app', 'config');

const filepath = path.join(fileDir, 'logs.txt');
const configpath = path.join(configDir, 'information.txt');

const hash = uuidv4();

app.use(async (ctx, next) => {
  if (ctx.path === '/healthz') {
    try {
      const response = await axios.get('http://pong-svc:2350/api');
      if (response.status === 200) {
        ctx.status = 200;
        ctx.body = 'Pong service is ready';
      } else {
        ctx.status = 500;
        ctx.body = 'Pong service is not ready';
      }
    } catch (err) {
      console.error('Failed to reach pong-svc', err);
      ctx.status = 500;
      ctx.body = 'Pong service is not ready';
    }
  } else {
    await next();
  }
});

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
