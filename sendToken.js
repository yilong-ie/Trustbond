const xrpl = require('xrpl');
const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");

// NGO（issuer）
const issuerSeed = "sEdVF4zz7PCNdBYWXSyuVmcLAJJneAQ";
const issuerWallet = xrpl.Wallet.fromSeed(issuerSeed);

// Donor
const donorAddress = "rnde4ByR3mApx4dLo15zUk2XVEeFmz453X";

async function sendToken(amount) {
  await client.connect();

  const payment = {
    TransactionType: "Payment",
    Account: issuerWallet.address,
    Destination: donorAddress,

    Amount: {
      currency: "EDU",
      value: amount,
      issuer: issuerWallet.address
    }
  };

  const tx = await client.submitAndWait(payment, { wallet: issuerWallet });

  console.log(`✅ Sent ${amount} EDU`);
  console.log("TX:", tx.result.hash);

  await client.disconnect();
}

sendToken("10");