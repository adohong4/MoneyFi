// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.20;

interface IMoneyFiStrategyUpgradeableUniswapV2 {
    error InvalidPair();

    function uniswapRouter() external view returns (address);
    function uniswapPair() external view returns (address);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function quoteToken() external view returns (address);
    function baseToken() external view returns (address);
    function slippageWhenSwapAsset() external view returns (uint256);
    function minimumSwapAmount() external view returns (uint256);

    function setSlippageWhenSwapAsset(uint256 _slippageWhenSwapAsset) external;
    function setMinimumSwapAmount(uint256 _minimumSwapAmount) external;
}
