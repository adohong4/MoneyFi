// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { RouterCommonType } from "../types/RouterDataType.sol";

/// @title IMoneyFiCrossChainRouter
/// @notice Interface for the MoneyFiCrossChainRouter contract
interface IMoneyFiRouter {
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

    /// @dev Revert when invalid dex cross chain internal
    error InvalidDexCrossChainInternal();

    /// @dev Revert when invalid dex cross chain external
    error InvalidDexCrossChainExternal();

    /// @dev Revert when invalid strategy internal
    error InvalidStrategyInternalChain();

    /// @dev Revert when invalid strategy external
    error InvalidStrategyExternalChain();

    /// @dev Revert when invalid dex swap internal
    error InvalidDexSwapInternalChain();

    /// @dev Revert when invalid dex swap external
    error InvalidDexSwapExternalChain();

    /// @dev Revert when dex not active
    error RequireDexActive();

    /// @dev Revert when invalid strategy token
    error InvalidStrategyToken();

    /// @dev Revert when invalid type dex cross chain sender receiver
    error InvalidTypeDexCrossChainSenderReceiver();

    /// @dev Revert when swap failed
    error SwapFailed();

    /// @dev Revert when invalid strategy
    error InvalidUnderlyingStrategyAsset();

    /// @dev Revert when spam request
    error WithdrawRateLimit();

    /// @dev Revert invalid argument create withdraw request
    error InvalidWithdrawRequestArg();

    /// @dev Address can not be zero
    error RequiredAddressNotNull();

    /// @dev Invalid system fee
    error InvalidSystemFee();

    // ============================== //
    //            Events              //
    // ============================== //

