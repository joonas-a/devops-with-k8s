const Router = require('koa-router');
const fs = require('fs').promises;
const path = require('path');

const router = new Router({ prefix: '/api' });

const pongPath = path.join('/', 'usr', 'src', 'app', 'files', 'pong.txt');
// const pongPath = path.join(__dirname, 'files', 'pong.txt');

const pongs = () => {
  return new Promise((resolve, _reject) => {
    fs.readFile(pongPath, 'utf8')
      .then((data) => {
        resolve(parseInt(data, 10));
      })
      .catch((err) => {
        console.error(err);
        // resolve 0 if file does not exist
        resolve(0);
      });
  });
};

router.get('/', async (ctx) => {
  try {
    const counter = await pongs();
    ctx.body = `${counter}`;
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
