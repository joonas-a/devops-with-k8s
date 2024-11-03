const fs = require('fs').promises;
const Koa = require('koa');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = new Koa();

const port = process.env.PORT || 2341;

const dir = path.join('/', 'usr', 'src', 'app', 'files');
const filepath = path.join(dir, 'logs.txt');

const hash = uuidv4();

app.use(async (ctx) => {
  try {
    const time = await fs.readFile(filepath, 'utf8');
    ctx.body = `${time} ${hash}`;
  } catch (err) {
    console.error('FAILED TO READ FILE', err);
    ctx.status = 500;
    ctx.body = 'Internal Server Error';
  }
});

app.listen(port, () => {
  console.log(`Server started in port ${port}`);
});
