const xrpl = require('xrpl');

// ─── 配置区域 ───────────────────────────────────────────
const NGO_SEED    = "sEdVF4zz7PCNdBYWXSyuVmcLAJJneAQ";
const DONOR_SEED  = "sEdTPpyJFLGMGtXcGFBDijGZtMGX18R";
const EDU_RATE    = 1; // 1 XRP = 1 EDU
// ────────────────────────────────────────────────────────

const client     = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
const ngoWallet  = xrpl.Wallet.fromSeed(NGO_SEED);
const donorWallet = xrpl.Wallet.fromSeed(DONOR_SEED);

async function ensureTrustline() {
  const lines = await client.request({
    command: "account_lines",
    account: donorWallet.address,
    peer: ngoWallet.address
  });

  const hasTrustline = lines.result.lines.some(l => l.currency === "EDU");

  if (!hasTrustline) {
    console.log("📋 Trustline 不存在，正在自动建立...");
    const tx = await client.submitAndWait({
      TransactionType: "TrustSet",
      Account: donorWallet.address,
      LimitAmount: {
        currency: "EDU",
        issuer: ngoWallet.address,
        value: "100000"
      }
    }, { wallet: donorWallet });
    console.log("✅ Trustline 建立成功！");
  } else {
    console.log("✅ Trustline 已存在，跳过");
  }
}

async function sendEDU(toAddress, amount) {
  const tx = await client.submitAndWait({
    TransactionType: "Payment",
    Account: ngoWallet.address,
    Destination: toAddress,
    Amount: {
      currency: "EDU",
      value: String(amount * EDU_RATE),
      issuer: ngoWallet.address
    }
  }, { wallet: ngoWallet });

  console.log(`🎓 已发送 ${amount * EDU_RATE} EDU 给 ${toAddress}`);
  console.log(`   TX Hash: ${tx.result.hash}`);
  return tx.result.hash;
}

async function donate(amountXRP) {
  console.log(`\n💸 正在捐款 ${amountXRP} XRP...\n`);

  // Step 1: 确保 Trustline 存在
  await ensureTrustline();

  // Step 2: Donor 发送 XRP 给 NGO
  const payment = await client.submitAndWait({
    TransactionType: "Payment",
    Account: donorWallet.address,
    Destination: ngoWallet.address,
    Amount: xrpl.xrpToDrops(amountXRP)
  }, { wallet: donorWallet });

  console.log(`✅ 捐款成功！XRP TX: ${payment.result.hash}`);

  // Step 3: NGO 自动发送等额 EDU 给 Donor
  console.log(`\n🤖 系统检测到捐款，自动发放 EDU 代币...\n`);
  const eduHash = await sendEDU(donorWallet.address, amountXRP);

  // Step 4: 查询最终余额
  const lines = await client.request({
    command: "account_lines",
    account: donorWallet.address
  });

  const eduBalance = lines.result.lines.find(l => l.currency === "EDU");

  console.log("\n─────────────────────────────────────");
  console.log("         🎉 捐款流程完成！");
  console.log("─────────────────────────────────────");
  console.log(`  捐款金额:    ${amountXRP} XRP`);
  console.log(`  获得凭证:    ${amountXRP * EDU_RATE} EDU`);
  console.log(`  EDU 总余额:  ${eduBalance ? eduBalance.balance : '0'} EDU`);
  console.log("─────────────────────────────────────\n");

  return {
    xrpAmount: amountXRP,
    eduAmount: amountXRP * EDU_RATE,
    xrpTx: payment.result.hash,
    eduTx: eduHash,
    totalEDU: eduBalance ? eduBalance.balance : '0'
  };
}

async function main() {
  const amount = parseFloat(process.argv[2]);

  if (!amount || amount <= 0) {
    console.log("❌ 用法: node autodonate.js <金额>");
    console.log("   例如: node autodonate.js 5");
    process.exit(1);
  }

  try {
    await client.connect();
    console.log("🔗 已连接到 XRPL 测试网");
    await donate(amount);
  } catch (err) {
    console.error("❌ 错误:", err.message);
  } finally {
    await client.disconnect();
  }
}

main();
