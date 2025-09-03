// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { MoneyFiFundVaultType } from "../types/FundVaultDataType.sol";

/// @title IMoneyFiFundVault
/// @notice Interface for the MoneyFiFundVault contract
interface IMoneyFiFundVault {
    // ============================== //
    //            Errors             //
    // ============================== //

    /// @dev Revert when the caller is not the expected router
    error InvalidRouter();

    /// @dev Revert when the provided amount is invalid (e.g., zero or below min requirement)
    error InvalidAmount();

    /// @dev Revert when the user does not have sufficient deposit
    error InsufficientAmount();

    /// @dev Revert when the token is not supported or inactive
    error InvalidSupportedTokenInternal();

    /// @dev Revert when the distribution fee is invalid or causes underflow
    error InvalidDistributionFee();

    /// @dev Revert when transfer invalid amount in rebalance action
    error InvalidRebalanceFundSameChainAmount();

    error InvalidInternalChainToken();

    /// @dev Revert when tokens length not equal to amount length
    error InvalidParam();

    /// @dev Revert when invalid lp token
    error InvalidLpToken();

    /// @dev Revert when invalid lp amount
    error InvalidLpAmount();

    /// @dev Revert when address zero
    error RequiredAddressNotNull();

    // ============================== //
    //            Events             //
    // ============================== //

    /// @notice Emitted when a user deposits funds into the vault
    /// @param tokenAddress Address of the ERC20 token
    /// @param receiver Address receiving the deposit record
    /// @param depositAmount Total amount deposited
    /// @param actualDepositAmount Amount after deducting protocol fee
    /// @param depositedAt Timestamp of deposit
    event DepositFundVault(
        address tokenAddress, address receiver, uint256 depositAmount, uint256 actualDepositAmount, uint256 depositedAt
    );

    /// @notice Emitted when funds are transferred to a strategy via the router
    /// @param tokenAddress Address of the ERC20 token
    /// @param distributionAmount Total amount transferred
    /// @param actualDistributionAmount Amount after deducting distribution fee
    /// @param transferdAt Timestamp of the transfer
    event TransferFundToRouterFundVault(
        address tokenAddress, uint256 distributionAmount, uint256 actualDistributionAmount, uint256 transferdAt
    );

    /// @notice Emitted when funds are transferred to a strategy via the router
    /// @param tokenAddress Address of the ERC20 token
    /// @param distributionAmount Total amount transferred
    /// @param actualDistributionAmount Amount after deducting distribution fee
    /// @param minusOriginAmount Amount after deducting distribution fee
    /// @param transferdAt Timestamp of the transfer
    event TransferFundToRouterFundVaultCrossChain(
        address tokenAddress,
        uint256 distributionAmount,
        uint256 actualDistributionAmount,
        uint256 minusOriginAmount,
        uint256 transferdAt
    );

    /// @notice Emitted when funds are transferred to user
    /// @param userAddress User address
    /// @param tokenAddress Withdraw address
    /// @param amount Withdraw amount
    /// @param withdrawAt Timestamp of the withdraw
    event WithdrawUnDistributedFundToUserFundVault(address userAddress, address tokenAddress, uint256 amount, uint256 withdrawAt);

    /// @notice Emitted when the protocol fee is withdrawn
    /// @param token ERC20 token address
    /// @param amount Amount of fee withdrawn
    /// @param withdrawAt Timestamp of withdrawal
    event WithDrawProtocolFee(address token, uint256 amount, uint256 withdrawAt);

    /// @notice Emitted when the distribute fee is withdrawn
    /// @param token ERC20 token address
    /// @param amount Amount of fee withdrawn
    /// @param withdrawAt Timestamp of withdrawal
    event WithDrawDistributeFee(address token, uint256 amount, uint256 withdrawAt);

    /// @notice Emitted when the rebalance fee is withdrawn
    /// @param token ERC20 token address
    /// @param amount Amount of fee withdrawn
    /// @param withdrawAt Timestamp of withdrawal
    event WithDrawRebalanceFee(address token, uint256 amount, uint256 withdrawAt);

    /// @notice Emitted when the rebalance fee is withdrawn
    /// @param token ERC20 token address
    /// @param amount Amount of fee withdrawn
    /// @param withdrawAt Timestamp of withdrawal
    event WithDrawReferralFee(address token, uint256 amount, uint256 withdrawAt);

