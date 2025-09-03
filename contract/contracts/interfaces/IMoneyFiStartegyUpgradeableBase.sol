// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { StrategyType } from "../types/StrageryDataType.sol";

interface IMoneyFiStartegyUpgradeableBase {
    /*/////////////////////////////////////////////////////////////////////////
                                    ERROR
    /////////////////////////////////////////////////////////////////////////*/
    /// @dev Unable action when emergency
    error EnforcedEmergencyStop();

    /// @dev Only set up state one time
    error RequireSettedUpState();

    /// @dev Revert when address zero
    error RequiredAddressNotNull();
    /*/////////////////////////////////////////////////////////////////////////
                                    EVENTS
    /////////////////////////////////////////////////////////////////////////*/

    event ClaimRewardStrategy(address withdrawer, address receiver, address token, uint256 claimedAt);

    event EmergencyWithdraw(address indexed pool, address indexed strategy, uint256 amount, uint256 withdrawAt);

    /// @notice Check if an underlying asset is supported by the strategy.
    /// @param asset The address of the asset to check.
    /// @return True if the asset is supported, false otherwise.
    function isSupportUnderlyingAsset(address asset) external view returns (bool);

    /// @dev Allows the caller to perform an emergency withdrawal of funds.
    /// This function is intended to be used in critical situations where
    /// immediate access to funds is required, bypassing normal withdrawal
    /// mechanisms. Implementations should ensure proper safeguards are in
    /// place to prevent misuse.
    function emergencyWithdraw() external;

    /// @notice Sets the emergency stop status for deposits.
    /// @dev This function allows enabling or disabling the emergency stop for deposits.
    ///    When emergency stop is enabled, deposits may be restricted or halted.
    /// @param _isEmergencyStop A boolean value indicating whether to enable (true) or disable (false) the emergency stop.
    function setEmergencyStop(bool _isEmergencyStop) external;

    /// @notice Get current deposit info for a specific user in the strategy
    /// @param user The address of the user
    /// @return currentDeposit The user's current deposit info in the strategy
    function getUserStrategy(address user) external view returns (StrategyType.UserDeposit memory);

    /// @notice Hook called before the rebalance logic executes
    /// @dev Can be overridden by implementing contracts to perform custom pre-rebalance logic
    function beforeRebalance() external;

    /// @notice Hook called after the rebalance logic completes
    /// @dev Can be overridden by implementing contracts to perform custom post-rebalance logic
    function afterRebalance() external;

    /// @notice Calculates the profit or loss of a user in the strategy
    /// @dev Returns an int256 which can be negative (indicating a loss)
    /// @param _userAddress The address of the user to calculate profit for
    /// @return reward The net profit (or loss) of the user
    function getUserProfit(address _userAddress) external view returns (int256 reward);
}
