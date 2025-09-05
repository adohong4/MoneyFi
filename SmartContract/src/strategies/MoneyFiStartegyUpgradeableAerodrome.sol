// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.20;

import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Context } from "@openzeppelin/contracts/utils/Context.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { DefaultAccessControlEnumerable } from "../security/DefaultAccessControlEnumerable.sol";
import { MoneyFiStartegyUpgradeableBase } from "./abstracts/MoneyFiStartegyUpgradeableBase.sol";
import { IMoneyFiStartegyUpgradeableAerodrome } from "../interfaces/IMoneyFiStartegyUpgradeableAerodrome.sol";
import { INonfungiblePositionManagerAerodrome } from "../interfaces/externals/aerodrome/INonfungiblePositionManagerAerodrome.sol";
import { IAerodromeRouter } from "../interfaces/externals/aerodrome/IAerodromeRouter.sol";
import { IAerodromePool } from "../interfaces/externals/aerodrome/IAerodromePool.sol";
import { IAerodromeCLGauge } from "../interfaces/externals/aerodrome/IAerodromeCLGauge.sol";
import { LiquidityAmounts } from "../libraries/external/LiquidityAmounts.sol";
import { TickMath } from "../libraries/TickMath.sol";
import { SwapMath } from "../libraries/external/SwapMath.sol";
import { IAerodromeRouterV2 } from "../interfaces/dex/IAerodromeRouterV2.sol";
import { IAerodromePoolV2 } from "../interfaces/externals/aerodrome/IAeroDromePoolV2.sol";

