// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMoneyFiSwap {
    error InvalidSwapAmount(uint256 amount);
    error NoLiquidityInV2OrV3();

    error SwapError();

    function swapToken(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        bool isV3,
        bytes memory externalCallData
    )
        external
        returns (uint256 amountOut);
}
