// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IIncentiveGauge {
    function deposit(uint256 value) external;

    function withdraw(uint256 value) external;

    function approve(address spender, uint256 value) external returns (bool);

    function claim_rewards() external;

    function balanceOf(address _addr) external view returns (uint256);

    function claimable_reward(address user, address reward_token) external pure returns (uint256);

    function claimed_reward(address user, address reward_token) external pure returns (uint256);
}
