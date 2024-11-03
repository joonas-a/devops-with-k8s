const Koa = require('koa');
const app = new Koa();

const port = process.env.PORT || 3001;

let counter = 0;

app.use(async (ctx, next) => {
  counter += 1;
  await next();
});

app.use(async (ctx) => {
  ctx.body = `pong ${counter}`;
});

app.listen(port, () => {
  console.log(`Server started in port ${port}`);
});
