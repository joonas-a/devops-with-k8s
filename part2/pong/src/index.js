const fs = require('fs').promises;
const Koa = require('koa');
const path = require('path');

const app = new Koa();
const pongApi = require('./router');

const port = process.env.PORT || 3001;

const dir = path.join('/', 'usr', 'src', 'app', 'files');
// const dir = path.join(__dirname, 'files');

const filepath = path.join(dir, 'pong.txt');

// Handle reguests to /api
app.use(pongApi.routes());
app.use(pongApi.allowedMethods());

// Handle requests to /
app.use(async (ctx, next) => {
  try {
    let data;

    try {
      data = await fs.readFile(filepath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        data = '0';
        await fs.writeFile(filepath, data);
      } else {
        throw err;
      }
    }

    let counter = parseInt(data, 10);
    counter += 1;

    await fs.writeFile(filepath, counter.toString());
  } catch (err) {
    console.error(err);
  }
  await next();
});

app.use(async (ctx) => {
  try {
    const counter = await fs.readFile(filepath, 'utf8');
    ctx.body = `pong ${counter}`;
  } catch (err) {
    console.error(err);
  }
});

app.listen(port, () => {
  console.log(`Server started in port ${port}`);
});
