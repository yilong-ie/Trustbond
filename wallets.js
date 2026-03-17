const xrpl = require('xrpl');

async function main() {
  const donorWallet = xrpl.Wallet.generate();
  console.log("Donor Address:", donorWallet.address);
  console.log("Donor Seed:", donorWallet.seed);

  // NGO 已经有 Faucet 钱包
  const ngoAddress = "rJk8icF7rHEVuRp7qUFJupf1iJQ9G7U95g";
  const ngoSeed = "sEdVF4zz7PCNdBYWXSyuVmcLAJJneAQ";

  console.log("NGO Address:", ngoAddress);
  console.log("NGO Seed:", ngoSeed);
}

main();