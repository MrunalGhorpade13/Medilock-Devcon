# MediLock — Hackathon Submission

## 100-Word Description

MediLock is a privacy-first emergency medical lockbox on Ethereum. Patients encrypt their critical medical data—blood type, allergies, conditions, medications, and emergency contacts—directly in the browser using AES-256-GCM. Only a keccak256 commitment is anchored on Sepolia. An on-chain soulbound ERC-721 Medical ID proves authenticity. A QR code (address + decryption key in URL fragment) can be scanned by verified first responders to access the record, with every scan logged on-chain for full auditability. Data never touches the blockchain unencrypted. Features include expiring QR codes, access alerts, key rotation, and a high-contrast emergency view for responders.

---

## 300-Word Description

MediLock is an emergency medical lockbox dApp built on Ethereum Sepolia for the Devcon hackathon. It solves a real-world problem: in an emergency, first responders often cannot access critical medical information (blood type, allergies, medications) quickly or securely.

### How It Works

A patient connects their wallet, fills out a medical form, and encrypts the data in the browser using the Web Crypto API (AES-256-GCM). The ciphertext is stored on IPFS via Pinata, with an on-chain fallback. A keccak256 commitment of the ciphertext is submitted to the `MediLockRegistry` smart contract on Sepolia, simultaneously minting a soulbound ERC-721 Medical ID NFT. The NFT is soul-bound—transfers are permanently disabled—ensuring a one-to-one relationship between wallet and medical record.

The patient receives a QR code encoding their Ethereum address and AES decryption key in the URL fragment. In an emergency, a first responder scans this QR, which triggers an on-chain `logAccess` transaction (proving the access occurred and timestamped forever), fetches the encrypted blob from IPFS, and decrypts it client-side. The responder sees a high-contrast emergency card with critical information immediately.

### Privacy Model

Medical data never touches the chain unencrypted. The on-chain commitment is a one-way hash. Decryption keys live only in URL fragments, which browsers do not send to servers. Every access is auditable on-chain.

### Innovation Features

- **Expiring QR codes** — Smart contract reverts `logAccess` after configurable expiry
- **On-chain access log** — Complete audit trail: address, timestamp, tx hash
- **Key rotation** — Re-encrypt and update CID without resetting the NFT
- **Demo mode** — No wallet required to explore the responder experience

Built with Solidity 0.8.24, OpenZeppelin v5, Hardhat, Vite, React 18, wagmi v2, RainbowKit, TailwindCSS, and framer-motion.
