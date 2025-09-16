// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IMoneyFiStrategyUpgradeableCommon} from "../interfaces/IMoneyFiStrategyUpgradeableCommon.sol";

library MoneyFiStargateCrossChainRouterType {
    struct SendParam {
        uint32 dstEid;
        bytes32 to;
        uint256 amountLD;
        uint256 minAmountLD;
        bytes extraOptions;
        bytes composeMsg;
        string oftCmd;
    }

    struct MessagingFee {
        uint256 nativeFee;
        uint256 tokenFee;
        uint256 gasFee;
    }

    struct OFTReceipt {
        uint256 amountReceivedLD;
        uint256 gasFee;
    }

    struct TransferFundCrossToContractParam {
        // For transfer token cross chain
        address stargatePool;
        address refundAddress;
        // Router address
        address receiver;
        uint256 amount;
        uint32 destinationEndpointId;
        // bytes composeMsg;

        // For distribute token to valid strategy
        address strategyAddress;
        address depositor;
        address depositedTokenAddress;
    }
}

library RouterCommonType {
    struct DepositParam {
        address tokenAddress;
        // address receiver;
        uint256 amount;
    }

    struct DepositToStrategyCrossChain {
        address crossChainDexSender;
        address crossChainDexReceiver;
        address depositor;
        // Token address are available in fund vault contract
        address depositedTokenAddress;
        // Token in address for cross chain bridge
        address tokenInForBridge;
        // Token in address for cross chain bridge
        address tokenOutForBridge;
        // Amount in token before cross chain bridge
        uint256 amountIn;
        // Amount out token after cross chain bridge and swap internal
        uint256 amountOutMin;
        // Also include tran
        uint256 distributionFee;
        bytes externalCallData;
        // Encoded message for cross-chain transport
        bytes transportMsg;
    }

    struct DepositToStrategySameChain {
        address strategyAddress;
        address depositor;
        address depositedTokenAddress;
        uint256 amount;
        uint256 distributionFee;
        bytes externalCallData;
    }

    struct WithdrawStrategySameChain {
        address strategyAddress;
        uint256 share;
        bytes externalCallData;
    }

    struct RebalanceStrategySameChain {
        address strategyAddress;
        address userAddress;
        bool isReferral;
        uint256 rebalancesFee;
    }

    struct ClaimwStrategySameChain {
        address strategyAddress;
        bytes externalCallData;
    }

    struct WithdrawStrategySameChainUndistributed {
        address tokenAddress;
        uint256 unDistributedAmount;
    }

    struct WithdrawStrategyMultipleChains {
        WithdrawStrategySameChain[] withdrawStrategySameChains;
        WithdrawStrategySameChainUndistributed[] unDistributedWithdraw;
        uint256 chainId;
        address tokenOut;
    }

    struct SwapTokenWhenDepositParam {
        address swapContract;
        // Address token Amount in is depositedTokenAddress in DistributeFundCrossChain
        // Amount out in token underlying asset in strategy
        uint256 amountOutMin;
        bool isV3;
        bytes externalCallData;
    }

    struct MoneyFiOracle {
        address pricer;
        bytes oracleCallData;
    }

    struct ReceiveFundCrossChainParam {
        address depositor;
        address depositedTokenAddress;
        uint256 amount;
        bytes externalCallData;
    }

    struct AssetToWithdrawMultichain {
        address tokenAddress;
        uint256 amount;
        bytes externalCallData;
    }

    struct AdditionParam {
        address receiver;
        address tokenCommon;
        uint256 amountTokenToSend;
        bool isReferral;
    }

    struct SwapParam {
        address tokenReceive;
        address swapImpl;
        bytes externalCallData;
        uint256 amountOutMin;
        bool isV3;
    }

    struct CrossChainParam {
        uint256 crosschain_fee;
        // address bridge_cross_chain;
        address receiver;
        bool isReferral;
    }
    // bytes transportMsg;

    // struct WithdrawStrategyMultipleChainsV2 {
    //     WithdrawStrategySameChain[] withdrawStrategySameChains;
    //     WithdrawStrategySameChainUndistributed unDistributedWithdraw;
    //     address tokenAddress;
    //     uint256 nativeValue;
    // }

    struct WithdrawStrategyMultipleChainsV2 {
        WithdrawStrategySameChain[] withdrawStrategySameChains;
        WithdrawStrategySameChainUndistributed unDistributedWithdraw;
        SwapParam swapParam;
        address tokenIn;
        address crossChain;
        uint256 nativeValue;
        uint256 slippage;
        bytes transportMsg;
    }

    struct WithdrawSameChainFromOperator {
        WithdrawStrategySameChain[] withdrawStrategySameChains;
        WithdrawStrategySameChainUndistributed unDistributedWithdraw;
        SwapParam swapParam;
        address tokenIn;
    }

    struct WithdrawFromOperatorHotWallet {
        WithdrawStrategySameChain[] withdrawStrategySameChains;
        WithdrawStrategySameChainUndistributed unDistributedWithdraw;
        address tokenIn;
        bytes32 uuid;
    }

    struct AdditionParamWithDrawHotWallet {
        address depositor;
        address hotWallet;
        address tokenOut;
        uint256 withdrawFee;
        uint256 destinationChainId;
        bool isReferral;
    }

    struct DexSwap {
        address swapContract;
        address tokenIn;
        address tokenOut;
        address receiver;
        uint256 amountIn;
        uint256 amountOutMin;
        bytes externalCall;
        bool isV3;
    }

    struct RebalanceStrategy {
        IMoneyFiStrategyUpgradeableCommon strategy;
        address asset;
        address owner;
        uint256 rebalanceAmount;
        int256 receivedReward;
        uint256 protocolFee;
        uint256 referralFee;
        uint256 rebalanceFee;
    }
}
