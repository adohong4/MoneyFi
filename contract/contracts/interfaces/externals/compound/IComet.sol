// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Pool state that can change
/// @notice These methods compose the pool's state, and can change with any frequency including multiple times
/// per transaction
interface IComet {
    function baseTrackingAccrued(address user) external view returns (uint64);
}
