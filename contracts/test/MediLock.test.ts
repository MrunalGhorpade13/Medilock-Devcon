import { expect } from "chai";
import { ethers } from "hardhat";
import { MediLockRegistry, MediLockID } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MediLock contracts", function () {
  let registry: MediLockRegistry;
  let idNFT: MediLockID;
  let owner: SignerWithAddress;
  let patient: SignerWithAddress;
  let responder: SignerWithAddress;
  let stranger: SignerWithAddress;

  const FAKE_COMMITMENT = ethers.keccak256(ethers.toUtf8Bytes("test-commitment"));
  const FAKE_CID = "QmTestCid1234567890";
  const EMPTY_DATA = "0x";

  beforeEach(async () => {
    [owner, patient, responder, stranger] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("MediLockRegistry");
    registry = (await Registry.deploy(owner.address)) as MediLockRegistry;
    await registry.waitForDeployment();

    const ID = await ethers.getContractFactory("MediLockID");
    idNFT = (await ID.deploy(await registry.getAddress())) as MediLockID;
    await idNFT.waitForDeployment();

    await registry.setMediLockIDContract(await idNFT.getAddress());
    await registry.addResponder(responder.address);
  });

  // ─── Registration ────────────────────────────────────────────────────────────

  describe("registerRecord", () => {
    it("mints a soulbound NFT on registration", async () => {
      await registry.connect(patient).registerRecord(FAKE_COMMITMENT, FAKE_CID, EMPTY_DATA);
      expect(await idNFT.balanceOf(patient.address)).to.equal(1);
    });

    it("reverts on double registration", async () => {
      await registry.connect(patient).registerRecord(FAKE_COMMITMENT, FAKE_CID, EMPTY_DATA);
      await expect(
        registry.connect(patient).registerRecord(FAKE_COMMITMENT, FAKE_CID, EMPTY_DATA)
      ).to.be.revertedWith("Already registered");
    });

    it("stores the commitment and CID", async () => {
      await registry.connect(patient).registerRecord(FAKE_COMMITMENT, FAKE_CID, EMPTY_DATA);
      const rec = await registry.getRecord(patient.address);
      expect(rec.commitment).to.equal(FAKE_COMMITMENT);
      expect(rec.ipfsCid).to.equal(FAKE_CID);
      expect(rec.active).to.be.true;
    });
  });

  // ─── Soulbound ───────────────────────────────────────────────────────────────

  describe("MediLockID soulbound", () => {
    it("blocks token transfers", async () => {
      await registry.connect(patient).registerRecord(FAKE_COMMITMENT, FAKE_CID, EMPTY_DATA);
      const tokenId = await idNFT.tokenOfOwner(patient.address);
      await expect(
        idNFT.connect(patient).transferFrom(patient.address, stranger.address, tokenId)
      ).to.be.revertedWith("Soulbound: transfers disabled");
    });
  });

  // ─── Responder access ────────────────────────────────────────────────────────

  describe("logAccess", () => {
    beforeEach(async () => {
      await registry.connect(patient).registerRecord(FAKE_COMMITMENT, FAKE_CID, EMPTY_DATA);
    });

    it("allows verified responder to log access", async () => {
      await expect(
        registry.connect(responder).logAccess(patient.address)
      ).to.emit(registry, "AccessLogged");
    });

    it("blocks unverified stranger from logging access", async () => {
      await expect(
        registry.connect(stranger).logAccess(patient.address)
      ).to.be.revertedWith("Not a verified responder");
    });

    it("blocks access to revoked record", async () => {
      await registry.connect(patient).revokeRecord();
      await expect(
        registry.connect(responder).logAccess(patient.address)
      ).to.be.revertedWith("Record not active");
    });
  });

  // ─── Revocation & reactivation ────────────────────────────────────────────────

  describe("revokeRecord / reactivateRecord", () => {
    beforeEach(async () => {
      await registry.connect(patient).registerRecord(FAKE_COMMITMENT, FAKE_CID, EMPTY_DATA);
    });

    it("patient can revoke their record", async () => {
      await registry.connect(patient).revokeRecord();
      const rec = await registry.getRecord(patient.address);
      expect(rec.active).to.be.false;
    });

    it("patient can reactivate", async () => {
      await registry.connect(patient).revokeRecord();
      await registry.connect(patient).reactivateRecord();
      const rec = await registry.getRecord(patient.address);
      expect(rec.active).to.be.true;
    });

    it("stranger cannot revoke patient record", async () => {
      await expect(
        registry.connect(stranger).revokeRecord()
      ).to.be.revertedWith("No record");
    });
  });

  // ─── Responder management ─────────────────────────────────────────────────────

  describe("addResponder / removeResponder", () => {
    it("owner can add and remove responders", async () => {
      expect(await registry.isVerifiedResponder(stranger.address)).to.be.false;
      await registry.connect(owner).addResponder(stranger.address);
      expect(await registry.isVerifiedResponder(stranger.address)).to.be.true;
      await registry.connect(owner).removeResponder(stranger.address);
      expect(await registry.isVerifiedResponder(stranger.address)).to.be.false;
    });

    it("non-owner cannot add responders", async () => {
      await expect(
        registry.connect(patient).addResponder(stranger.address)
      ).to.be.reverted;
    });
  });
});
