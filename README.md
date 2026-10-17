# MediLock 🔐

> **Emergency Medical Lockbox on Ethereum — Devcon Hackathon 2024**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org/)
[![Network](https://img.shields.io/badge/Network-Sepolia-purple)](https://sepolia.etherscan.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

A privacy-first dApp where patients encrypt their critical medical data **entirely in the browser**, anchor an integrity commitment on-chain (Ethereum Sepolia), and share a QR code that verified first responders can scan in emergencies.

---

## 🚀 Live Demo

| Contract | Sepolia Address |
|----------|----------------|
| MediLockRegistry | [`0x94d0c3b4d719a6da44953c846FC89f51dF565F87`](https://sepolia.etherscan.io/address/0x94d0c3b4d719a6da44953c846FC89f51dF565F87) |
| MediLockID (NFT) | [`0x56cBbac5e08eFE32Bd2e515173B0e4e8d07f2CAC`](https://sepolia.etherscan.io/address/0x56cBbac5e08eFE32Bd2e515173B0e4e8d07f2CAC) |

---

## 🔒 How It Works

```
Patient fills form → AES-256-GCM encrypt in browser → Upload to IPFS
       → registerRecord(commitment, cid) on Ethereum
       → Soulbound ERC-721 Medical ID minted
       → Patient gets QR code (wallet address + AES key in URL fragment)

Emergency: Responder scans QR → logAccess(patient) logged on-chain
       → Fetch encrypted blob from IPFS → Decrypt with key from URL fragment
       → High-contrast emergency card shown
```

## 🛡️ Privacy Model

| Data | Location | Encrypted |
|------|----------|-----------|
| Medical record | IPFS / on-chain bytes | ✅ AES-256-GCM |
| Commitment hash | Ethereum Sepolia | Hash only (no plaintext) |
| Access log (who/when) | Ethereum Sepolia | ❌ Auditable by design |
| Decryption key | QR URL fragment `#key=…` | Never sent to any server |

**No plaintext medical data ever touches the blockchain or any server.**

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.24 + OpenZeppelin v4.9 |
| Dev Tooling | Hardhat + TypeScript + ethers v6 |
| Network | Ethereum Sepolia Testnet |
| Frontend | Vite + React 18 + TypeScript |
| Web3 | wagmi v2 + viem |
| Wallet | MetaMask (injected connector) |
| Encryption | Web Crypto API — AES-256-GCM |
| Storage | Pinata IPFS (on-chain hex fallback) |
| UI | TailwindCSS + framer-motion + lucide-react |

---

## ⚙️ Quick Start

### Prerequisites
- Node.js 18+
- MetaMask browser extension
- Sepolia ETH ([faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia))

### 1. Clone & Install

```bash
git clone https://github.com/MrunalGhorpade13/Medilock-Devcon.git
cd Medilock-Devcon
```

### 2. Run Frontend

```bash
cd frontend
cp .env.example .env   # fill in VITE_PINATA_JWT (optional)
npm install
npm run dev
# → http://localhost:5173
```

### 3. Deploy Contracts (optional — already deployed on Sepolia)

```bash
cd contracts
npm install
# Create .env with your PRIVATE_KEY and SEPOLIA_RPC_URL
npx hardhat compile
npx hardhat run scripts/deploy.ts --network sepolia
```

---

## 📁 Project Structure

```
Medilock-Devcon/
├── contracts/                  # Hardhat project
│   ├── contracts/
│   │   ├── MediLockID.sol      # Soulbound ERC-721 Medical ID
│   │   └── MediLockRegistry.sol # Core registry contract
│   ├── scripts/deploy.ts       # Auto-deploy + link + write addresses
│   └── hardhat.config.ts
└── frontend/                   # Vite + React app
    └── src/
        ├── components/         # Navbar, ConnectWallet, TransactionToast
        ├── hooks/              # useContracts.ts, useDarkMode.ts
        ├── lib/                # crypto.ts, storage.ts, wagmiConfig.ts
        ├── pages/              # Landing, Patient, Responder, Verify, About
        └── contracts/          # ABI + addresses JSON
```

---

## 📝 Contract Overview

### `MediLockRegistry.sol`
- `registerRecord(commitment, cid, expiresAt)` — stores encrypted record commitment + mints NFT
- `updateRecord(...)` — key rotation (new commitment + CID, old QRs instantly invalid)
- `revokeRecord()` / `reactivateRecord()` — patient can pause/resume responder access
- `logAccess(patient)` — verified responder logs emergency access (enforces expiry)
- `addResponder(addr)` / `removeResponder(addr)` — owner whitelist management
- `getAccessHistory(patient, offset, limit)` — paginated on-chain audit log

### `MediLockID.sol`
- Soulbound ERC-721 — transfers and approvals permanently blocked
- One token per patient address
- Minted on `registerRecord`, burned on revocation

---

## ✨ Key Features

- **🔐 Client-side encryption** — AES-256-GCM via Web Crypto API, key never leaves the browser
- **📱 Expiring QR codes** — access reverts on-chain after a configurable timestamp
- **📋 Immutable access audit** — every emergency scan is logged (responder address + timestamp)
- **🔄 Key rotation** — re-encrypt and update CID without resetting the soulbound NFT
- **📴 IPFS fallback** — if Pinata is unavailable, encrypted data is stored on-chain as hex
- **🎭 Demo mode** — responder page works without a real QR (pre-filled sample patient)

---

## ⚠️ Disclaimer

This application runs on the **Sepolia testnet only**. Do **not** store real patient data. For demonstration and hackathon purposes only.

---

## 🔐 Security

See [SECURITY.md](./SECURITY.md) for the full threat model.

## 📄 License

MIT © 2024 MrunalGhorpade13
