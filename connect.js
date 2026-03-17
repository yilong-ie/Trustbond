const xrpl = require('xrpl');

const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");

async function connectClient() {
  await client.connect();
  console.log("Connected to XRPL Testnet");
  await client.disconnect();
}

connectClient();