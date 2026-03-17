# TrustBond 🎓

> **Transparent donation infrastructure built on the XRP Ledger**  
> XRPL Commons Hackathon — Challenge 4: Trustline-Based Donations

Every donation creates an immutable, on-chain receipt. Donors receive **EDU impact tokens** backed 1:1 by XRP. NGOs gain credibility through verifiable, public ledger records — no self-reporting required.

---

## Demo

```
Donor ──[XRP]──▶ XRPL Pathfinding ──▶ NGO receives funds
                       │
                       └──[EDU token]──▶ Donor holds on-chain receipt
```

Open `index.html` in any browser to see the live dashboard connected to XRPL Testnet.

---

## Project Structure

```
TrustBond/
├── .env.example       # Required environment variables
├── seeds.txt          # Wallet addresses & seeds (testnet only — never use on mainnet)
├── package.json       # Dependencies
│
├── connect.js         # Test XRPL Testnet connection
├── wallets.js         # Generate new wallet keypairs
├── issueToken.js      # NGO issues EDU token (run once)
├── trustline.js       # Donor establishes TrustSet with NGO
├── sendToken.js       # NGO sends EDU tokens to donor
├── checkBalance.js    # Check donor wallet EDU balance
├── donation.js        # Donor sends XRP donation to NGO
├── autodonate.js      # Full automated flow (trustline → XRP → EDU)
├── pathfind.js        # ⭐ Pathfinding demo using ripple_path_find
├── app.js             # Interactive CLI menu
│
└── index.html         # ⭐ Live web dashboard (real XRPL connection)
```

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your own wallet seeds (or use the testnet seeds in seeds.txt for demo)
```

### 3. Test connection
```bash
node connect.js
# → Connected to XRPL Testnet
```

### 4. Issue EDU token (NGO — run once)
```bash
node issueToken.js
# → Token Issued  /  EDU already exists, skipping
```

### 5. Establish Trustline (Donor)
```bash
node trustline.js
# → Trustline created
```

### 6. Run pathfinding donation ⭐
```bash
node pathfind.js 5
# → Queries ripple_path_find for XRP → EDU routes
# → Executes payment (cross-currency or direct fallback)
# → Prints TX hashes verifiable on testnet.xrpl.org
```

### 7. Check balance
```bash
node checkBalance.js
# → Shows EDU token balance for donor wallet
```

### 8. Open the web dashboard
Open `index.html` in your browser — connects live to XRPL Testnet with:
- **Pathfinding mode** — uses `ripple_path_find`, visualizes route discovery step by step
- **Direct mode** — standard two-step XRP + EDU issuance
- Clickable TX hashes → verifiable on `testnet.xrpl.org`

---

## Wallet Setup

| Role | Address | Configured In |
|------|---------|---------------|
| NGO Issuer | `rJk8icF7rHEVuRp7qUFJupf1iJQ9G7U95g` | `issueToken.js`, `sendToken.js` |
| Donor | `rQ9s6NopNCVCDGjkA27wjce6sKh81Mx6fi` | `trustline.js`, `checkBalance.js` |

Both accounts are funded on XRPL Testnet. To fund a new account:
```javascript
const result = await client.fundWallet(wallet); // Uses built-in Testnet faucet
```

---

## XRPL Features Used

| Feature | File | Purpose |
|---------|------|---------|
| `Wallet.generate()` + `fundWallet()` | `wallets.js` | Account creation & funding |
| Issued Currencies (IOU) | `issueToken.js` | EDU token definition |
| `TrustSet` transaction | `trustline.js` | Donor consent to receive EDU |
| `Payment` (XRP) | `donation.js` | XRP donation to NGO |
| `Payment` (IOU) | `sendToken.js` | EDU receipt to donor |
| **`ripple_path_find`** | `pathfind.js`, `index.html` | Discover XRP → EDU routes |
| **Cross-currency Payment** | `pathfind.js` | One-tx swap (when DEX path exists) |
| `account_lines` | `checkBalance.js` | Query token balances |
| `account_info` | `index.html` | Query XRP balances |

---

## On-Chain Trust Metrics

TrustBond proposes a **TrustBond Score (TBS)** computed entirely from public ledger data:

```
TBS = (DES × 0.25) + (Commitment × 0.25) + (Redemption × 0.20) + (Retention × 0.20) + (Age × 0.10)
```

| Metric | Description | XRPL Source |
|--------|-------------|-------------|
| Donor Engagement Score | Unique donation transaction count | `account_tx` |
| Commitment Depth | EDU held ÷ EDU ever received | `account_lines` balance |
| Token Redemption Rate | % of issued EDU still held by donors | Cross-account query |
| Donor Retention Rate | % of donors with 2+ donations | `account_tx` analysis |
| Trustline Age | Days since `TrustSet` was created | Ledger close timestamp |

See `TrustBond_Business_Analysis.docx` for the full methodology.

---

## Verifying Transactions

Every TX hash can be verified on the public XRPL Testnet explorer:
```
https://testnet.xrpl.org/transactions/<TX_HASH>
```

In `index.html`, all hashes are clickable — click any to view the raw ledger record.

---

## About Pathfinding

`ripple_path_find` queries XRPL's native DEX for cross-currency routes:

- **With DEX liquidity:** Donor sends XRP → single atomic tx → NGO receives EDU (one transaction)  
- **Without DEX liquidity (testnet):** System gracefully falls back to two-step: XRP payment + EDU issuance

This demonstrates XRPL's built-in pathfinding architecture even when testnet DEX has no market makers.

---

## Network

```
WebSocket: wss://s.altnet.rippletest.net:51233
Explorer:  https://testnet.xrpl.org
Faucet:    https://faucet.altnet.rippletest.net
```

> ⚠️ Seeds in `seeds.txt` are for **testnet demonstration only**. Never use testnet seeds on mainnet.

---

## Built With

- [xrpl.js v4](https://github.com/XRPLF/xrpl.js) — XRPL JavaScript SDK
- XRPL Altnet Testnet — `s.altnet.rippletest.net`
- Vanilla HTML/CSS/JS — zero-dependency frontend

---

*Built at XRPL Commons Hackathon 2025 — Challenge 4: TrustBond*