    /// @notice Emitted when the rebalance fee is withdrawn
    /// @param token ERC20 token address
    /// @param amount Amount of fee withdrawn
    /// @param withdrawAt Timestamp of withdrawal
    event WithDrawWithdrawalFee(address token, uint256 amount, uint256 withdrawAt);

    /// @notice Emitted when funds are rebalanced on the same chain
    /// @param token The address of the ERC20 token used in the rebalance
    /// @param receiver The address of the user receiving the rebalanced funds
    /// @param rebalanceAmount The total amount rebalanced
    /// @param protocolFee The portion taken as protocol fee
    /// @param referralFee The portion taken as referral fee
    /// @param rebalanceFee The portion taken as rebalance fee
    /// @param timestamp The block timestamp when the rebalance occurred
    event RebalanceFundSameChainFundVault(
        address indexed token,
        address indexed receiver,
        uint256 rebalanceAmount,
        uint256 protocolFee,
        uint256 referralFee,
        uint256 rebalanceFee,
        uint256 timestamp
    );

    /// @dev Emitted when tokens are transferred from the router to a fund or destination.
    /// @param tokenAddress The address of the token being transferred.
    /// @param amount The amount of tokens transferred.
    /// @param timestamp The block timestamp when the transfer occurred.
    event TransferFundFromRouterToFundVault(address indexed tokenAddress, uint256 amount, uint256 timestamp);

    // ============================== //
    //        External Methods       //
    // ============================== //

    /// @notice Deposit funds into the vault
    /// @dev Only callable by the router. Updates deposit info and applies a protocol fee.
    /// @param _tokenAddress Address of the ERC20 token being deposited
    /// @param _receiver Address receiving the deposit balance
    /// @param _amount Total amount of tokens to deposit
    /// @return amountAfterFee The amount left after deducting protocol fee
    function depositFund(address _tokenAddress, address _receiver, uint256 _amount) external returns (uint256 amountAfterFee);

    /// @notice Transfer user’s deposited fund from the vault to the router
    /// @dev Only callable by the router. Deducts distribution fee and updates user's deposit info.
    /// @param _tokenAddress Address of the ERC20 token being transferred
    /// @param _userAddress Address of the user whose fund is being used
    /// @param _amount Total amount to transfer from vault
    /// @param _distributionFee Fee to be collected by the protocol
    function transferFundToRouter(
        address _tokenAddress,
        address _userAddress,
        uint256 _amount,
        uint256 _distributionFee
    )
        external;

    /// @notice Transfer user’s deposited fund from the vault to the router
    /// @dev Only callable by the router. Deducts distribution fee and updates user's deposit info.
    /// @param _tokenAddress Address of the ERC20 token being transferred
    /// @param _userAddress Address of the user whose fund is being used
    /// @param _amount Total amount to transfer from vault
    /// @param _distributionFee Fee to be collected by the protocol
    function transferFundToRouterCrossChain(
        address _tokenAddress,
        address _userAddress,
        uint256 _amount,
        uint256 _distributionFee
    )
        external;

    /// @notice Transfer withdrawal fee from router
    /// @dev Only callable by the router. Deducts distribution fee and updates user's deposit info.
    /// @param _tokenAddress Address of the ERC20 token being transferred
    /// @param _amount Total amount to transfer from vault
    function receiveWithdrawFee(address _tokenAddress, uint256 _amount) external;

    /// @notice Transfer to user
    /// @dev Only callable by the router. Deducts distribution fee and updates user's deposit info.
    /// @param _tokenAddress Address of the ERC20 token being transferred
    /// @param _userAddress Address of the user whose fund is being used
    /// @param _receiverAddress Address of the user whose fund is being sent
    /// @param _amount Total amount to transfer from vault
    function withdrawUnDistributedFundToUser(
        address _userAddress,
        address _receiverAddress,
        address _tokenAddress,
        uint256 _amount
    )
        external;

    /// @notice Withdraws accumulated protocol fees for the provided token list
    /// @dev Only callable by a delegate admin when the contract is not paused
    /// @param supportedTokens Array of ERC20 token addresses to withdraw fees for
    function withdrawProtocolFee(address[] calldata supportedTokens) external;

    /// @notice Withdraws accumulated distribute fees for the provided token list
    /// @dev Only callable by a delegate admin when the contract is not paused
    /// @param supportedTokens Array of ERC20 token addresses to withdraw distribute fees for
    function withdrawDistributeFee(address[] calldata supportedTokens) external;

