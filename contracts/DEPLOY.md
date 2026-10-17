# Deploying MediLock Contracts with Remix IDE

> No Hardhat needed. Use the free browser-based Remix IDE at https://remix.ethereum.org

---

## Step 1 — Open Remix

Go to: **https://remix.ethereum.org**

---

## Step 2 — Upload the Contracts

1. In the **File Explorer** (left panel), create a folder called `medilock/`
2. Upload (or paste) both files:
   - `MediLockID.sol`
   - `MediLockRegistry.sol`

---

## Step 3 — Compile

1. Click the **Solidity Compiler** tab (left sidebar, looks like `<S>`)
2. Set **Compiler version** to `0.8.24`
3. Enable **Optimization** → Runs: `200`
4. Click **Compile MediLockID.sol** → wait for green tick ✅
5. Click **Compile MediLockRegistry.sol** → wait for green tick ✅

---

## Step 4 — Connect MetaMask to Sepolia

1. Open MetaMask → switch to **Sepolia Testnet**
2. Get free Sepolia ETH from: https://sepoliafaucet.com
3. In Remix → **Deploy & Run** tab → set Environment to **Injected Provider - MetaMask**

---

## Step 5 — Deploy MediLockID First

1. Select contract: `MediLockID`
2. Click **Deploy** → confirm in MetaMask
3. Copy the deployed address → save as `MEDILOCK_ID_ADDRESS`

---

## Step 6 — Deploy MediLockRegistry

1. Select contract: `MediLockRegistry`
2. In the constructor field, paste `MEDILOCK_ID_ADDRESS`
3. Click **Deploy** → confirm in MetaMask
4. Copy the deployed address → save as `MEDILOCK_REGISTRY_ADDRESS`

---

## Step 7 — Wire Them Together

1. In Remix, click on the deployed **MediLockID** contract instance
2. Find `setRegistry` function
3. Paste `MEDILOCK_REGISTRY_ADDRESS` → click **transact** → confirm in MetaMask ✅

---

## Step 8 — Add a Demo Verified Responder

1. Click on the deployed **MediLockRegistry** instance
2. Find `addResponder` function
3. Paste your MetaMask wallet address → click **transact** → confirm ✅

Now your wallet can act as a verified responder for demo purposes.

---

## Step 9 — Update Frontend Config

Open `frontend/src/contracts/addresses.json` and fill in:

```json
{
  "mediLockID": "0xYOUR_MEDILOCK_ID_ADDRESS",
  "mediLockRegistry": "0xYOUR_MEDILOCK_REGISTRY_ADDRESS",
  "network": "sepolia",
  "chainId": 11155111
}
```

---

## Step 10 — Verify on Etherscan (optional but recommended)

1. Go to https://sepolia.etherscan.io/
2. Search your contract address
3. Click **Contract** tab → **Verify and Publish**
4. Select: `Solidity (Single file)`, version `0.8.24`, Optimization `Yes (200 runs)`
5. Paste the full source code → Submit

---

## Contract Addresses (fill after deploy)

| Contract | Address |
|---|---|
| MediLockID | `0x...` |
| MediLockRegistry | `0x...` |
| Network | Sepolia |
| Etherscan | https://sepolia.etherscan.io |
