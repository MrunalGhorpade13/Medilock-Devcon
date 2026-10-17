// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./MediLockID.sol";

/**
 * @title MediLockRegistry
 * @notice Core MediLock contract. Stores encrypted medical record commitments and
 *         CIDs on-chain, manages verified responders, logs access events, and
 *         supports expiring QR codes and key rotation.
 *
 * @dev Privacy model:
 *   - NO plaintext medical data is stored here or anywhere on-chain.
 *   - `commitment` = keccak256(ciphertext || salt) — proves data integrity without revealing content.
 *   - `cid` = IPFS CID of the AES-256-GCM encrypted blob (or empty string when stored on-chain).
 *   - The decryption key lives ONLY in the emergency QR code URL fragment (#key=...) and the patient's browser.
 */
contract MediLockRegistry is Ownable, ReentrancyGuard {
    // ─── Structs ─────────────────────────────────────────────────────────────────

    /**
     * @notice On-chain record for a patient.
     * @param commitment keccak256(ciphertext || salt) — integrity proof, never reveals data.
     * @param cid        IPFS CID of the encrypted blob. Empty string = stored on-chain via encryptedData.
     * @param active     Whether the record is currently accessible.
     * @param updatedAt  Timestamp of the last update.
     * @param expiresAt  Unix timestamp after which logAccess will revert. 0 = never expires.
     * @param accessCount Total number of verified-responder accesses.
     */
    struct Record {
        bytes32 commitment;
        string cid;
        bool active;
        uint64 updatedAt;
        uint64 expiresAt;
        uint64 accessCount;
    }

    /**
     * @notice Single entry in the access history.
     * @param responder Address of the verified responder who accessed.
     * @param timestamp Block timestamp of the access.
     */
    struct AccessEntry {
        address responder;
        uint64 timestamp;
    }

    // ─── State ───────────────────────────────────────────────────────────────────

    /// @notice The soulbound NFT contract for Medical IDs
    MediLockID public nftContract;

    /// @notice Patient address → medical record
    mapping(address => Record) private _records;

    /// @notice Patient address → paginated access history
    mapping(address => AccessEntry[]) private _accessHistory;

    /// @notice Addresses authorized to call logAccess
    mapping(address => bool) public verifiedResponders;

    /// @notice On-chain fallback storage for encrypted data (used when IPFS unavailable)
    mapping(address => bytes) public encryptedData;

    // ─── Errors ──────────────────────────────────────────────────────────────────

    error AlreadyRegistered();
    error NotRegistered();
    error NotOwner();
    error RecordInactive();
    error RecordExpired();
    error NotVerifiedResponder();
    error InvalidCommitment();
    error InvalidPageParams();

    // ─── Events ──────────────────────────────────────────────────────────────────

    event RecordRegistered(address indexed patient, bytes32 commitment, string cid, uint64 expiresAt);
    event RecordUpdated(address indexed patient, bytes32 commitment, string cid, uint64 expiresAt);
    event RecordRevoked(address indexed patient);
    event RecordReactivated(address indexed patient);
    event AccessLogged(address indexed patient, address indexed responder, uint64 timestamp);
    event ResponderAdded(address indexed responder);
    event ResponderRemoved(address indexed responder);

    // ─── Constructor ─────────────────────────────────────────────────────────────

    constructor() Ownable() {}

    /**
     * @notice Link the MediLockID NFT contract (call once after deploying both contracts).
     * @param _nftContract Address of the deployed MediLockID ERC-721 contract
     */
    function setMediLockIDContract(address _nftContract) external onlyOwner {
        require(address(nftContract) == address(0), "Already set");
        nftContract = MediLockID(_nftContract);
    }

    // ─── Patient functions ────────────────────────────────────────────────────────

    /**
     * @notice Register a new medical record and mint a soulbound Medical ID NFT.
     *         Can only be called once per address.
     * @param commitment keccak256(ciphertext || salt) — must be non-zero.
     * @param cid        IPFS CID of the encrypted blob. Pass empty string for on-chain storage.
     * @param expiresAt  Unix timestamp for QR expiry. 0 = never.
     */
    function registerRecord(
        bytes32 commitment,
        string calldata cid,
        uint64 expiresAt
    ) external nonReentrant {
        if (_records[msg.sender].updatedAt != 0) revert AlreadyRegistered();
        if (commitment == bytes32(0)) revert InvalidCommitment();

        _records[msg.sender] = Record({
            commitment: commitment,
            cid: cid,
            active: true,
            updatedAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            accessCount: 0
        });

        // Mint the soulbound Medical ID (reverts if already has one)
        nftContract.mintID(msg.sender);

        emit RecordRegistered(msg.sender, commitment, cid, expiresAt);
    }

    /**
     * @notice Store encrypted data on-chain as a fallback (called when IPFS unavailable).
     *         Only valid AFTER registerRecord has been called.
     * @param data AES-256-GCM ciphertext bytes
     */
    function storeEncryptedDataOnChain(bytes calldata data) external {
        if (_records[msg.sender].updatedAt == 0) revert NotRegistered();
        encryptedData[msg.sender] = data;
    }

    /**
     * @notice Update an existing medical record (key rotation or data change).
     *         Generates a new commitment + CID, instantly invalidating old QRs.
     * @param commitment New keccak256(ciphertext || salt)
     * @param cid        New IPFS CID (or empty for on-chain fallback)
     * @param expiresAt  New expiry timestamp. 0 = never.
     */
    function updateRecord(
        bytes32 commitment,
        string calldata cid,
        uint64 expiresAt
    ) external {
        if (_records[msg.sender].updatedAt == 0) revert NotRegistered();
        if (commitment == bytes32(0)) revert InvalidCommitment();

        Record storage record = _records[msg.sender];
        record.commitment = commitment;
        record.cid = cid;
        record.updatedAt = uint64(block.timestamp);
        record.expiresAt = expiresAt;

        emit RecordUpdated(msg.sender, commitment, cid, expiresAt);
    }

    /**
     * @notice Pause access to the record (responders cannot log access).
     *         Reversible via reactivateRecord().
     */
    function revokeRecord() external {
        if (_records[msg.sender].updatedAt == 0) revert NotRegistered();
        _records[msg.sender].active = false;
        emit RecordRevoked(msg.sender);
    }

    /**
     * @notice Re-enable a previously revoked record.
     */
    function reactivateRecord() external {
        if (_records[msg.sender].updatedAt == 0) revert NotRegistered();
        _records[msg.sender].active = true;
        emit RecordReactivated(msg.sender);
    }

    // ─── Responder functions ──────────────────────────────────────────────────────

    /**
     * @notice Log an emergency access event. Only callable by verified responders.
     *         Reverts if: not verified, record inactive, or QR has expired.
     * @param patient Address of the patient whose record is being accessed
     */
    function logAccess(address patient) external nonReentrant {
        if (!verifiedResponders[msg.sender]) revert NotVerifiedResponder();

        Record storage record = _records[patient];
        if (record.updatedAt == 0) revert NotRegistered();
        if (!record.active) revert RecordInactive();
        if (record.expiresAt != 0 && block.timestamp > record.expiresAt) revert RecordExpired();

        unchecked {
            record.accessCount++;
        }

        uint64 ts = uint64(block.timestamp);
        _accessHistory[patient].push(AccessEntry({ responder: msg.sender, timestamp: ts }));

        emit AccessLogged(patient, msg.sender, ts);
    }

    // ─── Admin (owner) functions ──────────────────────────────────────────────────

    /**
     * @notice Add a verified responder who can call logAccess.
     * @param responder Address to authorize
     */
    function addResponder(address responder) external onlyOwner {
        verifiedResponders[responder] = true;
        emit ResponderAdded(responder);
    }

    /**
     * @notice Remove a previously authorized responder.
     * @param responder Address to de-authorize
     */
    function removeResponder(address responder) external onlyOwner {
        verifiedResponders[responder] = false;
        emit ResponderRemoved(responder);
    }

    // ─── View functions ───────────────────────────────────────────────────────────

    /**
     * @notice Get the full record struct for a patient.
     * @param patient Patient address
     * @return The Record struct (commitment, cid, active, updatedAt, expiresAt, accessCount)
     */
    function getRecord(address patient) external view returns (Record memory) {
        if (_records[patient].updatedAt == 0) revert NotRegistered();
        return _records[patient];
    }

    /**
     * @notice Get just the access count for a patient.
     * @param patient Patient address
     */
    function getAccessCount(address patient) external view returns (uint64) {
        return _records[patient].accessCount;
    }

    /**
     * @notice Paginated access history for a patient.
     * @param patient Patient address
     * @param offset  Start index (0-based)
     * @param limit   Max number of entries to return (max 100)
     * @return entries Array of AccessEntry structs
     * @return total   Total number of access entries
     */
    function getAccessHistory(
        address patient,
        uint256 offset,
        uint256 limit
    ) external view returns (AccessEntry[] memory entries, uint256 total) {
        if (limit == 0 || limit > 100) revert InvalidPageParams();

        AccessEntry[] storage history = _accessHistory[patient];
        total = history.length;

        if (offset >= total) {
            return (new AccessEntry[](0), total);
        }

        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 size = end - offset;

        entries = new AccessEntry[](size);
        for (uint256 i = 0; i < size; i++) {
            entries[i] = history[offset + i];
        }
    }

    /**
     * @notice Check whether a patient has a registered record.
     * @param patient Patient address
     */
    function isRegistered(address patient) external view returns (bool) {
        return _records[patient].updatedAt != 0;
    }
}
