const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

const port = process.env.PORT || 3001;

app.use(bodyParser());

// in memory todos
let todos = [
  { id: 1, text: 'TMP TODO 1' },
  { id: 2, text: 'TMP TODO 2' },
];

const nextTodoId = () => {
  return todos.reduce((maxId, todo) => Math.max(todo.id, maxId), 0) + 1;
};

router.all('/', (ctx) => {
  console.log('Received request:', ctx.method, ctx.url);
  if (ctx.method == 'GET') {
    ctx.body = todos;
  } else if (ctx.method == 'POST') {
    const { text } = ctx.request.body;
    if (!text) {
      ctx.status = 400;
      ctx.body = 'todo cannot be empty';
      return;
    } else if (text.length > 140) {
      ctx.status = 400;
      ctx.body = 'todo cannot be over 140 characters';
      return;
    }

    const id = nextTodoId();
    todos.push({ id, text });
    ctx.status = 201;
    ctx.body = { id, text };
  } else {
    ctx.status = 405;
    ctx.body = 'Method Not Allowed';
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(port, () => {
  console.log(`todo-backend is running on http://localhost:${port}`);
});
