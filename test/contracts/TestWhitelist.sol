// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.17;

import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';

contract TestWhitelistTree {
    bytes32 public whitelistTreeRoot;
    function setMerkleRoot(bytes32 merkleRoot) external {
        whitelistTreeRoot = merkleRoot;
    }
    function verifyMerkleProof(uint256 allocation, bytes32[] calldata proof) external view returns (bool) {
        return MerkleProof.verify(proof, whitelistTreeRoot, keccak256(abi.encodePacked(msg.sender, allocation)));
    }
    function verifyMerkleProof2(uint256 amount1, uint256 amount2, string calldata ipfsCid, bytes32[] calldata proof) external view returns (bool) {
        return MerkleProof.verify(proof, whitelistTreeRoot, keccak256(abi.encodePacked(msg.sender, amount1, amount2, ipfsCid)));
    }
}