    /// @notice Emitted when a user deposits funds into the router
    /// @param receiver Address of the receiver
    /// @param tokenAddress Address of the ERC20 token
    /// @param depositAmount Total amount intended for deposit
    /// @param actualDepositAmount Actual amount deposited (after fee/logic)
    /// @param depositedAt Timestamp of deposit
    event DepositFund(
        address indexed receiver,
        address indexed tokenAddress,
        uint256 depositAmount,
        uint256 actualDepositAmount,
        uint256 depositedAt
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
    event DistributeUserFund(
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

    /// @notice Emitted when user withdraws funds from the same chain
    /// @param receiver The address receiving funds
    /// @param user The user who requested the withdraw
    /// @param strategyAddress The strategy address (if applicable)
    /// @param tokenAddress The token being withdrawn
    /// @param share The number of shares being redeemed (0 for unDistributed)
    /// @param actualWithdrawAmount Actual amount of token received
    event WithDrawFundSameChain(
        address indexed receiver,
        address indexed user,
        address indexed strategyAddress,
        address tokenAddress,
        uint256 share,
        uint256 actualWithdrawAmount,
        uint256 protocolFee,
        uint256 referralFee,
        uint256 withdrawAt
    );

    event SubmitWithdrawFundCrossChain(address indexed sender, address indexed receiver, address indexed tokenAddress);

    /// @notice Emitted when user create withdraw request from different chains
    /// @param user The user who requested the withdraw request
    /// @param chainId Chain id
    event WithdrawRequest(
        address indexed user,
        uint256 indexed chainId,
        RouterCommonType.WithdrawStrategySameChain[] withdrawStrategySameChains,
        RouterCommonType.WithdrawStrategySameChainUndistributed[] unDistributedWithdraw,
        address tokenOut,
        uint256 requestedAt
    );
    // ============================== //
    //           Functions           //
    // ============================== //

    /// @notice Deposit funds into the system (user-facing)
    /// @param _depositParam Struct containing token, receiver, and amount
    function depositFund(RouterCommonType.DepositParam memory _depositParam) external;

    /// @notice Deposit funds to strategy from operator (same chain)
    /// @param _depositToStrategy Struct for deposit to strategy
    /// @param _swapTokenParam Optional swap parameters
    function depositFundToStrategySameChainFromOperator(
        RouterCommonType.DepositToStrategySameChain memory _depositToStrategy,
        RouterCommonType.SwapTokenWhenDepositParam memory _swapTokenParam
    )
        external;

    /// @notice Withdraw funds from strategies and/or undistributed tokens
    /// @param _withdrawStrategySameChains Array of strategy withdrawals
    /// @param _unDistributedWithdraw Array of undistributed token withdrawals
    function withdrawFundSameChain(
        RouterCommonType.WithdrawStrategySameChain[] memory _withdrawStrategySameChains,
        RouterCommonType.WithdrawStrategySameChainUndistributed[] memory _unDistributedWithdraw,
        bool _isReferral,
        bytes memory _signature,
        RouterCommonType.SwapParam memory _swapParam
    )
        external;

    /// @notice Pause all major functions
    function pause() external;

    /// @notice Unpause all functions
    function unpause() external;

    /// @notice Update controller and fund vault address
    /// @param moneyFiController_ New controller address
    /// @param moneyFundVault_ New fund vault address
    function upgradeControllerAndFundVault(address moneyFiController_, address moneyFundVault_) external;

    /// @notice Rebalances a user's fund on the same chain by redeeming their shares and redistributing funds
    /// @dev Callable only by users with at least operator role and when contract is not paused.
    ///      Handles share redemption, calculates profit and fees, and interacts with the FundVault for rebalancing.
    /// @param _rebalanceParam Struct containing rebalance parameters:
    ///        - strategyAddress: Address of the ERC4626 strategy contract
    ///        - userAddress: Address of the user whose funds are being rebalanced
    ///        - isReferral: Boolean indicating whether referral fee should be applied
    ///        - rebalancesFee: Fee applied for the rebalance operation
    function rebalanceFundSameChain(RouterCommonType.RebalanceStrategySameChain memory _rebalanceParam) external;

    /// @notice Emits withdraw requests for multiple strategies on different chains.
    /// @dev This function can only be called when the contract is not paused.
    ///      It iterates over an array of cross-chain withdrawal strategies and emits a `WithdrawRequest` event for each one.
    /// @param _withdrawStrategyMultipleChains An array of `WithdrawStrategyMultipleChains` structs,
    ///        each representing a withdrawal strategy and associated data for a specific chain.
    function createWithdrawRequestOnAnotherChain(
        RouterCommonType.WithdrawStrategyMultipleChains[] calldata _withdrawStrategyMultipleChains
    )
        external;

    // function withdrawCrossChain
    /// @notice Allows the delegate admin to perform an emergency withdrawal of funds from a specified strategy.
    /// @dev This function can only be called by the delegate admin and when the contract is not paused.
    ///      It ensures that the specified strategy is active before proceeding with the emergency withdrawal.
    /// @param strategyAddress The address of the strategy from which funds will be withdrawn.
    function emergencyWithdrawFund(address strategyAddress) external;

    /// @notice Sets the emergency stop status for deposits on a specific strategy.
    /// @dev This function can only be called by a delegate admin and when the contract is not paused.
    ///      It ensures that the strategy is active before updating its emergency stop status.
    /// @param strategyAddress The address of the strategy for which the emergency stop status is being set.
    /// @param isEmergencyStop A boolean indicating whether to enable (true) or disable (false) the emergency stop for deposits.
    function setEmergencyStop(address strategyAddress, bool isEmergencyStop) external;

    /// @notice Sets new cool down period withdraw request.
    /// @param _newPeriod The address controller address.
    function setCoolDownPeriodWithdrawRequest(uint256 _newPeriod) external;

    /// @notice Returns the next allowed timestamp when the user can make a withdraw request
    /// @param user The address of the user
    /// @return nextAllowedTimestamp The timestamp after which the user can make the next request
    function getNextWithdrawRequestTime(address user) external view returns (uint256 nextAllowedTimestamp);
}
