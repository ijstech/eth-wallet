// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract HashTypedData is EIP712 {
    using ECDSA for bytes32;

    constructor() EIP712("Triplay", "0.1.0") {
    }

    function getChainId() public view returns (uint256) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return chainId;
    }
    
    function hashUnstakeParams(
        uint256 requestId,
        address player,
        uint256 amount
    ) external view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(
            keccak256("Unstake(uint256 chainId,uint256 requestId,address player,uint256 amount)"),
            getChainId(),
            requestId,
            player,
            amount
        )));
    }

    function getSigner(
        bytes calldata signature, 
        bytes32 paramsHash
    ) external pure returns (address) {
        address signer = ECDSA.recover(paramsHash, signature);
        return signer;
    }

}