# MediLock Security Model

## Overview

MediLock is a demonstration dApp on Ethereum Sepolia. This document covers known risks and mitigations.

## Threat Model

| Threat | Risk | Mitigation |
|--------|------|------------|
| Chain data exposure | Ethereum is public | Data is AES-256-GCM encrypted before leaving browser; only keccak256 hash committed on-chain |
| Key compromise via QR | QR contains AES key in URL fragment | Fragments are not sent to servers by browsers; key rotation revokes old access |
| Unauthorized responder | Any Ethereum address could call logAccess | Registry maintains admin-only whitelist of verified responders |
| QR replay after emergency | Stale QR grants persistent access | Expiring QR: `block.timestamp` compared against `expiresAt` in contract |
| IPFS data persistence | Pinata may unpin data | On-chain bytes fallback for small records; Pinata pinning for larger data |
| Malicious frontend | Served frontend could steal plaintext | In production: IPFS-hosted frontend + ENS name; verify source hash |
| Contract upgrades | Owner could replace contract | Contracts are not upgradeable (no proxy); verify on Etherscan |

## Cryptography

- **Algorithm:** AES-256-GCM
- **Key generation:** `crypto.subtle.generateKey` in browser (never sent to server)
- **IV:** 12-byte random, prepended to ciphertext blob
- **Commitment:** `keccak256(ciphertext || random_salt)` — on-chain integrity proof
- **Key export:** Base64url (URL-safe), placed in URL fragment only

## Known Limitations (Hackathon Scope)

1. **Sepolia testnet only** — no mainnet support
2. **Centralized IPFS pin** — relies on Pinata; production needs redundant pins
3. **No key escrow** — lost key = permanently locked out of record
4. **Responder whitelist is centralized** — admin (deployer) controls who is a verified responder

## Reporting Issues

This is a hackathon demo. For real-world deployment, a full audit would be required.
