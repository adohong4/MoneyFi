// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.20;

/// @title IMoneyFiOracle
/// @notice Price oracle
interface IMoneyFiOracle {
    error InvalidPrice();

    /*//////////////////////////////////////////////////////////////////////////
                                 CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @notice Retrieves the price of an asset.
    /// @return answer The value of the asset.
    function getNativePrice() external view returns (uint256 answer, uint8 decimals);
}
