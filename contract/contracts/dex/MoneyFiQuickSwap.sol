// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { TransferHelper } from "../libraries/TransferHelper.sol";
import { IV3SwapRouterUniswap } from "../interfaces/externals/uniswap/IV3SwapRouterUniswap.sol";
import { IMoneyFiSwap } from "../interfaces/dex/IMoneyFiSwap.sol";
import { DefaultAccessControlEnumerable } from "../security/DefaultAccessControlEnumerable.sol";
import { IQuickSwapRouterV3 } from "../interfaces/externals/quickswap/IQuickSwapV3.sol";
import { IUniswapV2Router01 } from "../interfaces/externals/quickswap/IUniswapV2Router01.sol";
import { IAerodromePool } from "../interfaces/externals/aerodrome/IAerodromePool.sol";

contract MoneyFiQuickSwap is DefaultAccessControlEnumerable, IMoneyFiSwap {
    address public routerV2;
    address public routerV3;

    constructor(address routerV2_, address routerV3_, address admin_) {
        routerV2 = routerV2_;
        routerV3 = routerV3_;

        __DefaultAccessControlEnumerable_init(admin_);
    }

    function swapToken(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address receiver,
        bool isV3,
        bytes memory externalCallData
    )
        external
        returns (uint256 amountOut)
    {
        TransferHelper.safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);

        if (isV3) {
            amountOut = _swapTokenUniswapV3(tokenIn, tokenOut, amountIn, amountOutMin, receiver);
        } else {
            amountOut = _swapTokenUniswapV2(tokenIn, tokenOut, amountIn, amountOutMin, receiver)[1];
        }
    }

    function setRouterV3(address _routerV3) external onlyDelegateAdmin {
        // routerV3 = IV3SwapRouterUniswap(_routerV3);
    }

    function setRouterV2(address _routerV2) external onlyDelegateAdmin {
        // routerV2 = IUniswapV2Router02(_routerV2);
    }

    function setFactoryV3(address _factoryV3) external onlyDelegateAdmin {
        // factoryV3 = IUniswapV3Factory(_factoryV3);
    }

    function setFactoryV2(address _factoryV2) external onlyDelegateAdmin {
        // factoryV2 = IUniswapV2Factory(_factoryV2);
    }

    function _swapTokenUniswapV3(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address receiver
    )
        internal
        returns (uint256 amountOut)
    {
        IERC20(tokenIn).approve(routerV3, amountIn);
        IQuickSwapRouterV3 quickSwapRouter = IQuickSwapRouterV3(routerV3);

        IQuickSwapRouterV3.ExactInputSingleParams memory param = IQuickSwapRouterV3.ExactInputSingleParams(
            address(tokenIn), address(tokenOut), msg.sender, block.timestamp + 5 seconds, amountIn, amountOutMin, uint160(0)
        );

        amountOut = quickSwapRouter.exactInputSingle(param);
    }

    // Work with wpol-usdt
    function _swapTokenUniswapV2(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address receiver
    )
        internal
        returns (uint256[] memory)
    {
        IERC20(tokenIn).approve(routerV2, amountIn);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint256[] memory amounts = IUniswapV2Router01(routerV2).swapExactTokensForTokens(
            amountIn,
            0, // amountOutMin: we can skip computing this number because the math is tested
            path,
            receiver,
            block.timestamp + 5 seconds
        );

        return amounts;
    }

    function checkPoolExistsV3(address tokenA, address tokenB, uint24 v3Fee) public view returns (bool) {
        // return factoryV3.getPool(tokenA, tokenB, v3Fee) != address(0);
    }

    function checkPoolExistsV2(address tokenA, address tokenB) public view returns (bool) {
        // return factoryV2.getPair(tokenA, tokenB) != address(0);
    }

    function getSwapFeeV3(address tokenA, address tokenB) public view returns (uint24 fee) {
        // address poolV3 = factoryV3.getPool(tokenA, tokenB, 3000);
        // fee = IUniswapV3Pool(poolV3).fee();
    }
}
