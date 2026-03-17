const xrpl = require('xrpl');
const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");

const donorSeed = "sEdTPpyJFLGMGtXcGFBDijGZtMGX18R";
const donorWallet = xrpl.Wallet.fromSeed(donorSeed);

const issuerAddress = "rJk8icF7rHEVuRp7qUFJupf1iJQ9G7U95g";

async function donate(amountXRP) {
  await client.connect();

  const payment = {
    TransactionType: "Payment",
    Account: donorWallet.address,
    Destination: issuerAddress,

    SendMax: xrpl.xrpToDrops(amountXRP),

    Amount: {
      currency: "EDU",
      value: amountXRP,
      issuer: issuerAddress
    }
  };

  const tx = await client.submitAndWait(payment, { wallet: donorWallet });

  console.log(`✅ Donated ${amountXRP} XRP`);
  console.log("TX:", tx.result.hash);

  await client.disconnect();
}

// 👇 从命令行读取参数
const amount = process.argv[2];

if (!amount) {
  console.log("❌ 请输入金额，例如: node donation.js 5");
  process.exit(1);
}

donate(amount);