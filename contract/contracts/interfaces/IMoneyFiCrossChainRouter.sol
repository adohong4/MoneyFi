// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { RouterCommonType } from "../types/RouterDataType.sol";

/// @title IMoneyFiCrossChainRouter
/// @notice Interface for the MoneyFiCrossChainRouter contract
interface IMoneyFiCrossChainRouter {
    // ============================== //
    //            Errors             //
    // ============================== //

    /// @dev Revert when the strategy is not active or valid
    error InvalidStrategy();

    /// @dev Revert when the swap parameters are invalid
    error InvalidSwapParam();

    /// @dev Revert when the contract cannot swap tokens to the underlying asset
    error CanNotSwapToUnderLyToken();

    /// @dev Revert when the balance after swap is insufficient
    error InsufficientBalance();

    /// @dev Revert when the share amount for withdrawal is invalid
    error InvalidShare();

    /// @dev Revert supported token
    error InvalidSupportedTokenExternal();

    /// @dev Revert when the token is not supported
    error InvalidSupportedTokenInternal();

    /// @dev Revert when invalid rebalance amount
    error InvalidRebalanceAmount();
    error InvalidDexCrossChainInternal();
    error InvalidDexCrossChainExternal();
    error InvalidStrategyInternalChain();
    error InvalidStrategyExternalChain();
    error InvalidDexSwapInternalChain();
    error InvalidDexSwapExternalChain();
    error RequireDexActive();
    error InvalidStrategyToken();
    error InvalidTypeDexCrossChainSenderReceiver();
    error InvalidUnderlyingAssetExternalStrategy();
    error SwapFailed();
    error FailedSendNative();
    error InvalidSameToken();
    error RequiredAddressNotNull();
    error InvalidSystemFee();
    error InvalidHotWallet();
    // ============================== //
    //            Events              //
    // ============================== //

    event CollectNativeToken(address receiver);

    /// @notice Emitted when user withdraws funds from the same chain
    /// @param receiver The address receiving funds
    /// @param user The user who requested the withdraw
    /// @param strategyAddress The strategy address (if applicable)
    /// @param tokenAddress The token being withdrawn
    /// @param share The number of shares being redeemed (0 for unDistributed)
    /// @param actualWithdrawAmount Actual amount of token received
    /// @param withdrawAt Withdraw at
    event WithDrawFundSameChainFromOperator(
        address indexed receiver,
        address indexed user,
        address indexed strategyAddress,
        address tokenAddress,
        uint256 share,
        uint256 actualWithdrawAmount,
        uint256 withdrawAt
    );

    event SubmitWithdrawFundCrossChain(address indexed sender, address indexed receiver, address indexed tokenAddress);

    event WithdrawFundAnotherChain(
        address indexed token, address indexed receiver, uint256 amount, bytes transportMsg, uint256 timestamp
    );

    /// @dev Emitted when funds are transferred from the router to a fund vault in case of failed depositing to strategy cross
    /// chain.
    /// @param depositor The address of the user depositing the tokens.
    /// @param depositedTokenAddress The address of the ERC20 token being deposited.
    /// @param amount The amount of tokens deposited.
    /// @param timestamp The block timestamp when the deposit occurred.
    event TransferFundFromRouterToFundVaultCrossChain(
        address indexed depositor, address indexed depositedTokenAddress, uint256 amount, uint256 _transferFee, uint256 timestamp
    );

    event TransferFundCrossChain(
        address indexed depositor,
        address indexed depositedToken,
        address tokenInForBridge,
        address tokenOutForBridge,
        address crossChainDexSender,
        address crossChainDexReceiver,
        uint256 actualAmountBridgeCrossChain,
        uint256 distributionFee,
        bytes transportMsg,
        uint256 transferFundCrossChainAt
    );

    /// @notice Emitted when funds are distributed to a strategy
    /// @param strategyAddress Address of the strategy
    /// @param depositor Address of the depositor
    /// @param depositedTokenAddress Token used for deposit
    /// @param amount Amount deposited
    /// @param swapContract Address of the swap contract (if any)
    /// @param underlyingAsset The underlying asset of the strategy
    /// @param actualAmountOut Actual amount after swap (if any)
    /// @param strategyShare Shares received in the strategy
    /// @param distributedAt Timestamp of distribution
    event DistributeFundCrossChain(
        address indexed strategyAddress,
        address indexed depositor,
        address indexed depositedTokenAddress,
        uint256 amount,
        address swapContract,
        address underlyingAsset,
        uint256 actualAmountOut,
        uint256 strategyShare,
        uint256 distributedFee,
        uint256 distributedAt
    );

    /// @notice Emitted when a fund rebalance on the same chain occurs
    /// @param strategyAddress The address of the strategy contract
    /// @param userAddress The address of the user whose fund was rebalanced
    /// @param underlyingAsset The address of the underlying asset
    /// @param receivedAmount The actual amount received after rebalance
    /// @param protocolFee The protocol fee
    /// @param referralFee The referral fee
    /// @param rebalancedAt The rebalanced at
    event RebalanceFundSameChain(
        address indexed strategyAddress,
        address indexed userAddress,
        address indexed underlyingAsset,
        uint256 receivedAmount,
        int256 receivedReward,
        uint256 protocolFee,
        uint256 referralFee,
        uint256 rebalanceFee,
        uint256 rebalancedAt
    );

