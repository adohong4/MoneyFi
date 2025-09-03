// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library StrategyType {
    struct UserDeposit {
        uint256 totalDeposited;
        uint256 totalWithDraw;
        int256 totalClaimedProfit;
    }
}
