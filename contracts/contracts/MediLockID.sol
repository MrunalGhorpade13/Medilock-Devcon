// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MediLockID
 * @notice Soulbound ERC-721 Medical ID NFT. One token per patient address.
 *         Transfers are permanently blocked.
 * @dev Minting and burning handled exclusively by the MediLockRegistry contract.
 */
contract MediLockID is ERC721, Ownable {
    uint256 private _nextTokenId;
    address public registry;

    // ─── Events ─────────────────────────────────────────────────────────────────
    event RegistrySet(address indexed registry);

    // ─── Constructor ────────────────────────────────────────────────────────────
    constructor(address _registry) ERC721("MediLock Medical ID", "MEDID") Ownable() {
        registry = _registry;
    }

    // ─── Admin ──────────────────────────────────────────────────────────────────
    function setRegistry(address _registry) external onlyOwner {
        registry = _registry;
        emit RegistrySet(_registry);
    }

    // ─── Mint / Burn ────────────────────────────────────────────────────────────
    function mintID(address to) external returns (uint256 tokenId) {
        require(msg.sender == registry, "Not registry");
        require(balanceOf(to) == 0, "Already has ID");
        tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);
    }

    function burnID(uint256 tokenId) external {
        require(msg.sender == registry, "Not registry");
        _burn(tokenId);
    }

    /**
     * @notice Returns the token ID owned by an address (0 if none).
     */
    function tokenOfOwner(address owner) external view returns (uint256) {
        // iterate is fine since max 1 token per address
        uint256 total = _nextTokenId;
        for (uint256 i = 1; i <= total; i++) {
            if (_exists(i) && ownerOf(i) == owner) return i;
        }
        return 0;
    }

    // ─── Soulbound overrides ────────────────────────────────────────────────────
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        // Allow minting (from == 0) and burning (to == 0), block everything else
        require(from == address(0) || to == address(0), "Soulbound: transfers disabled");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function approve(address, uint256) public pure override {
        revert("Soulbound: transfers disabled");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("Soulbound: transfers disabled");
    }

    // ─── Token URI ──────────────────────────────────────────────────────────────
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return string(
            abi.encodePacked(
                'data:application/json;charset=utf-8,{"name":"MediLock Medical ID #',
                _toString(tokenId),
                '","description":"Soulbound Medical ID issued by MediLock.","image":"ipfs://QmMediLockPlaceholder"}'
            )
        );
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
