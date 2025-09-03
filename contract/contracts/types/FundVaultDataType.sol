// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library MoneyFiFundVaultType {
    struct UserDepositInfor {
        uint256 originalDepositAmount;
        uint256 currentDepositAmount;
        uint256 durationDeposit;
        uint256 updatedAt;
    }
}
