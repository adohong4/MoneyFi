// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAllBridge {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amountLp) external;
    function balanceOf(address owner) external returns (uint256);
    function accRewardPerShareP() external returns (uint256);
}
