const xrpl = require('xrpl');
const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");

const issuerSeed = "sEdVF4zz7PCNdBYWXSyuVmcLAJJneAQ";
const issuerWallet = xrpl.Wallet.fromSeed(issuerSeed);

async function issueToken(currency, amount) {
  await client.connect();

  // 检查已有余额，避免重复
  const acctInfo = await client.request({
    command: "account_lines",
    account: issuerWallet.address
  });

  const existing = acctInfo.result.lines.find(l => l.currency === currency);
  if (existing) {
    console.log(`${currency} 已存在，余额 ${existing.balance}，跳过发行`);
    await client.disconnect();
    return;
  }

  const payment = {
    TransactionType: "Payment",
    Account: issuerWallet.address,
    Destination: issuerWallet.address,
    Amount: {
      currency: currency,
      value: amount,
      issuer: issuerWallet.address
    }
  };

  const tx = await client.submitAndWait(payment, { wallet: issuerWallet });
  console.log("Token Issued:", tx.result);
  await client.disconnect();
}

issueToken("EDU", "1000");