contract MoneyFiStartegyUpgradeableAerodrome is
    MoneyFiStartegyUpgradeableBase,
    UUPSUpgradeable,
    IMoneyFiStartegyUpgradeableAerodrome
{
    using Math for uint256;
    using SafeERC20 for ERC20;

    /*//////////////////////////////////////////////////////////////////////////
                                USER-FACING STORAGE
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Storage for the Aerodrome contract
    INonfungiblePositionManagerAerodrome public positionManager;
    IAerodromePool private poolAerodrome;
    ERC20 private aeroDromeToken;
    IAerodromeCLGauge private aerodromeCLGauge;
    /// @dev qouteToken is usdc
    address private qouteToken;
    /// @dev baseToken is usdt
    address private baseToken;
    /// @dev tokenId represent strategey positon in Aerodrome
    uint256 public tokenId;
    /// @dev slippage when swap between baseToken and qouteToken
    /// @dev Min - 0.001% => 1
    /// @dev Max - 0.05 => 50
    ///@dev division: 100000
    uint256 private slippageWhenSwapAsset;
    /// @dev Only allow deposit and withdraw when setup
    // Minimum aerodrome swap amount to base token
    uint256 private minimumAerodromeSwap;
    // Minimum qoute token swap amount to base token
    uint256 private minimumQouteSwap;
    /*//////////////////////////////////////////////////////////////////////////
                                    CONSTRUCTOR
    //////////////////////////////////////////////////////////////////////////*/

    constructor() {
        _disableInitializers();
    }

    /// @dev Assume baseToken is underlying asset of strategy
    function initialize(
        address admin_,
        address baseToken_,
        address qouteToken_,
        address router_,
        address crossChainRouter_,
        uint256 slippageWhenSwapAsset_,
        string memory name_,
        string memory symbol_
    )
        public
        initializer
    {
        __DefaultAccessControlEnumerable_init(admin_);
        _MoneyFiStartegyUpgradeableBase_init(IERC20(baseToken_), router_, crossChainRouter_, name_, symbol_);
        __UUPSUpgradeable_init();

        qouteToken = qouteToken_;
        baseToken = baseToken_;
        slippageWhenSwapAsset = slippageWhenSwapAsset_;

        minimumAerodromeSwap = 1e16;
        minimumQouteSwap = 1e4;

        positionManager = INonfungiblePositionManagerAerodrome(0x827922686190790b37229fd06084350E74485b72);
        poolAerodrome = IAerodromePool(0xa41Bc0AFfbA7Fd420d186b84899d7ab2aC57fcD1);
        aeroDromeToken = ERC20(0x940181a94A35A4569E4529A3CDfB74e38FD98631);
        aerodromeCLGauge = IAerodromeCLGauge(0xBd85D45f1636fCEB2359d9Dcf839f12b3cF5AF3F);

        ERC20(qouteToken).safeIncreaseAllowance(address(0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5), type(uint256).max);
        ERC20(baseToken).safeIncreaseAllowance(address(0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5), type(uint256).max);
        ERC20(qouteToken).safeIncreaseAllowance(address(positionManager), type(uint256).max);
        ERC20(baseToken).safeIncreaseAllowance(address(positionManager), type(uint256).max);
        aeroDromeToken.safeIncreaseAllowance(address(0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43), type(uint256).max);
    }

    /// @dev Override _authorizeUpgrade function to add authorization
    function _authorizeUpgrade(address newImplementation) internal override onlyDelegateAdmin { }
    /*//////////////////////////////////////////////////////////////////////////
                        OVERRIDED CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Internal conversion function (from assets to shares) with support for rounding direction.
    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view override returns (uint256) {
        return assets.mulDiv(totalSupply() + 10 ** _decimalsOffset(), totalAssets() + 1, rounding);
    }

    /// @dev Internal conversion function (from shares to assets) with support for rounding direction.
    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view override returns (uint256) {
        return shares.mulDiv(totalAssets() + 1, totalSupply() + 10 ** _decimalsOffset(), rounding);
    }

    /// @dev See {IMoneyFiV1ERC4626-totalAssets}.
    function totalAssets() public view override returns (uint256) {
        uint256 qouteTokenBalance = ERC20(qouteToken).balanceOf(address(this));
        uint256 baseTokenBalance = ERC20(baseToken).balanceOf(address(this));
        (uint160 sqrtPriceX96,,,,,) = poolAerodrome.slot0();
        uint256 amountOutCalc = 0;

        if (tokenId > 0) {
            (uint256 currentTotalLiquidityAerodrome, int24 tickLower, int24 tickUpper) = getCurrentLiquidPositionAerodrome();

            (uint256 amount0, uint256 amount1) = LiquidityAmounts.getAmountsForLiquidity(
                sqrtPriceX96,
                TickMath.getSqrtRatioAtTick(tickLower),
                TickMath.getSqrtRatioAtTick(tickUpper),
                uint128(currentTotalLiquidityAerodrome)
            );

            // Compute next sqrt price and amountOut using SwapMath
            (,, amountOutCalc,) = SwapMath.computeSwapStep(
                uint160((uint256(1) << 192) / sqrtPriceX96),
                TickMath.MIN_SQRT_RATIO, // target to move as much as possible
                poolAerodrome.liquidity(),
                int256(amount0 + qouteTokenBalance),
                poolAerodrome.fee()
            );

            return amount1 + amountOutCalc + baseTokenBalance
                + IAerodromePoolV2(0x6cDcb1C4A4D1C3C6d054b27AC5B77e89eAFb971d).getAmountOut(
                    aeroDromeToken.balanceOf(address(this)), address(aeroDromeToken)
                );
        } else {
            return ERC20(qouteToken).balanceOf(address(this)) + ERC20(baseToken).balanceOf(address(this));
        }
    }

    /// @dev Return total liquidity of usdc/usdt pool in Aerodrome
    function totalLiquidWhitelistPool() public view override returns (uint256 tvl) {
        tvl = ERC20(qouteToken).balanceOf(address(poolAerodrome)) + ERC20(baseToken).balanceOf(address(poolAerodrome));
    }
    /*//////////////////////////////////////////////////////////////////////////
                            INTERNAL NON-CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    function beforeWithdraw(
        uint256,
        uint256 shares,
        bytes memory externalCallData
    )
        internal
        override
        returns (uint256 accruedAssets)
    {
        uint256 totalShare = totalSupply();

        (uint256 currentTotalLiquidityAerodrome,,) = getCurrentLiquidPositionAerodrome();

        if (currentTotalLiquidityAerodrome > 0 && tokenId > 0) {
            _withdrawClGauge(tokenId);

            (,, uint256 amount0Min, uint256 amount1Min) = _parseExternalCallData(externalCallData);

            {
                uint256 qouteBl = ERC20(qouteToken).balanceOf(address(this));
                uint256 baseBl = ERC20(baseToken).balanceOf(address(this));

                uint256 expectBaseTokenOutMin = _getExpectMinimumAmountOut(qouteBl, slippageWhenSwapAsset);

                uint256 actualbaseTokenOut = _swapTokenInAeroDrome(qouteToken, baseToken, qouteBl, expectBaseTokenOutMin);

                accruedAssets += actualbaseTokenOut.mulDiv(shares, totalShare, Math.Rounding.Floor);
                accruedAssets += baseBl.mulDiv(shares, totalShare, Math.Rounding.Floor);
            }

            uint256 preBaseTokenBl = ERC20(baseToken).balanceOf(address(this));

            _swapAeroDromeTokenToBaseToken();

            uint256 posBaseTokenBl = ERC20(baseToken).balanceOf(address(this));

            // Calculate liquidity Aero LP of user
            uint256 actualSharePerTotalLiquidityAerodrome =
                currentTotalLiquidityAerodrome.mulDiv(shares, totalShare, Math.Rounding.Floor);

            uint256 rewardUserBaseTokenAmount = (posBaseTokenBl - preBaseTokenBl).mulDiv(shares, totalShare, Math.Rounding.Floor);

            _removeAllLiquidInAeroDrome(tokenId, uint128(actualSharePerTotalLiquidityAerodrome), amount0Min, amount1Min);

            (uint256 actualAmount0Received, uint256 actualAmount1Received) = _collectAssetFromAeroDrome(tokenId);

            uint256 expectAmount1OutMinimum = _getExpectMinimumAmountOut(actualAmount1Received, slippageWhenSwapAsset);

            // Swap qouteToken to baseToken
            uint256 actualAmount1OutRecieved =
                _swapTokenInAeroDrome(qouteToken, baseToken, actualAmount1Received, expectAmount1OutMinimum);

            accruedAssets += actualAmount0Received + actualAmount1OutRecieved + rewardUserBaseTokenAmount;

            (currentTotalLiquidityAerodrome,,) = getCurrentLiquidPositionAerodrome();

            if (currentTotalLiquidityAerodrome == 0) {
                tokenId = 0;
            } else {
                _depositNftToCLGauge(tokenId);
            }
        }
    }

    /// @dev Internal hook executed after a deposit, updating cumulative deposit count and deposit into external protocol
    /// @param assets The amount of assets being deposited.
    function afterDeposit(uint256 assets, uint256, bytes memory externalCallData) internal override whenNotEmergencyStop {
        uint256 baseTokenBl = ERC20(baseToken).balanceOf(address(this));

        uint256 expectAmount0ToAdd = baseTokenBl / 2;
        uint256 expectAmount1OutMinimum = _getExpectMinimumAmountOut(expectAmount0ToAdd, slippageWhenSwapAsset);

        // Swap baseTokenof strategy to qouteToken and baseToken
        _swapTokenInAeroDrome(baseToken, qouteToken, expectAmount0ToAdd, expectAmount1OutMinimum);

        (uint256 currentTotalLiquidityAerodrome, int24 curTickLower, int24 curtTickUpper) = getCurrentLiquidPositionAerodrome();

        (int24 newTickLower, int24 newTickUpper, uint256 amount0Min, uint256 amount1Min) =
            _parseExternalCallData(externalCallData);

        // Check if current total liquidity in Aerodrome is equal to 0, if so, add new position
        // and set tokenId to new position id
        if (currentTotalLiquidityAerodrome == 0) {
            if (newTickLower == 0 && newTickUpper == 0) {
                revert InvalidTickValue();
            }
            _addNewPositionToAeroDrome(
                newTickLower,
                newTickUpper,
                ERC20(baseToken).balanceOf(address(this)),
                ERC20(qouteToken).balanceOf(address(this)),
                amount0Min,
                amount1Min
            );
        }

        // Check if current total liquidity in Aerodrome is greater than 0 and tokenId is exist
        if (currentTotalLiquidityAerodrome != 0 && tokenId != 0) {
            _withdrawClGauge(tokenId);
            // Check if current tick value is not change
            if ((newTickLower == 0 && newTickUpper == 0) || (curTickLower == newTickLower && curtTickUpper == newTickUpper)) {
                _addNewLiquidToAerodrome(
                    tokenId,
                    ERC20(qouteToken).balanceOf(address(this)),
                    ERC20(baseToken).balanceOf(address(this)),
                    amount0Min,
                    amount1Min
                );
            } else {
                _removeAllLiquidInAeroDrome(tokenId, uint128(currentTotalLiquidityAerodrome), 0, 0);
                _collectAssetFromAeroDrome(tokenId);
                _addNewPositionToAeroDrome(
                    newTickLower,
                    newTickUpper,
                    ERC20(baseToken).balanceOf(address(this)),
                    ERC20(qouteToken).balanceOf(address(this)),
                    amount0Min,
                    amount1Min
                );
            }
        }
        _depositNftToCLGauge(tokenId);
    }

    /// @dev Allow receive ERC721 token when init new position in Aerodrome
    function onERC721Received(address, address, uint256, bytes memory) public returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /// @dev Set slippageWhenSwapAsset from qouteToken to baseToken ( usdc => usdt)
    function setSlippageWhenSwapAsset(uint256 _slippageWhenSwapAsset) public onlyDelegateAdmin {
        slippageWhenSwapAsset = _slippageWhenSwapAsset;
    }

    /// @dev Set new minimum aerodrome swap amount
    function setMinimumAerodromeSwap(uint256 _minimumAerodromeSwap, uint256 _minimumQouteSwap) external onlyDelegateAdmin {
        minimumAerodromeSwap = _minimumAerodromeSwap;
        minimumQouteSwap = _minimumQouteSwap;
    }

    /// @dev Get current liquid position in Aerodrome
    function getCurrentLiquidPositionAerodrome() public view returns (uint128, int24, int24) {
        if (tokenId == 0) {
            return (0, 0, 0);
        }

        try positionManager.positions(tokenId) returns (
            uint96,
            address,
            address,
            address,
            int24,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            uint256,
            uint256,
            uint128,
            uint128
        ) {
            return (liquidity, tickLower, tickUpper);
        } catch {
            return (0, 0, 0);
        }
    }

    /// @dev Get current underlying asset
    function isSupportUnderlyingAsset(address asset) public view override returns (bool) {
        return baseToken == asset ? true : false;
    }

    /// @dev Need to implement in the future
    function emergencyWithdraw() external override onlyRouter { }

    /// @dev Add new position to AeroDrome
    function _addNewPositionToAeroDrome(
        int24 _newTickLower,
        int24 _newTickUpper,
        uint256 _baseTokenBalance,
        uint256 _qouteTokenBalance,
        uint256 _amount0Min,
        uint256 _amount1Min
    )
        internal
        returns (uint256 newTokenId, uint128 liquidityMint, uint256 amount0, uint256 amount1)
    {
        INonfungiblePositionManagerAerodrome.MintParams memory paramsMint = INonfungiblePositionManagerAerodrome.MintParams({
            token0: address(baseToken),
            token1: address(qouteToken),
            tickSpacing: poolAerodrome.tickSpacing(),
            tickLower: _newTickLower,
            tickUpper: _newTickUpper,
            amount0Desired: _baseTokenBalance,
            amount1Desired: _qouteTokenBalance,
            amount0Min: _amount0Min,
            amount1Min: _amount1Min,
            recipient: address(this),
            deadline: block.timestamp + 5 seconds,
            sqrtPriceX96: 0
        });

        (newTokenId, liquidityMint, amount0, amount1) = positionManager.mint(paramsMint);

        tokenId = newTokenId;
    }

    /// @dev Remove all liquidity in AeroDrome
    function _removeAllLiquidInAeroDrome(
        uint256 _tokenId,
        uint128 _liquidity,
        uint256 _amount0Min,
        uint256 _amount1Min
    )
        internal
        returns (uint256 amount0, uint256 amount1)
    {
        try positionManager.decreaseLiquidity(
            INonfungiblePositionManagerAerodrome.DecreaseLiquidityParams({
                tokenId: _tokenId,
                liquidity: _liquidity,
                amount0Min: _amount0Min,
                amount1Min: _amount1Min,
                deadline: block.timestamp + 5 seconds
            })
        ) returns (uint256 _amount0, uint256 _amount1) {
            amount0 = _amount0;
            amount1 = _amount1;
        } catch {
            revert CanNotRemoveLiquidInAeroDrome();
        }
    }

    /*//////////////////////////////////////////////////////////////////////////
                                INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Claim all reward from AeroDrome
    function _collectAssetFromAeroDrome(uint256 _tokenId) internal returns (uint256 amount0, uint256 amount1) {
        INonfungiblePositionManagerAerodrome.CollectParams memory paramsCollect = INonfungiblePositionManagerAerodrome
            .CollectParams({
            tokenId: _tokenId,
            recipient: address(this),
            amount0Max: type(uint128).max,
            amount1Max: type(uint128).max
        });

        /// Connect if exist
        try positionManager.collect(paramsCollect) returns (uint256 _amount0, uint256 _amount1) {
            amount0 = _amount0;
            amount1 = _amount1;
        } catch {
            revert CanNotCollectRewardFromAerodrome();
        }
    }

    /// @dev Increase new liquidity in Aerodrome
    function _addNewLiquidToAerodrome(
        uint256 _tokenId,
        uint256 _qouteTokenBalance,
        uint256 _baseTokenBalance,
        uint256 _amount0Min,
        uint256 _amount1Min
    )
        internal
        returns (uint128 liquidity, uint256 amount0, uint256 amount1)
    {
        // Add new liquidity in Aerodrome
        INonfungiblePositionManagerAerodrome.IncreaseLiquidityParams memory paramsIncreaseLiquidity =
        INonfungiblePositionManagerAerodrome.IncreaseLiquidityParams({
            tokenId: _tokenId,
            amount0Desired: _baseTokenBalance,
            amount1Desired: _qouteTokenBalance,
            amount0Min: _amount0Min,
            amount1Min: _amount1Min,
            deadline: block.timestamp + 5 seconds
        });

        try positionManager.increaseLiquidity(paramsIncreaseLiquidity) { }
        catch {
            revert CanNotAddNewLiquidToAerodrome();
        }
    }

    /// @dev Swap token in AeroDrome
    /// @dev Swap baseToken to qouteToken
    function _swapTokenInAeroDrome(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _amountOutMinimum
    )
        internal
        returns (uint256 amountOut)
    {
        if (_amountIn >= minimumQouteSwap) {
            IAerodromeRouter.ExactInputSingleParams memory paramSwap = IAerodromeRouter.ExactInputSingleParams({
                tokenIn: address(_tokenIn),
                tokenOut: address(_tokenOut),
                tickSpacing: poolAerodrome.tickSpacing(),
                recipient: address(this),
                deadline: block.timestamp + 5 seconds,
                amountIn: _amountIn,
                amountOutMinimum: _amountOutMinimum,
                sqrtPriceLimitX96: 0
            });

            try IAerodromeRouter(0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5).exactInputSingle(paramSwap) returns (
                uint256 _amountOut
            ) {
                amountOut = _amountOut;
            } catch {
                revert CanNotSwapInAeroDrome(_amountIn, _amountOutMinimum);
            }
        }
    }

    /// @dev Deposit NFT to CL Gauge
    function _depositNftToCLGauge(uint256 _tokenId) internal {
        positionManager.approve(address(aerodromeCLGauge), _tokenId);
        aerodromeCLGauge.deposit(_tokenId);
    }

    /// @dev Withdraw NFT from CL Gauge
    function _withdrawClGauge(uint256 _tokenId) internal {
        aerodromeCLGauge.withdraw(_tokenId);
    }

    /// @dev Get expect minimum amount out when swap asset
    function _getExpectMinimumAmountOut(
        uint256 _amountIn,
        uint256 _slippageWhenSwapAsset
    )
        internal
        pure
        returns (uint256 expectAmountOutMinimum)
    {
        expectAmountOutMinimum = _amountIn.mulDiv(10_000 - _slippageWhenSwapAsset, 10_000, Math.Rounding.Floor);
    }

    /// @dev Parse external call data to get new tick lower, new tick upper, amount0Min, amount1Min
    function _parseExternalCallData(bytes memory externalCallData)
        internal
        pure
        returns (int24 newTickLower, int24 newTickUpper, uint256 amount0Min, uint256 amount1Min)
    {
        if (externalCallData.length > 0) {
            (newTickLower, newTickUpper, amount0Min, amount1Min) = abi.decode(externalCallData, (int24, int24, uint256, uint256));
        } else {
            newTickLower = 0;
            newTickUpper = 0;
            amount0Min = 0;
            amount1Min = 0;
        }
    }

    /// @dev Swap AeroDrome token to base token
    function _swapAeroDromeTokenToBaseToken() internal {
        uint256 aeroDromeBL = aeroDromeToken.balanceOf(address(this));

        if (aeroDromeBL >= minimumAerodromeSwap) {
            IAerodromeRouterV2.Route[] memory routesAeroDromeRouterV2Params = new IAerodromeRouterV2.Route[](1);
            routesAeroDromeRouterV2Params[0] = IAerodromeRouterV2.Route({
                from: address(aeroDromeToken),
                to: baseToken,
                stable: false,
                factory: 0x420DD381b31aEf6683db6B902084cB0FFECe40Da
            });

            IAerodromeRouterV2(0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43).swapExactTokensForTokens(
                aeroDromeBL, 0, routesAeroDromeRouterV2Params, address(this), block.timestamp + 5 seconds
            );
        }
    }
}
