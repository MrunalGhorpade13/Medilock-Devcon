# Deploy MediLock Contracts via Remix (Fastest — No Install Needed)

## Step 1: Open Remix

Go to https://remix.ethereum.org

## Step 2: Create contract files

In the file explorer, create two files under `contracts/`:

1. `contracts/MediLockID.sol` — paste content from `contracts/contracts/MediLockID.sol`
2. `contracts/MediLockRegistry.sol` — paste content from `contracts/contracts/MediLockRegistry.sol`

## Step 3: Install OpenZeppelin

In the Remix terminal (bottom panel), run:
```
npm install @openzeppelin/contracts@5
```

Or use Remix's built-in import — it resolves `@openzeppelin/contracts` automatically from npm.

## Step 4: Compile

- Click the **Solidity Compiler** tab (left icon)
- Select compiler version **0.8.24**
- Click **Compile MediLockRegistry.sol**

## Step 5: Deploy to Sepolia

- Click the **Deploy & Run** tab
- Set Environment to **Injected Provider — MetaMask**
- Make sure MetaMask is on **Sepolia**
- Deploy **MediLockRegistry** first (no constructor args)
  - Copy the deployed address → `REGISTRY_ADDRESS`
- Deploy **MediLockID** with `registryAddress` as constructor arg
  - Copy the deployed address → `ID_ADDRESS`
- In the deployed **MediLockRegistry** contract, call **setMediLockIDContract** with `ID_ADDRESS`
- Call **addResponder** with your wallet address (demo first responder)

## Step 6: Update frontend .env

```env
VITE_REGISTRY_ADDRESS=<REGISTRY_ADDRESS>
VITE_MEDILOCK_ID_ADDRESS=<ID_ADDRESS>
```

## Step 7: Restart dev server

```bash
cd frontend
npm run dev
```

## Etherscan Verification (Optional)

Use Remix's **Etherscan Verifier** plugin (Plugin Manager → search "Etherscan") to verify both contracts.

---

> ⏱ Total time: ~5 minutes
