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

    address public override uniswapRouter;
    address public uniswapFactory;
    address public override uniswapPair;
    address public override token0;
    address public override token1;
    address public override quoteToken;
    address public override baseToken;
    uint256 public override slippageWhenSwapAsset;
    uint256 public override minimumSwapAmount;

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
        uint256 minimumSwapAmount;
        string name;
        string symbol;
    }

    /*//////////////////////////////////////////////////////////////////////////
                                    EVENT
    //////////////////////////////////////////////////////////////////////////*/

    event DebugAfterDeposit(uint256 baseBalance, uint256 amountToSwap, uint256 expectedQuoteOut, uint256 quoteReceived);
    event DebugSwap(uint256 amountIn, uint256 amountOut, string action);
    event DebugAddLiquidity(uint256 baseAmount, uint256 quoteAmount, uint256 amountA, uint256 amountB);

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
        // Gọi initializer theo đúng thứ tự kế thừa
        __DefaultAccessControlEnumerable_init(params.admin);
        _MoneyFiStartegyUpgradeableBase_init(
            IERC20(params.baseToken), params.router, params.crossChainRouter, params.name, params.symbol
        );
        __UUPSUpgradeable_init();

        baseToken = params.baseToken;
        quoteToken = params.quoteToken;
        uniswapRouter = params.uniswapRouter;
        uniswapFactory = params.uniswapFactory;
        slippageWhenSwapAsset = params.slippageWhenSwapAsset;
        minimumSwapAmount = params.minimumSwapAmount;

        // Approve max tokens for Uniswap Router
        ERC20(params.baseToken).safeIncreaseAllowance(params.uniswapRouter, type(uint256).max);
        ERC20(params.quoteToken).safeIncreaseAllowance(params.uniswapRouter, type(uint256).max);
        address pair = IUniswapV2Factory(params.uniswapFactory).getPair(params.baseToken, params.quoteToken);
        if (pair == address(0)) {
            revert InvalidPair();
        }
        uniswapPair = pair;
        (token0, token1) = params.baseToken < params.quoteToken
            ? (params.baseToken, params.quoteToken)
            : (params.quoteToken, params.baseToken);
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
        uint256 baseBalance = ERC20(baseToken).balanceOf(address(this));
        uint256 lpBalance = ERC20(uniswapPair).balanceOf(address(this));

        if (lpBalance == 0) {
            return baseBalance;
        }

        // Lấy reserves của pool
        (uint256 reserve0, uint256 reserve1,) = IUniswapV2Pair(uniswapPair).getReserves();
        uint256 baseReserve = token0 == baseToken ? reserve0 : reserve1;
        uint256 quoteReserve = token0 == baseToken ? reserve1 : reserve0;

        // Tính tổng supply LP token
        uint256 totalLpSupply = ERC20(uniswapPair).totalSupply();

        // Tính giá trị baseToken từ LP token
        uint256 lpBaseValue = lpBalance.mulDiv(baseReserve, totalLpSupply, Math.Rounding.Floor);

        // Tính giá trị quoteToken từ LP token và chuyển đổi sang baseToken
        uint256 lpQuoteValue = lpBalance.mulDiv(quoteReserve, totalLpSupply, Math.Rounding.Floor);
        uint256 quoteToBase = lpQuoteValue > 0 ? _getExpectedMinimumAmountOut(lpQuoteValue) : 0;

        return baseBalance + lpBaseValue + quoteToBase;
    }

    function totalLiquidWhitelistPool() external view override returns (uint256 tvl) {
        (uint256 reserve0, uint256 reserve1,) = IUniswapV2Pair(uniswapPair).getReserves();
        uint256 baseReserve = token0 == baseToken ? reserve0 : reserve1;
        uint256 quoteReserve = token0 == baseToken ? reserve1 : reserve0;

        // Chuyển đổi quoteReserve sang baseToken
        uint256 quoteToBase = quoteReserve > 0 ? _getExpectedMinimumAmountOut(quoteReserve) : 0;

        tvl = baseReserve + quoteToBase; // Tổng giá trị ở baseToken decimals
    }

    /*//////////////////////////////////////////////////////////////////////////
                            INTERNAL NON-CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    function beforeWithdraw(uint256 assets, uint256 shares, bytes memory)
        internal
        override
        returns (uint256 accruedAssets)
    {
        uint256 strategyLpBalance = ERC20(uniswapPair).balanceOf(address(this));
        uint256 depositorLP = strategyLpBalance.mulDiv(shares, totalSupply(), Math.Rounding.Floor);

        (uint256 amount0, uint256 amount1) = IUniswapV2Router02(uniswapRouter).removeLiquidity(
            token0, token1, depositorLP, 0, 0, address(this), block.timestamp + 30
        );

        uint256 baseReceived = token0 == baseToken ? amount0 : amount1;
        uint256 quoteReceived = token0 == baseToken ? amount1 : amount0;

        if (quoteReceived > 0) {
            address[] memory path = new address[](2);
            path[0] = quoteToken;
            path[1] = baseToken;
            uint256 amountOutMin = _getExpectedMinimumAmountOut(quoteReceived);
            uint256[] memory amounts = IUniswapV2Router02(uniswapRouter).swapExactTokensForTokens(
                quoteReceived, amountOutMin, path, address(this), block.timestamp + 30
            );
            baseReceived += amounts[1];
        }

        accruedAssets = baseReceived;
    }

    function afterDeposit(uint256 assets, uint256, bytes memory) internal override whenNotEmergencyStop {
        uint256 baseBalance = ERC20(baseToken).balanceOf(address(this));
        emit DebugAfterDeposit(baseBalance, 0, 0, 0);

        if (baseBalance >= minimumSwapAmount) {
            uint256 amountToSwap = baseBalance / 2;
            uint256 expectedQuoteOut = _getExpectedMinimumAmountOut(amountToSwap);
            emit DebugAfterDeposit(baseBalance, amountToSwap, expectedQuoteOut, 0);

            uint256 quoteReceived = _swapToken(baseToken, quoteToken, amountToSwap, expectedQuoteOut);
            emit DebugSwap(amountToSwap, quoteReceived, "swap after deposit");

            uint256 remainingBase = ERC20(baseToken).balanceOf(address(this));
            emit DebugAfterDeposit(baseBalance, amountToSwap, expectedQuoteOut, quoteReceived);

            _addLiquidity(remainingBase, quoteReceived);
        } else {
            emit DebugAfterDeposit(baseBalance, 0, 0, 0);
        }
    }

    /*//////////////////////////////////////////////////////////////////////////
                                HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    function _getExpectedMinimumAmountOut(uint256 amountIn) private view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = quoteToken;
        path[1] = baseToken;
        uint256[] memory amounts = IUniswapV2Router02(uniswapRouter).getAmountsOut(amountIn, path);
        return amounts[1].mulDiv(10_000 - slippageWhenSwapAsset, 10_000, Math.Rounding.Floor);
    }

    function _swapToken(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin)
        private
        returns (uint256)
    {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        try IUniswapV2Router02(uniswapRouter).swapExactTokensForTokens(
            amountIn, amountOutMin, path, address(this), block.timestamp + 30
        ) returns (uint256[] memory amounts) {
            emit DebugSwap(amountIn, amounts[1], "Swap executed");
            return amounts[1];
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("Swap failed: ", reason)));
        } catch {
            revert("Swap failed: Unknown error");
        }
    }

    function _addLiquidity(uint256 baseAmount, uint256 quoteAmount) private {
        emit DebugAddLiquidity(baseAmount, quoteAmount, 0, 0);
        try IUniswapV2Router02(uniswapRouter).addLiquidity(
            token0,
            token1,
            token0 == baseToken ? baseAmount : quoteAmount,
            token0 == baseToken ? quoteAmount : baseAmount,
            0,
            0,
            address(this),
            block.timestamp + 30
        ) returns (uint256 amountA, uint256 amountB, uint256) {
            emit DebugAddLiquidity(baseAmount, quoteAmount, amountA, amountB);
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("Add liquidity failed: ", reason)));
        } catch {
            revert("Add liquidity failed: Unknown error");
        }
    }

    /*//////////////////////////////////////////////////////////////////////////
                                    EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    function setSlippageWhenSwapAsset(uint256 _slippageWhenSwapAsset) external override onlyDelegateAdmin {
        slippageWhenSwapAsset = _slippageWhenSwapAsset;
    }

    function setMinimumSwapAmount(uint256 _minimumSwapAmount) external override onlyDelegateAdmin {
        minimumSwapAmount = _minimumSwapAmount;
    }

    function isSupportUnderlyingAsset(address asset) external view override returns (bool) {
        return asset == address(ASSET);
    }

    function emergencyWithdraw() external override onlyRouter whenNotEmergencyStop {
        uint256 strategyLpBalance = ERC20(uniswapPair).balanceOf(address(this));
        uint256 beforeEmergencyWithdraw = ERC20(baseToken).balanceOf(address(this));

        (uint256 amount0, uint256 amount1) = IUniswapV2Router02(uniswapRouter).removeLiquidity(
            token0, token1, strategyLpBalance, 0, 0, address(this), block.timestamp + 30
        );

        uint256 baseReceived = token0 == baseToken ? amount0 : amount1;
        uint256 quoteReceived = token0 == baseToken ? amount1 : amount0;

        if (quoteReceived > 0) {
            address[] memory path = new address[](2);
            path[0] = quoteToken;
            path[1] = baseToken;
            uint256 amountOutMin = _getExpectedMinimumAmountOut(quoteReceived);
            uint256[] memory amounts = IUniswapV2Router02(uniswapRouter).swapExactTokensForTokens(
                quoteReceived, amountOutMin, path, address(this), block.timestamp + 30
            );
            baseReceived += amounts[1];
        }

        uint256 afterEmergencyWithdraw = ERC20(baseToken).balanceOf(address(this));
        uint256 withdrawAmount = afterEmergencyWithdraw - beforeEmergencyWithdraw;

        emergencyStop = true;
        emit EmergencyWithdraw(address(uniswapPair), address(this), withdrawAmount, block.timestamp);
    }
}
