// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { TransferHelper } from "../libraries/TransferHelper.sol";
import { IV3SwapRouterUniswap } from "../interfaces/externals/uniswap/IV3SwapRouterUniswap.sol";
import { IMoneyFiSwap } from "../interfaces/dex/IMoneyFiSwap.sol";
import { IPancakeRouter } from "../interfaces/externals/IPancakeRouter.sol";
import { IPancakePool } from "../interfaces/externals/IPancakePool.sol";
import { DefaultAccessControlEnumerable } from "../security/DefaultAccessControlEnumerable.sol";

contract MoneyFiPancakeSwap is DefaultAccessControlEnumerable, IMoneyFiSwap {
    address public pool;
    address public router;

    constructor(address pool_, address router_, address admin_) {
        pool = pool_;
        router = router_;

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
        amountOut = _swapTokenUniswapV3(tokenIn, tokenOut, amountIn, amountOutMin, receiver);
    }

    function setRouterV3(address _routerV3) external onlyDelegateAdmin {
        router = router;
    }

    function setPool(address _pool) external onlyDelegateAdmin {
        pool = _pool;
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
        IERC20(tokenIn).approve(router, amountIn);
        IPancakePool pancakePool = IPancakePool(pool);
        IPancakeRouter pancakeRouter = IPancakeRouter(router);

        IPancakeRouter.ExactInputSingleParams memory paramSwap = IPancakeRouter.ExactInputSingleParams({
            tokenIn: address(tokenIn),
            tokenOut: address(tokenOut),
            fee: pancakePool.fee(),
            recipient: receiver,
            deadline: block.timestamp + 5 seconds,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: uint160(0)
        });

        try pancakeRouter.exactInputSingle(paramSwap) returns (uint256 _amountOut) {
            amountOut = _amountOut;
        } catch {
            revert SwapError();
        }
    }
}
