// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Pool state that can change
/// @notice These methods compose the pool's state, and can change with any frequency including multiple times
/// per transaction
interface IPool {
    struct UserBasic {
        int104 principal;
        uint64 baseTrackingIndex;
        uint64 baseTrackingAccrued;
        uint16 assetsIn;
    }

    function supply(address asset, uint256 amount) external;

    function withdraw(address asset, uint256 amount) external;

    function getReserves() external view returns (uint256);

    function balanceOf(address user) external view returns (uint256);

    function userBasic(address user) external view returns (UserBasic memory);
}
