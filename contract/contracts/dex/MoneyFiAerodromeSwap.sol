// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { TransferHelper } from "../libraries/TransferHelper.sol";
import { IV3SwapRouterUniswap } from "../interfaces/externals/uniswap/IV3SwapRouterUniswap.sol";
import { IMoneyFiSwap } from "../interfaces/dex/IMoneyFiSwap.sol";
import { DefaultAccessControlEnumerable } from "../security/DefaultAccessControlEnumerable.sol";
import { IAerodromeRouter } from "../interfaces/externals/aerodrome/IAerodromeRouter.sol";
import { IAerodromePool } from "../interfaces/externals/aerodrome/IAerodromePool.sol";

contract MoneyFiAerodromeSwap is DefaultAccessControlEnumerable, IMoneyFiSwap {
    address public pool;
    address public router;
    address public routerV2;
    address public factory;

    constructor(address pool_, address router_, address routerV2_, address factory_, address admin_) {
        pool = pool_;
        router = router_;
        routerV2 = routerV2_;
        factory = factory_;

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
        router = router;
    }

    function setRouterV2(address _routerV2) external onlyDelegateAdmin {
        routerV2 = _routerV2;
    }

    function setPool(address _pool) external onlyDelegateAdmin {
        pool = _pool;
    }

    function setFactory(address _factory) external onlyDelegateAdmin {
        factory = _factory;
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
        IAerodromePool aerodromePool = IAerodromePool(pool);
        IAerodromeRouter aerodromeRouter = IAerodromeRouter(router);

        IAerodromeRouter.ExactInputSingleParams memory paramSwap = IAerodromeRouter.ExactInputSingleParams({
            tokenIn: address(tokenIn),
            tokenOut: address(tokenOut),
            tickSpacing: aerodromePool.tickSpacing(),
            recipient: msg.sender,
            deadline: block.timestamp + 5 seconds,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: uint160(0)
        });

        try aerodromeRouter.exactInputSingle(paramSwap) returns (uint256 _amountOut) {
            amountOut = _amountOut;
        } catch {
            revert SwapError();
        }
    }

    function _swapTokenUniswapV2(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address receiver
    )
        internal
        returns (uint256[] memory amountsOut)
    {
        IERC20(tokenIn).approve(routerV2, amountIn);
        IAerodromeRouter.Route[] memory routes = new IAerodromeRouter.Route[](1);
        routes[0] = IAerodromeRouter.Route(address(tokenIn), address(tokenOut), true, address(factory));
        //getAmount out from trade
        IAerodromeRouter aerodromeRouter = IAerodromeRouter(routerV2);
        uint256[] memory returnAmounts = aerodromeRouter.getAmountsOut(amountIn, routes);
        //call swap function
        uint256[] memory amounts =
            aerodromeRouter.swapExactTokensForTokens(amountIn, returnAmounts[1], routes, msg.sender, block.timestamp + 5 seconds);
        return amounts;
    }
}
