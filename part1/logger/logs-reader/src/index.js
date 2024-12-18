const fs = require('fs').promises;
const { createWriteStream } = require('fs');
const Koa = require('koa');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = new Koa();

const port = process.env.PORT || 2341;

// Path for local testing (remember to uncomment)
// const dir = path.join(__dirname, 'files');
const dir = path.join('/', 'usr', 'src', 'app', 'files');

const filepath = path.join(dir, 'logs.txt');
const pongpath = path.join(dir, 'pong.txt');
const imagepath = path.join(dir, 'image.jpg');
const imageURL = 'https://picsum.photos/400';

const hash = uuidv4();

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
    const { birthtime } = await fs.stat(imagepath);
    const now = new Date();
    const diff = now - birthtime;
    const diffHours = diff / 1000 / 60 / 60;
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
    const time = await fs.readFile(filepath, 'utf8');
    const pongs = await fs.readFile(pongpath, 'utf8');
    const base64Image = await fs.readFile(imagepath, 'base64');
    ctx.type = 'html';
    ctx.body = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Logger App</title>
      </head>
      <body>
        <p>${time} ${hash}</p>
        <p>Ping / Pongs: ${pongs}</p>
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
    ctx.body = 'Internal Server Error';
  }
});

app.listen(port, () => {
  console.log(`Server started in port ${port}`);
});
