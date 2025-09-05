// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPoolBALUSDC {
    function getScalingFactors() external view returns (uint256[] memory);

    function getSwapFeePercentage() external view returns (uint256);

    function getNormalizedWeights() external view returns (uint256[] memory);
}
