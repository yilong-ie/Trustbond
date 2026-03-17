const xrpl = require('xrpl');
const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");

// Donor 钱包
const donorSeed = "sEdTPpyJFLGMGtXcGFBDijGZtMGX18R";
const donorWallet = xrpl.Wallet.fromSeed(donorSeed);

// NGO 钱包
const issuerAddress = "rJk8icF7rHEVuRp7qUFJupf1iJQ9G7U95g";

async function createTrustline(currency, limit) {
  await client.connect();

  const trustlineTx = {
    TransactionType: "TrustSet",
    Account: donorWallet.address,
    LimitAmount: {
      currency: currency,
      issuer: issuerAddress,
      value: limit
    }
  };

  const tx = await client.submitAndWait(trustlineTx, { wallet: donorWallet });
  console.log("Trustline created:", tx.result);
  await client.disconnect();
}

createTrustline("EDU", "1000");