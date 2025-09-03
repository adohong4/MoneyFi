// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library MoneyFiControllerType {
    struct TokenInfo {
        address lpTokenAddress;
        uint256 minDepositAmount;
        uint256 decimals;
        uint256 chainId;
        // bool isInternalChain;
        bool isActive;
    }

    struct CrossChainParam {
        // Name + chainId
        string name;
        uint256 chainId;
        // bool isInternalChain;
        // 1 for contract implement Stargate Dex
        // 2 for contract implement AllBridge Dex
        // .....
        uint256 typeDex;
        bool isActive;
    }

    struct InternalSwapParam {
        string name;
        uint256 chainId;
        // bool isInternalChain;
        bool isActive;
    }

    struct Strategy {
        string name;
        uint256 chainId;
        // bool isInternalChain;
        bool isActive;
    }

    struct StrategyExternal {
        address underlyingAsset;
        string name;
        uint256 chainId;
        // bool isInternalChain;
        bool isActive;
    }

    struct Oracle {
        string name;
        uint256 chainId;
        // bool isInternalChain;
        bool isActive;
    }
}
