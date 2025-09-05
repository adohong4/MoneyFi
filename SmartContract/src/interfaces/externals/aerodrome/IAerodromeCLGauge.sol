// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Pool state that can change
/// @notice These methods compose the pool's state, and can change with any frequency including multiple times
/// per transaction
interface IAerodromeCLGauge {
    function deposit(uint256 tokenId) external;
    function withdraw(uint256 tokenId) external;
    function getReward(uint256 tokenId) external;
    function earned(address account, uint256 tokenId) external returns (uint256);
}
