// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAllBridgePool {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amountLp) external;
    function balanceOf(address owner) external view returns (uint256);
    function accRewardPerShareP() external returns (uint256);
    function pendingReward(address user) external view returns (uint256);
    function claimRewards() external;
    function token() external returns (address);
}
