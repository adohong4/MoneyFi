// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMoneyFiStrategyUpgradeableAllBridge {
    /*/////////////////////////////////////////////////////////////////////////
                                    ERRORS
    /////////////////////////////////////////////////////////////////////////*/

    error InvalidUnderlyingAllBridgeAsset();

    /*//////////////////////////////////////////////////////////////////////////
                        USER-FACING FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @notice Converts LP token amount of AllBridge to underlying asset amount.
    /// @param amount The LP token amount to convert.
    /// @return The equivalent underlying asset amount.
    function convertLpToUnderlyingAssetAllBridge(uint256 amount) external view returns (uint256);

    /// @notice Converts a deposit amount to AllBridge's expected deposit amount format.
    /// @param _depositAmount The deposit amount to convert.
    /// @return The converted deposit amount.
    function convertMinimumDepositAmountAllBridge(uint256 _depositAmount) external view returns (uint256);

    /// @notice Updates the AllBridgePool contract address.
    /// @param _allBridgePool The new AllBridgePool contract address.
    function setAllBridgePool(address _allBridgePool) external;

    /// @notice Updates the system precision value for AllBridge calculations.
    /// @param _precision The new system precision value.
    function setSystemPrecisionAllBridge(uint256 _precision) external;
}
