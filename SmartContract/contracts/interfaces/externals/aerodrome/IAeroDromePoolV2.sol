// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Pool state that can change
/// @notice These methods compose the pool's state, and can change with any frequency including multiple times
/// per transaction
interface IAerodromePoolV2 {
    function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external;
    function getAmountOut(uint256 amountIn, address tokenIn) external view returns (uint256);
}
