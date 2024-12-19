const Koa = require('koa');
const fs = require('fs').promises;
const { createWriteStream } = require('fs');
const axios = require('axios');
const path = require('path');
const app = new Koa();

const port = process.env.PORT || 3000;

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

const dummyTodos = [
  { id: 1, text: 'TODO 1' },
  { id: 2, text: 'TODO 2' },
  { id: 3, text: 'TODO 3' },
];

const todoHtml = dummyTodos
  .map((todo) => `<li id=${todo.id.toString()}>${todo.text}</li>`)
  .join('');

app.use(async (ctx) => {
  try {
    const shouldRenew = await imageOlderThanHour();
    shouldRenew && (await imageFetcher());
    const base64Image = await fs.readFile(imagepath, 'base64');
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
        <input type="text" id="text">
        <input type="button" value="Create TODO"">
        <ul>${todoHtml}</ul>
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
