const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const { Client } = require('pg');
const { default: migrate } = require('node-pg-migrate');
const { connect, StringCodec } = require('nats');

const app = new Koa();
const router = new Router();

const port = process.env.PORT || 3001;

// Dummy todos
let todos = [
  { text: 'Buy groceries' },
  { text: 'Walk the dog' },
  { text: 'Finish homework' },
];

// Database connection
let client;
let connected = false;

const connectToDb = async () => {
  while (!connected) {
    client = new Client({
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
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

const runMigrations = async () => {
  try {
    await migrate({
      databaseUrl: {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER,
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD,
      },
      dir: 'migrations',
      direction: 'up',
    });
    console.log('Migrations applied');
  } catch (err) {
    console.error('Error applying migrations', err);
  }
};

const init_db = async () => {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS Todos (
        id SERIAL PRIMARY KEY,
        text VARCHAR(255) NOT NULL
      );
    `);

    // Insert dummy todos
    for (const todo of todos) {
      await client.query(
        'INSERT INTO Todos (text) VALUES ($1) ON CONFLICT DO NOTHING',
        [todo.text]
      );
    }

    console.log('Initialized database with todos');
  } catch (err) {
    console.error('Error initializing database', err);
  }
};

const fetchTodos = async () => {
  try {
    const result = await client.query('SELECT * FROM Todos');
    return result.rows;
  } catch (err) {
    console.error('Error fetching todos', err);
    return [];
  }
};

const setDone = async (todoId) => {
  try {
    const result = await client.query(
      'UPDATE Todos SET completed = TRUE where id = $1 RETURNING *',
      [todoId]
    );
    return result.rows[0];
  } catch (err) {
    console.error("Couldn't update todo status.", err);
    return null;
  }
};

const addNewTodo = async (text) => {
  try {
    const result = await client.query(
      'INSERT INTO Todos (text) VALUES ($1) RETURNING *',
      [text]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Error adding new todo', err);
    return null;
  }
};

app.use(bodyParser());

const startServer = async () => {
  await connectToDb();
  await init_db();
  await runMigrations();

  // Establish NATS connection
  const nc = await connect({ servers: process.env.NATS_URL });
  const sc = StringCodec();

  router.get('/healthz', async (ctx) => {
    try {
      await client.query('SELECT 1');
      ctx.status = 200;
      ctx.body = 'OK';
    } catch (err) {
      console.error(err);
      ctx.status = 500;
      ctx.body = 'project db is not operational';
    }
  });

  router.put('/todos/:id', async (ctx) => {
    console.log('Received PUT request:', ctx.request.body);
    const { id } = ctx.params;
    const res = await setDone(id);
    if (res) {
      nc.publish('todos', sc.encode(`Todo completed: ${res.text}`));
      ctx.status = 200;
      ctx.body = res;
    } else {
      ctx.status = 404;
      ctx.body = 'Todo not found';
    }
  });

  router.all('/', async (ctx) => {
    console.log('Received request:', ctx.method, ctx.url);
    if (ctx.method == 'GET') {
      const result = await fetchTodos();
      ctx.body = result;
    } else if (ctx.method == 'POST') {
      console.log('Received form submission:', ctx.request.body);
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

      const newTodo = await addNewTodo(text);
      if (newTodo) {
        // Publish to NATS
        nc.publish(
          'todos',
          sc.encode(
            JSON.stringify({ message: 'New todo added', todo: newTodo })
          )
        );
        ctx.status = 201;
        ctx.body = { newTodo };
      }
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
};

startServer();
