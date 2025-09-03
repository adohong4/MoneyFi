// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

enum MessengerProtocol {
    None,
    Allbridge,
    Wormhole,
    LayerZero
}

interface IAllBridgeRouter {
    function swapAndBridge(
        bytes32 token,
        uint256 amount,
        bytes32 recipient,
        uint256 destinationChainId,
        bytes32 receiveToken,
        uint256 nonce,
        MessengerProtocol messenger,
        uint256 feeTokenAmount
    )
        external
        payable;
}
