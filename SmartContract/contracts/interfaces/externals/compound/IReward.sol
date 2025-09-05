// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Pool state that can change
/// @notice These methods compose the pool's state, and can change with any frequency including multiple times
/// per transaction
interface IReward {
    struct RewardOwed {
        address token;
        uint256 owed;
    }

    struct RewardConfig {
        address token;
        uint64 rescaleFactor;
        bool shouldUpscale;
    }

    function claim(address comet, address src, bool shouldAccrue) external;

    function claimTo(address comet, address src, address to, bool shouldAccrue) external;

    function getRewardOwed(address comet, address account) external returns (RewardOwed memory);

    function rewardConfig(address) external view returns (RewardConfig memory);

    function rewardsClaimed(address comet, address user) external view returns (uint256);
}
