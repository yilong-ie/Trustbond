const xrpl = require('xrpl');
const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");

const address = "rnde4ByR3mApx4dLo15zUk2XVEeFmz453X";

async function check() {
  await client.connect();

  const balance = await client.request({
    command: "account_lines",
    account: address
  });

  console.log(balance.result.lines);

  await client.disconnect();
}

check();