    event WithdrawFundAnotherChainExecuted(
        address indexed receiver,
        address indexed operator,
        address bridgeCrossChain,
        bool isReferral,
        uint256 crosschainFee,
        bytes transportMsg,
        uint256 timestamp
    );

    event WithdrawFundCrossChainFromOperator(
        address indexed receiver,
        address indexed tokenOut,
        bytes transportMsg,
        uint256 totalAmountOut,
        uint256 protocolFee,
        uint256 referralFee,
        uint256 withdrawFee,
        uint256 withdrawAt
    );

    event WithdrawFundCrossChainFromOperatorHotWallet(
        address indexed depositor,
        address indexed hotWallet,
        address tokenIn,
        address tokenOut,
        bytes32 uuid,
        uint256 totalAmountOut,
        uint256 protocolFee,
        uint256 referralFee,
        uint256 withdrawFee,
        uint256 destinationChainId,
        uint256 withdrawAt
    );

    event SetWhiteListHotWallet(address whitelist, bool isWhiteListHotWallet);
    // ============================== //
    //           Functions           //
    // ============================== //

    /// @notice Update controller and fund vault address
    /// @param moneyFiController_ New controller address
    /// @param moneyFundVault_ New fund vault address
    function upgradeControllerAndFundVault(address moneyFiController_, address moneyFundVault_) external;

    // /// @dev Called by a cross-chain router to receive funds and deposit them into a strategy on the destination chain.
    // /// @param _receiveFundCrossChainPrarm Struct containing depositor, strategy, token info, amount, and extra data.
    // function receiveFundCrossChain(RouterCommonType.ReceiveFundCrossChainParam memory _receiveFundCrossChainPrarm) external;

    // /// @dev Transfers funds from a cross-chain DEX to the local fund vault contract.
    // /// @param _receiveFundCrossChainPrarm Struct containing depositor, token, amount, and strategy information.
    // function transferFundFromRouterToFundVaultCrossChain(
    //     RouterCommonType.ReceiveFundCrossChainParam calldata _receiveFundCrossChainPrarm
    // )
    //     external;

    /// @dev Deposit fund to a stratefy pool from operator.
    /// @param _depositToStrategyCrossChain Struct containing depositor, token, amount, and strategy information.
    /// @param _swapTokenInternalParam Struct containing swap option for multiple swap contract
    function depositFundToStrategyCrossChainFromOperator(
        RouterCommonType.DepositToStrategyCrossChain memory _depositToStrategyCrossChain,
        RouterCommonType.SwapTokenWhenDepositParam memory _swapTokenInternalParam
    )
        external
        payable;

    /// @dev Withdraw fund from strategy pool on same chain from operator.
    /// @param _withdrawSameChainFromOperators Struct containing strategy information to withdraw from stratgy pool.
    /// @param _receiver The receiver address.
    /// @param _isReferral Is referral address.
    /// @param _withdrawFee The withdraw fee.
    function withdrawFundSameChain(
        RouterCommonType.WithdrawSameChainFromOperator[] memory _withdrawSameChainFromOperators,
        // Receiver is depositor
        address _receiver,
        bool _isReferral,
        uint256 _withdrawFee
    )
        external;

    /// @dev Withdraw fund from strategy pool on other chain from operator.
    /// @param _withdrawStrategyMultipleChainsV2 Array of strategy and fund in vault to withdraw on same token.
    /// @param _receiver The receiver address.
    /// @param _isReferral Is addres referral.
    /// @param _withdrawFee The withdraw fee.
    function withdrawFundAnotherChain(
        RouterCommonType.WithdrawStrategyMultipleChainsV2[] memory _withdrawStrategyMultipleChainsV2,
        address _receiver,
        bool _isReferral,
        uint256 _withdrawFee
    )
        external
        payable;

    /// @dev Withdraw fund from strategy pool on other chain from operator.
    /// @param _withdrawFromOperatorHotWallets Array of strategy and fund in vault to withdraw on same token.
    /// @param _additionParamWithDrawHotWallet Addition param.
    function withdrawFundCrossChainFromOperatorHotWallet(
        RouterCommonType.WithdrawFromOperatorHotWallet[] memory _withdrawFromOperatorHotWallets,
        RouterCommonType.AdditionParamWithDrawHotWallet memory _additionParamWithDrawHotWallet
    )
        external;

    /// @dev Set whitelist hot walllet.
    /// @param _whiteList Whitelist address.
    /// @param _isWhiteListHotWallet Whitelist status.
    function setWhiteListHotWallet(address _whiteList, bool _isWhiteListHotWallet) external;

    /// @notice Transfers all native tokens (e.g., ETH) held by the contract to a specified address.
    /// @dev Can only be called by the delegate admin and when the contract is not paused.
    ///      Reverts if the recipient address is zero or if the transfer fails.
    /// @param _to The address that will receive the native tokens.
    function collectNative(address payable _to) external;

    /// @notice Pause all major functions
    function pause() external;

    /// @notice Unpause all functions
    function unpause() external;
}
