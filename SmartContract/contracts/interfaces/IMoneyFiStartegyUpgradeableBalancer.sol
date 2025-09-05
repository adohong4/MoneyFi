// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMoneyFiStartegyUpgradeableBalancer {
    event BalancerEmergencyWithdraw(address indexed allBridgePool, address indexed strategy, uint256 amount, uint256 withdrawAt);

    error TokenNotRegistered();
}
