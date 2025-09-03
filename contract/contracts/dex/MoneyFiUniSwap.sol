// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IUniswapV2Router02 } from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import { IUniswapV2Factory } from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import { IUniswapV3Factory } from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import { IUniswapV3Pool } from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
// import { UniversalRouter } from "@uniswap/universal-router/contracts/UniversalRouter.sol";
import { IPermit2 } from "../interfaces/externals/balancer/IPermit2.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { TransferHelper } from "../libraries/TransferHelper.sol";
import { IV3SwapRouterUniswap } from "../interfaces/externals/uniswap/IV3SwapRouterUniswap.sol";
import { IUniversalRouter } from "../interfaces/externals/uniswap/IUniversalRouter.sol";
import { IMoneyFiSwap } from "../interfaces/dex/IMoneyFiSwap.sol";
import { DefaultAccessControlEnumerable } from "../security/DefaultAccessControlEnumerable.sol";

contract MoneyFiUniSwap is DefaultAccessControlEnumerable, IMoneyFiSwap {
    IV3SwapRouterUniswap public routerV3;
    IUniswapV2Router02 public routerV2;
    IUniswapV3Factory public factoryV3;
    IUniswapV2Factory public factoryV2;

    uint24 public poolFee;

    constructor(
        address swapRouterUniswapV3_,
        address swapRouterUniswapV2_,
        address factoryV3_,
        address factoryV2_,
        address admin_
    ) {
        routerV3 = IV3SwapRouterUniswap(swapRouterUniswapV3_);
        routerV2 = IUniswapV2Router02(swapRouterUniswapV2_);
        factoryV3 = IUniswapV3Factory(factoryV3_);
        factoryV2 = IUniswapV2Factory(factoryV2_);

        poolFee = 3000;

        __DefaultAccessControlEnumerable_init(admin_);
    }

    function swapToken(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address receiver,
        bool isV3,
        bytes memory
    )
        external
        returns (uint256 amountOut)
    {
        if (isV3) {
            amountOut = _swapTokenUniswapV3(tokenIn, tokenOut, amountIn, amountOutMin, receiver);
        } else {
            amountOut = _swapTokenUniswapV2(tokenIn, tokenOut, amountIn, amountOutMin, receiver)[1];
        }
    }

    function setRouterV3(address _routerV3) external onlyDelegateAdmin {
        routerV3 = IV3SwapRouterUniswap(_routerV3);
    }

    function setRouterV2(address _routerV2) external onlyDelegateAdmin {
        routerV2 = IUniswapV2Router02(_routerV2);
    }

    function setFactoryV3(address _factoryV3) external onlyDelegateAdmin {
        factoryV3 = IUniswapV3Factory(_factoryV3);
    }

    function setFactoryV2(address _factoryV2) external onlyDelegateAdmin {
        factoryV2 = IUniswapV2Factory(_factoryV2);
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
        // Safe transfer from tokenIn to this contract
        TransferHelper.safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);

        // Safe approve to swap router address
        TransferHelper.safeApprove(tokenIn, address(routerV3), amountIn);

        IV3SwapRouterUniswap.ExactInputSingleParams memory params = IV3SwapRouterUniswap.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: poolFee,
            recipient: receiver,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });

        amountOut = routerV3.exactInputSingle(params);
    }

    function _swapTokenUniswapV2(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address receiver
    )
        internal
        returns (uint256[] memory amounts)
    {
        // Safe transfer from tokenIn to this contract
        TransferHelper.safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);

        // Safe approve to swap router address
        TransferHelper.safeApprove(tokenIn, address(routerV2), amountIn);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        amounts = routerV2.swapExactTokensForTokens(amountIn, amountOutMin, path, receiver, block.timestamp + 60 seconds);
    }

    function checkPoolExistsV3(address tokenA, address tokenB, uint24 v3Fee) public view returns (bool) {
        return factoryV3.getPool(tokenA, tokenB, v3Fee) != address(0);
    }

    function checkPoolExistsV2(address tokenA, address tokenB) public view returns (bool) {
        return factoryV2.getPair(tokenA, tokenB) != address(0);
    }

    function setPoolFee(uint24 _poolFee) external onlyDelegateAdmin {
        poolFee = _poolFee;
    }
}
