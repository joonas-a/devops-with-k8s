const Router = require('koa-router');
const router = new Router({ prefix: '/api' });

module.exports = (client) => {
  router.get('/', async (ctx) => {
    try {
      const res = await client.query('SELECT value FROM Counter LIMIT 1');
      const counter = res.rows[0] ? parseInt(res.rows[0].value, 10) : 0;
      ctx.body = `${counter}`;
    } catch (err) {
      console.error(err);
      ctx.status = 500;
      ctx.body = 'Internal Server Error';
    }
  });

  return router;
};
