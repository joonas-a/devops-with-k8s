const Koa = require('koa');
const { Client } = require('pg');
const createRouter = require('./router');

const app = new Koa();
const port = process.env.PORT || 8081;

// Psql connection
let client;
let connected = false;
const connectToDb = async () => {
  while (!connected) {
    client = new Client({
      host: 'psql-svc',
      port: 5432,
      user: process.env.POSTGRES_USER,
      database: process.env.POSTGRES_DB,
      password: process.env.POSTGRES_PASSWORD,
    });
    try {
      await client.connect();
      console.log('Connected to psql');
      connected = true;
      break;
    } catch (err) {
      console.error('Connection error', err);
      console.log('Retrying in 5 seconds...');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

const init_db = async () => {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS Counter (
        id SERIAL PRIMARY KEY,
        value INTEGER DEFAULT 0
      );
      INSERT INTO Counter (value) VALUES (0)
      ON CONFLICT DO NOTHING;
    `);
    console.log('Initialized database');
  } catch (err) {
    console.error('Error initializing database', err);
  }
};

const startServer = async () => {
  await connectToDb();
  await init_db();

  const pongApi = createRouter(client);

  // Handle reguests to /api
  app.use(pongApi.routes());
  app.use(pongApi.allowedMethods());

  // Handle requests to /
  app.use(async (ctx) => {
    try {
      const res = await client.query('SELECT value FROM Counter LIMIT 1');
      let counter = res.rows[0] ? parseInt(res.rows[0].value, 10) : 0;
      counter += 1;
      await client.query('UPDATE Counter SET value = $1 WHERE id = 1', [
        counter,
      ]);

      ctx.body = `pong ${counter}`;
    } catch (err) {
      console.error('Caught error when working with db: ', err);
      ctx.status = 500;
      ctx.body = 'Internal Server Error';
    }
  });

  app.listen(port, () => {
    console.log(`Server started in port ${port}`);
  });
};

startServer();
