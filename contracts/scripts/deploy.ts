import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Registry = await ethers.getContractFactory("MediLockRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("MediLockRegistry deployed to:", registryAddress);

  const MediLockID = await ethers.getContractFactory("MediLockID");
  const id = await MediLockID.deploy(registryAddress);
  await id.waitForDeployment();
  const idAddress = await id.getAddress();
  console.log("MediLockID deployed to:", idAddress);

  // Link the NFT contract address in the registry
  await (await registry.setMediLockIDContract(idAddress)).wait();
  console.log("Registry linked to MediLockID");

  // Optionally: add deployer as initial verified responder for demo
  await (await registry.addResponder(deployer.address)).wait();
  console.log("Deployer added as demo responder");

  // Save addresses for frontend
  const addresses = {
    registry: registryAddress,
    mediLockID: idAddress,
    network: "sepolia",
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  const outPath = path.join(__dirname, "..", "..", "frontend", "src", "generated");
  fs.mkdirSync(outPath, { recursive: true });
  fs.writeFileSync(
    path.join(outPath, "addresses.json"),
    JSON.stringify(addresses, null, 2)
  );
  console.log("Addresses written to frontend/src/generated/addresses.json");
  console.log("\n📋 Add these to frontend/.env:");
  console.log(`VITE_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`VITE_MEDILOCK_ID_ADDRESS=${idAddress}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
