/**
 * TrustBond — Pathfinding Donation
 * ─────────────────────────────────
 * Demonstrates XRPL's native pathfinding:
 *   Donor sends XRP  →  XRPL finds best path  →  NGO receives EDU
 * All in ONE transaction, no manual two-step process.
 */

const xrpl = require('xrpl');

// ─── Config ────────────────────────────────────────────
const NGO_SEED   = "sEdVF4zz7PCNdBYWXSyuVmcLAJJneAQ";
const DONOR_SEED = "sEdTPpyJFLGMGtXcGFBDijGZtMGX18R";
const WS_URL     = "wss://s.altnet.rippletest.net:51233";
// ───────────────────────────────────────────────────────

const client     = new xrpl.Client(WS_URL);
const ngoWallet  = xrpl.Wallet.fromSeed(NGO_SEED);
const donorWallet = xrpl.Wallet.fromSeed(DONOR_SEED);

// ── Step 1: Query XRPL for available paths ──────────────
async function findPaths(xrpAmount, eduAmount) {
  console.log("\n🔍 Querying XRPL for available payment paths...");

  const result = await client.request({
    command: "ripple_path_find",
    source_account: donorWallet.address,
    source_currencies: [
      { currency: "XRP" }         // Donor pays in XRP
    ],
    destination_account: ngoWallet.address,
    destination_amount: {          // NGO wants to receive EDU
      currency: "EDU",
      value: String(eduAmount),
      issuer: ngoWallet.address
    }
  });

  const paths = result.result.alternatives;

  if (!paths || paths.length === 0) {
    console.log("⚠️  No paths found via DEX. Falling back to direct issuance model.");
    return null;
  }

  console.log(`✅ Found ${paths.length} path(s):`);
  paths.forEach((p, i) => {
    const srcAmt = p.source_amount;
    const cost = typeof srcAmt === 'string'
      ? (parseInt(srcAmt) / 1_000_000).toFixed(4) + ' XRP'
      : `${srcAmt.value} ${srcAmt.currency}`;
    console.log(`   Path ${i + 1}: costs ${cost} → receives ${eduAmount} EDU`);
  });

  return paths;
}

// ── Step 2: Execute the cross-currency payment ──────────
async function pathfindDonate(xrpAmount) {
  const eduAmount = xrpAmount; // 1:1 rate for demo

  console.log("─────────────────────────────────────────────");
  console.log("  TrustBond — Pathfinding Donation Demo");
  console.log("─────────────────────────────────────────────");
  console.log(`  Donor:  ${donorWallet.address}`);
  console.log(`  NGO:    ${ngoWallet.address}`);
  console.log(`  Amount: ${xrpAmount} XRP  →  ${eduAmount} EDU`);
  console.log("─────────────────────────────────────────────\n");

  // Ensure trustline exists
  console.log("📋 Checking trustline...");
  const lines = await client.request({
    command: "account_lines",
    account: donorWallet.address,
    peer: ngoWallet.address
  });

  if (!lines.result.lines.some(l => l.currency === "EDU")) {
    console.log("📋 Trustline not found — creating automatically...");
    await client.submitAndWait({
      TransactionType: "TrustSet",
      Account: donorWallet.address,
      LimitAmount: { currency: "EDU", issuer: ngoWallet.address, value: "100000" }
    }, { wallet: donorWallet });
    console.log("✅ Trustline established\n");
  } else {
    console.log("✅ Trustline ready\n");
  }

  // Try pathfinding first
  const paths = await findPaths(xrpAmount, eduAmount);

  let xrpTxHash, eduTxHash;

  if (paths && paths.length > 0) {
    // ── Path A: True cross-currency via XRPL DEX ──────────
    console.log("\n💱 Executing cross-currency payment via XRPL pathfinding...");

    const bestPath = paths[0];
    const tx = await client.submitAndWait({
      TransactionType: "Payment",
      Account: donorWallet.address,
      Destination: ngoWallet.address,
      // SendMax: the max XRP donor is willing to spend
      SendMax: xrpl.xrpToDrops(xrpAmount),
      // Amount: the exact EDU the NGO receives
      Amount: {
        currency: "EDU",
        value: String(eduAmount),
        issuer: ngoWallet.address
      },
      // Paths found by ripple_path_find
      Paths: bestPath.paths_computed
    }, { wallet: donorWallet });

    xrpTxHash = tx.result.hash;
    eduTxHash = tx.result.hash; // Same tx handles both in path payment
    console.log(`✅ Cross-currency payment complete!`);
    console.log(`   TX Hash: ${xrpTxHash}`);

  } else {
    // ── Path B: Fallback — direct XRP donation + NGO issues EDU ──
    console.log("\n💸 No DEX path available. Using direct donation model...");
    console.log("   (This is the standard flow on testnet without DEX liquidity)\n");

    // Donor sends XRP to NGO
    console.log("Step 1/2: Donor sends XRP to NGO...");
    const xrpTx = await client.submitAndWait({
      TransactionType: "Payment",
      Account: donorWallet.address,
      Destination: ngoWallet.address,
      Amount: xrpl.xrpToDrops(xrpAmount)
    }, { wallet: donorWallet });
    xrpTxHash = xrpTx.result.hash;
    console.log(`✅ XRP sent. TX: ${xrpTxHash}`);

    // NGO auto-issues EDU back to donor
    console.log("Step 2/2: NGO auto-issues EDU receipt to donor...");
    const eduTx = await client.submitAndWait({
      TransactionType: "Payment",
      Account: ngoWallet.address,
      Destination: donorWallet.address,
      Amount: { currency: "EDU", value: String(eduAmount), issuer: ngoWallet.address }
    }, { wallet: ngoWallet });
    eduTxHash = eduTx.result.hash;
    console.log(`✅ EDU issued. TX: ${eduTxHash}`);
  }

  // Final balance check
  const balLines = await client.request({
    command: "account_lines",
    account: donorWallet.address
  });
  const edu = balLines.result.lines.find(l => l.currency === "EDU");

  console.log("\n─────────────────────────────────────────────");
  console.log("            🎉 Donation Complete!");
  console.log("─────────────────────────────────────────────");
  console.log(`  XRP donated:      ${xrpAmount} XRP`);
  console.log(`  EDU received:     ${eduAmount} EDU`);
  console.log(`  Total EDU held:   ${edu ? edu.balance : eduAmount} EDU`);
  console.log(`  Verify on-chain:`);
  console.log(`  → https://testnet.xrpl.org/transactions/${xrpTxHash}`);
  if (eduTxHash !== xrpTxHash) {
    console.log(`  → https://testnet.xrpl.org/transactions/${eduTxHash}`);
  }
  console.log("─────────────────────────────────────────────\n");
}

// ── Main ────────────────────────────────────────────────
async function main() {
  const amount = parseFloat(process.argv[2]);

  if (!amount || amount <= 0) {
    console.log("Usage: node pathfind.js <amount>");
    console.log("Example: node pathfind.js 5");
    process.exit(1);
  }

  try {
    await client.connect();
    console.log("🔗 Connected to XRPL Testnet\n");
    await pathfindDonate(amount);
  } catch (err) {
    console.error("❌ Error:", err.message);
    if (err.data) console.error("   Details:", JSON.stringify(err.data, null, 2));
  } finally {
    await client.disconnect();
  }
}

main();
