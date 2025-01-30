const { connect, StringCodec } = require('nats');
const axios = require('axios');

const natsUrl = process.env.NATS_URL;
const discordWebhookUrl = process.env.WEBHOOK_URL;
const isInProduction = process.env.PRODUCTION === 'true';

async function main() {
  const nc = await connect({ servers: natsUrl });
  const sc = StringCodec();

  const sub = nc.subscribe('todos', { queue: 'duplicate-preventer' });

  (async () => {
    for await (const msg of sub) {
      const message = sc.decode(msg.data);
      if (isInProduction) {
        await axios.post(discordWebhookUrl, { content: message });
      } else {
        console.log('Message:', message);
      }
    }
  })();

  console.log('NATS broadcaster operational');
}

main().catch(console.error);