    /// @notice Withdraws accumulated rebalance fees for the provided token list
    /// @dev Only callable by a delegate admin when the contract is not paused
    /// @param supportedTokens Array of ERC20 token addresses to withdraw rebalance fees for
    function withdrawRebalanceFee(address[] calldata supportedTokens) external;

    /// @notice Withdraws accumulated referral fees for the provided token list
    /// @dev Only callable by a delegate admin when the contract is not paused
    /// @param supportedTokens Array of ERC20 token addresses to withdraw referral fees for
    function withdrawReferralFee(address[] calldata supportedTokens) external;

    /// @notice Withdraws accumulated withdrawal fees for the provided token list
    /// @dev Only callable by a delegate admin when the contract is not paused
    /// @param supportedTokens Array of ERC20 token addresses to withdraw withdrawal fees for
    function withdrawWithdrawalFee(address[] calldata supportedTokens) external;

    /// @notice Rebalances user fund on the same chain by transferring tokens from router to strategy
    /// @dev Only callable by the router; validates token and handles internal accounting
    /// @param _token The address of the ERC20 token to rebalance
    /// @param _receiver The address receiving the rebalanced funds
    /// @param _rebalanceAmount Total amount of tokens being rebalanced
    /// @param _protocolFee Portion of the amount allocated as protocol fee
    /// @param _referralFee Portion of the amount allocated as referral fee
    /// @param _rebalanceFee Portion of the amount allocated as rebalance operation fee
    function rebalanceFundSameChain(
        address _token,
        address _receiver,
        uint256 _rebalanceAmount,
        uint256 _protocolFee,
        uint256 _referralFee,
        uint256 _rebalanceFee
    )
        external;

    /// @notice Increases the accumulated protocol fee for a specific token
    /// @dev Only callable by the router
    /// @param _token The address of the ERC20 token to increase the protocol fee for
    /// @param _protocolFee The amount to add to the protocol fee
    /// @param _referralFee The amount to add to the protocol fee
    function increaseProtocolAndReferralFee(address _token, uint256 _protocolFee, uint256 _referralFee) external;

    /// @dev Transfers tokens from the router to the fund vault and updates user deposit information.
    /// @param _tokenAddress The address of the ERC20 token being transferred.
    /// @param _depositor The address of the user for whom the deposit is recorded.
    /// @param _amount The amount of tokens to transfer.
    function transferFundFromRouterToFundVault(address _tokenAddress, address _depositor, uint256 _amount) external;

    /// @notice Set new controller
    /// @param _moneyFiController The new controller address.
    /// @dev Only callable by a delegate admin
    function setController(address _moneyFiController) external;

    /// @notice Set new fee to
    /// @param _feeTo The new feeTo address.
    /// @dev Only callable by a delegate admin
    function setFeeTo(address _feeTo) external;

    /// @notice Pause all deposit and transfer operations
    /// @dev Only callable by a delegate admin
    function pause() external;

    /// @notice Unpause the contract and resume operations
    /// @dev Only callable by a delegate admin
    function unpause() external;

    // ============================== //
    //         View Functions        //
    // ============================== //

    /// @notice Get user deposit information
    /// @param _token Address of the token
    /// @param _user Address of the user
    /// @return Struct with user deposit info
    function getUserDepositInfor(
        address _token,
        address _user
    )
        external
        view
        returns (MoneyFiFundVaultType.UserDepositInfor memory);

    /// @notice Returns the distribution fee for a specific token
    /// @param tokenAddress Address of the ERC20 token
    /// @return fee Distribution fee amount associated with the token
    function distributeFee(address tokenAddress) external view returns (uint256 fee);

    /// @notice Returns the rebalance fee for a specific token
    /// @param tokenAddress Address of the ERC20 token
    /// @return fee Rebalance fee amount associated with the token
    function rebalanceFee(address tokenAddress) external view returns (uint256 fee);

    /// @notice Returns the rebalance fee for a specific token
    /// @param tokenAddress Address of the ERC20 token
    /// @return fee Rebalance fee amount associated with the token
    function withdrawFee(address tokenAddress) external view returns (uint256 fee);

    /// @notice Returns the referral fee for a specific token
    /// @param tokenAddress Address of the ERC20 token
    /// @return fee Referral fee amount associated with the token
    function referralFee(address tokenAddress) external view returns (uint256 fee);

    /// @notice Returns the total protocol fee accumulated for a specific token
    /// @param tokenAddress Address of the ERC20 token
    /// @return totalFee Total accumulated protocol fee for the token
    function totalProtocolFee(address tokenAddress) external view returns (uint256 totalFee);
}
