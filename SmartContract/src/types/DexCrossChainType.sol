// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library DexCrossChainType {
    struct BridgeCrossChainStargateSupportToken {
        address token;
        string name;
        string symbol;
        uint8 decimals;
        address poolToken;
    }

    struct TransportParams {
        address token;
        uint32 dstChainId;
        uint256 amount;
        address receiver;
        bytes composeMsg;
        uint128 composeGasLimit;
    }

    struct ComposeParams {
        address strategyAddress;
        address depositor;
        address depositedTokenAddress;
        uint256 amount;
        uint256 distributionFee;
        bytes externalCallData;
    }

    /// @notice Parameters required to initiate a cross-chain fund transfer to a strategy
    struct DepositCrossChainParam {
        address tokenInForBridge;
        address receiver;
        address tokenOutForBridge;
        address depositor;
        uint256 amountIn;
        uint256 amountOutMin;
        bytes externalCallData;
        bytes transportMsg;
    }

    /// @notice Parameters for transporting funds cross-chain
    struct WithdrawCrossChainParam {
        address tokenInForBridge;
        address receiver;
        uint256 amountIn;
        uint256 amountOutMin;
        bytes transportMsg;
    }
}
