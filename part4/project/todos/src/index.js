const Koa = require('koa');
const fs = require('fs').promises;
const { createWriteStream } = require('fs');
const axios = require('axios');
const path = require('path');
const bodyParser = require('koa-bodyparser');
const app = new Koa();

const port = process.env.PORT || 3000;
const backendPort = process.env.BACKEND_PORT || 3001;

// const dir = path.join(__dirname, '..', 'files');
const dir = path.join('/', 'usr', 'src', 'app', 'files');
const imagepath = path.join(dir, 'image.jpg');
const imageURL = 'https://picsum.photos/400';

const imageFetcher = async () => {
  try {
    const response = await axios.get(imageURL, { responseType: 'stream' });
    const writer = createWriteStream(imagepath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    console.log('Fetched image.');
  } catch (err) {
    console.error('Failed to fetch image from remote.', err);
  }
};

const imageOlderThanHour = async () => {
  try {
    const { mtime } = await fs.stat(imagepath);
    const now = new Date();
    const diff = now - mtime;
    const diffHours = diff / 1000 / 60 / 60;
    console.log("Image's age in hours:", diffHours);
    return diffHours > 1;
  } catch (err) {
    console.error('Failed to check image age.', err);
    return true;
  }
};

const todoToHtml = (todos) => {
  console.log('todos:', todos);
  return todos
    .map((todo) => `<li id=${todo.id.toString()}>${todo.text}</li>`)
    .join('');
};

const handleFormSubmission = async (text) => {
  try {
    const response = await axios.post(`http://localhost:${backendPort}/`, {
      text,
    });
    return response.status === 201;
  } catch (e) {
    console.error('Failed to submit form', e);
    return false;
  }
};

app.use(bodyParser());

app.use(async (ctx, next) => {
  if (ctx.path === '/healthz') {
    try {
      const backendResponse = await axios.get(
        `http://localhost:${backendPort}/healthz`
      );
      if (backendResponse.status !== 200) {
        ctx.status = 500;
        ctx.body = 'todo-backend is not operational';
        return;
      }

      ctx.status = 200;
      ctx.body = 'OK';
    } catch (err) {
      console.error('failed to reach todo services', err);
      ctx.status = 500;
      ctx.body = 'todo services not operational';
    }
  }
  await next();
});

app.use(async (ctx) => {
  if (ctx.method === 'POST' && ctx.url === '/submit-todo') {
    console.log('Received form submission:', ctx.request.body);
    const { text } = ctx.request.body;
    const success = await handleFormSubmission(text);
    ctx.status = success ? 200 : 500;
    return;
  }

  try {
    const shouldRenew = await imageOlderThanHour();
    shouldRenew && (await imageFetcher());
    const base64Image = await fs.readFile(imagepath, 'base64');
    const response = await axios.get(`http://localhost:${backendPort}/`);
    const todos = todoToHtml(response.data);
    ctx.type = 'html';
    ctx.body = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Todo Project</title>
      </head>
      <body>
        <img src="data:image/jpeg;base64,${base64Image}">
        <br>
        <form id="todo-form">
          <input type="text" id="todo-text" required>
          <input type="submit" value="Create TODO"">
        </form>
        <ul>${todos}</ul>

        <script>
          document.getElementById('todo-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log(e);
            const text = document.getElementById('todo-text').value;
            if (text) {
              const response = await fetch('/submit-todo', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
              });
              if (response.ok) {
                location.reload();
              }
            }
          });
        </script>

      </body>
      </html>
    `;
  } catch (err) {
    console.error('FAILED TO READ FILE', err);
    ctx.status = 500;
    ctx.body = 'Server error';
  }
});

app.listen(port, () => {
  console.log(`Server started in port ${port}`);
});
