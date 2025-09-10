// SPDX-License-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.20;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {DefaultAccessControlEnumerable} from "../security/DefaultAccessControlEnumerable.sol";
import {MoneyFiStartegyUpgradeableBase} from "./abstracts/MoneyFiStartegyUpgradeableBase.sol";
import {IUniswapV2Router02} from "../interfaces/externals/uniswap/IUniswapV2Router02.sol";
import {IUniswapV2Pair} from "../interfaces/externals/uniswap/IUniswapV2Pair.sol";
import {IUniswapV2Factory} from "../interfaces/dex/IUniswapV2Factory.sol";
import {IMoneyFiStrategyUpgradeableUniswap} from "../interfaces/IMoneyFiStrategyUpgradeableUniswap.sol";

contract MoneyFiStrategyUpgradeableUniswap is
    MoneyFiStartegyUpgradeableBase,
    UUPSUpgradeable,
    IMoneyFiStrategyUpgradeableUniswap
{
    using Math for uint256;
    using SafeERC20 for ERC20;

    /*//////////////////////////////////////////////////////////////////////////
                                USER-FACING STORAGE
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Storage for Uniswap V2 contracts
    address public uniswapRouter;
    address public uniswapPair;
    address public token0;
    address public token1;
    address public quoteToken;
    address public baseToken;
    uint256 public slippageWhenSwapAsset;
    uint256 public minimumSwapAmount;

    /*//////////////////////////////////////////////////////////////////////////
                                    STRUCTS
    //////////////////////////////////////////////////////////////////////////*/

    struct InitializeParams {
        address admin;
        address baseToken;
        address quoteToken;
        address router;
        address crossChainRouter;
        address uniswapRouter;
        address uniswapFactory;
        uint256 slippageWhenSwapAsset;
        string name;
        string symbol;
    }

    /*//////////////////////////////////////////////////////////////////////////
                                    CONSTRUCTOR
    //////////////////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /*//////////////////////////////////////////////////////////////////////////
                                    INITIALIZER
    //////////////////////////////////////////////////////////////////////////*/

    function initialize(InitializeParams memory params) public initializer {
        __DefaultAccessControlEnumerable_init(params.admin);
        _MoneyFiStartegyUpgradeableBase_init(
            IERC20(params.baseToken), params.router, params.crossChainRouter, params.name, params.symbol
        );
        __UUPSUpgradeable_init();

        baseToken = params.baseToken;
        quoteToken = params.quoteToken;
        uniswapRouter = params.uniswapRouter;
        slippageWhenSwapAsset = params.slippageWhenSwapAsset;
        minimumSwapAmount = 1e16;

        // Set up Uniswap pair
        _setupUniswapPair(params.uniswapFactory, params.baseToken, params.quoteToken);

        // Approve tokens for Uniswap Router
        ERC20(params.baseToken).safeIncreaseAllowance(params.uniswapRouter, type(uint256).max);
        ERC20(params.quoteToken).safeIncreaseAllowance(params.uniswapRouter, type(uint256).max);
        ERC20(uniswapPair).safeIncreaseAllowance(params.uniswapRouter, type(uint256).max);
    }

    /*//////////////////////////////////////////////////////////////////////////
                            OVERRIDED CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    function _authorizeUpgrade(address newImplementation) internal override onlyDelegateAdmin {}

    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view override returns (uint256) {
        return assets.mulDiv(totalSupply() + 10 ** _decimalsOffset(), totalAssets() + 1, rounding);
    }

    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view override returns (uint256) {
        return shares.mulDiv(totalAssets() + 1, totalSupply() + 10 ** _decimalsOffset(), rounding);
    }

    function totalAssets() public view override returns (uint256) {
        uint256 baseTokenBalance = ERC20(baseToken).balanceOf(address(this));
        uint256 quoteTokenBalance = ERC20(quoteToken).balanceOf(address(this));
        uint256 lpBalance = IUniswapV2Pair(uniswapPair).balanceOf(address(this));

        if (lpBalance == 0) {
            return baseTokenBalance + _convertQuoteToBase(quoteTokenBalance);
        }

        (uint256 reserve0, uint256 reserve1,) = IUniswapV2Pair(uniswapPair).getReserves();
        uint256 totalSupply = IUniswapV2Pair(uniswapPair).totalSupply();
        (uint256 amount0, uint256 amount1) =
            (lpBalance.mulDiv(reserve0, totalSupply), lpBalance.mulDiv(reserve1, totalSupply));

        (uint256 baseAmount, uint256 quoteAmount) = token0 == baseToken ? (amount0, amount1) : (amount1, amount0);

        return baseAmount + _convertQuoteToBase(quoteAmount) + baseTokenBalance + _convertQuoteToBase(quoteTokenBalance);
    }

    function totalLiquidWhitelistPool() public view override returns (uint256 tvl) {
        (uint256 reserve0, uint256 reserve1,) = IUniswapV2Pair(uniswapPair).getReserves();
        tvl = ERC20(baseToken).balanceOf(address(uniswapPair))
            + _convertQuoteToBase(ERC20(quoteToken).balanceOf(address(uniswapPair)));
    }

    /*//////////////////////////////////////////////////////////////////////////
                            INTERNAL NON-CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    function beforeWithdraw(uint256 assets, uint256 shares, bytes memory)
        internal
        override
        returns (uint256 accruedAssets)
    {
        uint256 totalShares = totalSupply();
        uint256 lpBalance = IUniswapV2Pair(uniswapPair).balanceOf(address(this));
        uint256 depositorLP = lpBalance.mulDiv(shares, totalShares, Math.Rounding.Floor);

        if (depositorLP > 0) {
            (uint256 amount0, uint256 amount1) = _removeLiquidity(depositorLP);
            (uint256 baseAmount, uint256 quoteAmount) = token0 == baseToken ? (amount0, amount1) : (amount1, amount0);

            uint256 quoteBalance = ERC20(quoteToken).balanceOf(address(this));
            if (quoteBalance >= minimumSwapAmount) {
                uint256 expectedBaseOut = _getExpectedMinimumAmountOut(quoteBalance);
                baseAmount += _swapToken(quoteToken, baseToken, quoteBalance, expectedBaseOut);
            }

            accruedAssets =
                baseAmount + ERC20(baseToken).balanceOf(address(this)).mulDiv(shares, totalShares, Math.Rounding.Floor);
        } else {
            accruedAssets = ERC20(baseToken).balanceOf(address(this)).mulDiv(shares, totalShares, Math.Rounding.Floor);
        }
    }

    function afterDeposit(uint256 assets, uint256, bytes memory) internal override whenNotEmergencyStop {
        uint256 baseBalance = ERC20(baseToken).balanceOf(address(this));
        if (baseBalance >= minimumSwapAmount) {
            uint256 amountToSwap = baseBalance / 2;
            uint256 expectedQuoteOut = _getExpectedMinimumAmountOut(amountToSwap);
            uint256 quoteReceived = _swapToken(baseToken, quoteToken, amountToSwap, expectedQuoteOut);
            _addLiquidity(ERC20(baseToken).balanceOf(address(this)), quoteReceived);
        }
    }

    /*//////////////////////////////////////////////////////////////////////////
                                    EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    function emergencyWithdraw() external override onlyRouter {
        uint256 lpBalance = IUniswapV2Pair(uniswapPair).balanceOf(address(this));
        if (lpBalance > 0) {
            (uint256 amount0, uint256 amount1) = _removeLiquidity(lpBalance);
            (uint256 baseAmount, uint256 quoteAmount) = token0 == baseToken ? (amount0, amount1) : (amount1, amount0);

            uint256 quoteBalance = ERC20(quoteToken).balanceOf(address(this));
            if (quoteBalance >= minimumSwapAmount) {
                uint256 expectedBaseOut = _getExpectedMinimumAmountOut(quoteBalance);
                baseAmount += _swapToken(quoteToken, baseToken, quoteBalance, expectedBaseOut);
            }

            emit EmergencyWithdraw(address(uniswapPair), address(this), baseAmount, block.timestamp);
        }
        emergencyStop = true;
    }

    function setSlippageWhenSwapAsset(uint256 _slippageWhenSwapAsset) external onlyDelegateAdmin {
        slippageWhenSwapAsset = _slippageWhenSwapAsset;
    }

    function setMinimumSwapAmount(uint256 _minimumSwapAmount) external onlyDelegateAdmin {
        minimumSwapAmount = _minimumSwapAmount;
    }

    function isSupportUnderlyingAsset(address asset) public view override returns (bool) {
        return asset == baseToken;
    }

    /*//////////////////////////////////////////////////////////////////////////
                                HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    function _setupUniswapPair(address uniswapFactory_, address baseToken_, address quoteToken_) private {
        address pair = IUniswapV2Factory(uniswapFactory_).getPair(baseToken_, quoteToken_);
        if (pair == address(0)) {
            pair = IUniswapV2Factory(uniswapFactory_).createPair(baseToken_, quoteToken_);
        }
        uniswapPair = pair;
        (token0, token1) = baseToken_ < quoteToken_ ? (baseToken_, quoteToken_) : (quoteToken_, baseToken_);
    }

    function _addLiquidity(uint256 baseAmount, uint256 quoteAmount) private {
        (uint256 amountA, uint256 amountB,) = IUniswapV2Router02(uniswapRouter).addLiquidity(
            token0,
            token1,
            token0 == baseToken ? baseAmount : quoteAmount,
            token0 == baseToken ? quoteAmount : baseAmount,
            0,
            0,
            address(this),
            block.timestamp + 10 seconds
        );
    }

    function _removeLiquidity(uint256 lpAmount) private returns (uint256 amount0, uint256 amount1) {
        (amount0, amount1) = IUniswapV2Router02(uniswapRouter).removeLiquidity(
            token0, token1, lpAmount, 0, 0, address(this), block.timestamp + 10 seconds
        );
    }

    function _swapToken(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin)
        private
        returns (uint256)
    {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint256[] memory amounts = IUniswapV2Router02(uniswapRouter).swapExactTokensForTokens(
            amountIn, amountOutMin, path, address(this), block.timestamp + 10 seconds
        );
        return amounts[1];
    }

    function _convertQuoteToBase(uint256 quoteAmount) private view returns (uint256) {
        if (quoteAmount == 0) return 0;
        (uint256 reserve0, uint256 reserve1,) = IUniswapV2Pair(uniswapPair).getReserves();
        (uint256 baseReserve, uint256 quoteReserve) = token0 == baseToken ? (reserve0, reserve1) : (reserve1, reserve0);
        return IUniswapV2Router02(uniswapRouter).quote(quoteAmount, quoteReserve, baseReserve);
    }

    function _getExpectedMinimumAmountOut(uint256 amountIn) private view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = quoteToken;
        path[1] = baseToken;
        uint256[] memory amounts = IUniswapV2Router02(uniswapRouter).getAmountsOut(amountIn, path);
        return amounts[1].mulDiv(10_000 - slippageWhenSwapAsset, 10_000, Math.Rounding.Floor);
    }
}
