// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.20;

import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { DefaultAccessControlEnumerable } from "../security/DefaultAccessControlEnumerable.sol";
import { MoneyFiStartegyUpgradeableBase } from "./abstracts/MoneyFiStartegyUpgradeableBase.sol";
import { IBatchRouter } from "../interfaces/externals/balancer/IBatchRouter.sol";
import { IPermit2 } from "../interfaces/externals/balancer/IPermit2.sol";
import { ICompositeLiquidityRouter } from "../interfaces/externals/balancer/ICompositeLiquidityRouter.sol";
import { IAllowanceTransfer } from "../interfaces/externals/balancer/IAllowanceTransfer.sol";
import { IIncentiveGauge } from "../interfaces/externals/balancer/IIncentiveGauge.sol";
import { IPool } from "../interfaces/externals/balancer/IPool.sol";
import { IPoolV2 } from "../interfaces/externals/balancer/IPoolV2.sol";
import { IPoolBALUSDC } from "../interfaces/externals/balancer/IPoolBALUSDC.sol";
import { IAsset } from "../interfaces/externals/balancer/IAsset.sol";
import "../interfaces/externals/balancer/VaultTypes.sol";
import { IVaultExplorer } from "../interfaces/externals/balancer/IVaultExplorer.sol";
import { ScalingHelpers } from "../libraries/external/ScalingHelpers.sol";
import { FixedPoint } from "../libraries/external/FixedPoint.sol";
import { WeightedMath } from "../libraries/external/WeightedMath.sol";
import { IMoneyFiStartegyUpgradeableBalancer } from "../interfaces/IMoneyFiStartegyUpgradeableBalancer.sol";

contract MoneyFiStrategyUpgradeableBalancer is
    MoneyFiStartegyUpgradeableBase,
    UUPSUpgradeable,
    IMoneyFiStartegyUpgradeableBalancer
{
    using Math for uint256;
    using SafeERC20 for ERC20;
    using ScalingHelpers for *;
    using FixedPoint for uint256;

    /*//////////////////////////////////////////////////////////////////////////
                                USER-FACING STORAGE
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Storage for the Balancer contract
    address private balancerRouter;
    address private balancerPool;
    address private incentiveGauge;
    address private rewardToken;
    address private wrappedUSDC;
    address private wrappedGHO;
    address private BAL;
    address private swapRouter;
    address private swapRouterV2;
    address private balancerExplorer;
    address private balancerBALUSDCPool;
    bytes32 private constant POOL_ID_V2 = 0xb328b50f1f7d97ee8ea391ab5096dd7657555f49000100000000000000000048;
    uint256 private constant SWAPABLE_AMOUNT = 1e16;

    uint256 private totalDepositedAsset;
    uint256 private slippageWhenSwapAsset;

    /*//////////////////////////////////////////////////////////////////////////
                                     CONSTRUCTOR
    //////////////////////////////////////////////////////////////////////////*/

    constructor() {
        _disableInitializers();
    }

    /*//////////////////////////////////////////////////////////////////////////
                                     MODIFIER
    //////////////////////////////////////////////////////////////////////////*/

    function initialize(
        address admin_,
        address asset_,
        address router_,
        address crossChainRouter_,
        string memory name_,
        string memory symbol_
    )
        public
        initializer
    {
        __DefaultAccessControlEnumerable_init(admin_);
        _MoneyFiStartegyUpgradeableBase_init(ERC20(asset_), router_, crossChainRouter_, name_, symbol_);
        __UUPSUpgradeable_init();

        balancerRouter = 0x9dA18982a33FD0c7051B19F0d7C76F2d5E7e017c;
        balancerPool = 0x7AB124EC4029316c2A42F713828ddf2a192B36db;
        incentiveGauge = 0x70DB188E5953f67a4B16979a2ceA26248b315401;
        rewardToken = 0x6Bb7a212910682DCFdbd5BCBb3e28FB4E8da10Ee;
        wrappedUSDC = 0xC768c589647798a6EE01A91FdE98EF2ed046DBD6;
        wrappedGHO = 0x88b1Cd4b430D95b406E382C3cDBaE54697a0286E;
        BAL = 0x4158734D47Fc9692176B5085E0F52ee0Da5d47F1;
        swapRouter = 0x85a80afee867aDf27B50BdB7b76DA70f1E853062;
        swapRouterV2 = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;
        balancerExplorer = 0xaD89051bEd8d96f045E8912aE1672c6C0bF8a85E;
        balancerBALUSDCPool = 0x433f09ca08623E48BAc7128B7105De678E37D988;

        slippageWhenSwapAsset = 200;

        ERC20(asset_).safeIncreaseAllowance(address(0x7AB124EC4029316c2A42F713828ddf2a192B36db), type(uint256).max);
        ERC20(asset_).safeIncreaseAllowance(address(0x9dA18982a33FD0c7051B19F0d7C76F2d5E7e017c), type(uint256).max);
        ERC20(asset_).safeIncreaseAllowance(address(0x000000000022D473030F116dDEE9F6B43aC78BA3), type(uint256).max);
        ERC20(0x4158734D47Fc9692176B5085E0F52ee0Da5d47F1).approve(0xBA12222222228d8Ba445958a75a0704d566BF2C8, type(uint256).max);
        ERC20(0x7AB124EC4029316c2A42F713828ddf2a192B36db).approve(
            address(0x9dA18982a33FD0c7051B19F0d7C76F2d5E7e017c), type(uint256).max
        );
        ERC20(0x7AB124EC4029316c2A42F713828ddf2a192B36db).approve(
            address(0x70DB188E5953f67a4B16979a2ceA26248b315401), type(uint256).max
        );
        ERC20(0x6Bb7a212910682DCFdbd5BCBb3e28FB4E8da10Ee).approve(0x000000000022D473030F116dDEE9F6B43aC78BA3, type(uint256).max);
        IAllowanceTransfer(0x000000000022D473030F116dDEE9F6B43aC78BA3).approve(
            asset_, address(0x9dA18982a33FD0c7051B19F0d7C76F2d5E7e017c), type(uint160).max, type(uint48).max
        );
        IAllowanceTransfer(0x000000000022D473030F116dDEE9F6B43aC78BA3).approve(
            0x6Bb7a212910682DCFdbd5BCBb3e28FB4E8da10Ee,
            0x85a80afee867aDf27B50BdB7b76DA70f1E853062,
            type(uint160).max,
            type(uint48).max
        );
    }

    /// @dev Override _authorizeUpgrade function to add authorization
    function _authorizeUpgrade(address newImplementation) internal override onlyDelegateAdmin { }
    /*//////////////////////////////////////////////////////////////////////////
                            OVERRIDED CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Internal conversion function (from assets to shares) with support for rounding direction.
    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view override returns (uint256) {
        if (address(balancerPool) != address(0)) {
            return assets.mulDiv(totalSupply() + 10 ** _decimalsOffset(), totalAssets() + 1, rounding);
        } else {
            return super._convertToShares(assets, rounding);
        }
    }

    /// @dev Internal conversion function (from shares to assets) with support for rounding direction.
    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view override returns (uint256) {
        if (address(balancerPool) != address(0)) {
            return shares.mulDiv(totalAssets() + 1, totalSupply() + 10 ** _decimalsOffset(), rounding);
        } else {
            return super._convertToAssets(shares, rounding);
        }
    }

    /// @dev See {IDiracV1ERC4626-totalAssets}.
    function totalAssets() public view override returns (uint256) {
        return ASSET.balanceOf(address(this)) + totalDepositedAsset + claimableRewardFromBalancer();
    }

    function totalLiquidWhitelistPool() external view override returns (uint256 tvl) {
        uint256[] memory res = IPool(balancerPool).getCurrentLiveBalances();
        tvl = res[0] + res[1];
    }

    /*//////////////////////////////////////////////////////////////////////////
                            INTERNAL NON-CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Internal hook executed before a withdrawal, updating cumulative withdrawal count and deposit into external protocol
    /// @param assets The amount of assets being withdrawn.
    function beforeWithdraw(uint256 assets, uint256 shares, bytes memory) internal override returns (uint256 accruedAssets) {
        if (address(balancerPool) != address(0)) {
            uint256 usdcPendingReward = claimRewardFromBalancer();

            uint256 strategyLpBalance = IIncentiveGauge(incentiveGauge).balanceOf(address(this));

            uint256 depositorLPInBalancer = strategyLpBalance.mulDiv(shares, totalSupply(), Math.Rounding.Floor);

            IIncentiveGauge(incentiveGauge).withdraw(depositorLPInBalancer);

            uint256 lpAfterUnstakeFromBalancer = IPool(balancerPool).balanceOf(address(this));

            (, uint256[] memory amountsOut) = removeLiquidity(lpAfterUnstakeFromBalancer);

            uint256 usdcAfterWithdraw = amountsOut[1];
            uint256 ghoAfterWithdraw = amountsOut[0];

            uint256 usdcSwappedFromGHOWithdraw = swapGHOtoUSDC(ghoAfterWithdraw);

            uint256 pendingRewardDepositor = usdcPendingReward.mulDiv(shares, totalSupply(), Math.Rounding.Floor);

            uint256 remainReward = usdcPendingReward - pendingRewardDepositor;

            accruedAssets = usdcSwappedFromGHOWithdraw + usdcAfterWithdraw + pendingRewardDepositor;

            if (usdcAfterWithdraw + usdcSwappedFromGHOWithdraw > totalDepositedAsset + remainReward) {
                totalDepositedAsset = remainReward;
            } else {
                totalDepositedAsset = totalDepositedAsset - usdcAfterWithdraw - usdcSwappedFromGHOWithdraw + remainReward;
            }
            if (remainReward > 0) {
                addLiquidity(remainReward);
            }
        } else {
            accruedAssets = assets;
        }
    }

    /// @dev Internal hook executed after a deposit, updating cumulative deposit count and deposit into external protocol
    /// @param assets The amount of assets being deposited.
    function afterDeposit(uint256 assets, uint256, bytes memory) internal override whenNotEmergencyStop {
        if (address(balancerPool) != address(0)) {
            uint256 actualDeposit = assets + claimRewardFromBalancer();
            totalDepositedAsset += actualDeposit;
            if (actualDeposit > 0) {
                addLiquidity(actualDeposit);
            }
        }
    }

    /*//////////////////////////////////////////////////////////////////////////
                                    EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @notice Executes an emergency withdrawal of funds from the strategy.
    /// @dev This function can only be called by the router when the emergency stop is not active.
    ///      It performs the following steps:
    ///      1. Claims pending USDC rewards from the Balancer.
    ///      2. Retrieves the strategy's LP token balance from the incentive gauge.
    ///      3. Withdraws the LP tokens from the incentive gauge.
    ///      4. Removes liquidity from the Balancer pool using the withdrawn LP tokens.
    ///      5. Swaps the withdrawn GHO tokens to USDC.
    ///      6. Calculates the total USDC amount from the withdrawal and rewards.
    ///      7. Activates the emergency stop for the strategy.
    ///      8. Emits an `EmergencyWithdraw` event with details of the withdrawal.
    /// @notice This function is intended to safeguard funds in case of an emergency.
    function emergencyWithdraw() external override onlyRouter {
        uint256 usdcPendingReward = claimRewardFromBalancer();
        uint256 strategyLpBalance = IIncentiveGauge(incentiveGauge).balanceOf(address(this));

        IIncentiveGauge(incentiveGauge).withdraw(strategyLpBalance);

        uint256 lpAfterUnstakeFromBalancer = IPool(balancerPool).balanceOf(address(this));

        (, uint256[] memory amountsOut) = removeLiquidity(lpAfterUnstakeFromBalancer);

        uint256 usdcAfterWithdraw = amountsOut[1];
        uint256 ghoAfterWithdraw = amountsOut[0];

        uint256 usdcSwappedFromGHOWithdraw = swapGHOtoUSDC(ghoAfterWithdraw);

        emergencyStop = true;
        emit EmergencyWithdraw(
            address(balancerPool),
            address(this),
            usdcAfterWithdraw + usdcSwappedFromGHOWithdraw + usdcPendingReward,
            block.timestamp
        );
    }

    // /// @dev Set slippageWhenSwapAsset from qouteToken to baseToken ( GHO => USDC)
    function setSlippageWhenSwapAsset(uint256 _slippageWhenSwapAsset) external onlyDelegateAdmin {
        slippageWhenSwapAsset = _slippageWhenSwapAsset;
    }

    /// @dev See {IMoneyFiStartegyUpgradeableBase}.
    function isSupportUnderlyingAsset(address asset) external view override returns (bool) {
        return asset == address(ASSET);
    }

    /*//////////////////////////////////////////////////////////////////////////
                                HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/
    function addLiquidity(uint256 actualDeposit) private {
        bool[] memory unwrapWrapped = new bool[](2);
        unwrapWrapped[0] = false;
        unwrapWrapped[1] = true;

        uint256[] memory amountIn = new uint256[](2);
        amountIn[0] = 0;
        amountIn[1] = actualDeposit;

        uint256 bptAmountOut = ICompositeLiquidityRouter(balancerRouter).addLiquidityUnbalancedToERC4626Pool(
            balancerPool, // pool,
            unwrapWrapped,
            amountIn,
            1, // minBptAmountOut
            false, // wethIsEth
            "" // userData
        );

        IIncentiveGauge(incentiveGauge).deposit(bptAmountOut);
    }

    function removeLiquidity(uint256 lpAmount) private returns (address[] memory tokensOut, uint256[] memory amountsOut) {
        bool[] memory unwrapWrapped = new bool[](2);
        unwrapWrapped[0] = true;
        unwrapWrapped[1] = true;

        uint256[] memory minAmountsOut = new uint256[](2);
        minAmountsOut[0] = 0;
        minAmountsOut[1] = 0;

        return ICompositeLiquidityRouter(balancerRouter).removeLiquidityProportionalFromERC4626Pool(
            balancerPool, // pool
            unwrapWrapped,
            lpAmount, // exactBptAmountIn,
            minAmountsOut,
            false, // wethIsEth
            "" // userData
        );
    }

    function swapGHOtoUSDC(uint256 amount) private returns (uint256 calculatedAmount) {
        IBatchRouter.SwapPathStep memory step0 = IBatchRouter.SwapPathStep(wrappedGHO, ERC20(wrappedGHO), true);
        IBatchRouter.SwapPathStep memory step1 = IBatchRouter.SwapPathStep(balancerPool, ERC20(wrappedUSDC), false);
        IBatchRouter.SwapPathStep memory step2 = IBatchRouter.SwapPathStep(wrappedUSDC, ASSET, true);

        IBatchRouter.SwapPathStep[] memory steps = new IBatchRouter.SwapPathStep[](3);
        steps[0] = step0;
        steps[1] = step1;
        steps[2] = step2;

        IBatchRouter.SwapPathExactAmountIn[] memory paths = new IBatchRouter.SwapPathExactAmountIn[](1);
        paths[0] = IBatchRouter.SwapPathExactAmountIn(
            ERC20(rewardToken),
            steps,
            amount,
            previewSwapGHOtoUSDC(amount).mulDiv(10_000 - slippageWhenSwapAsset, 10_000, Math.Rounding.Floor)
        );

        (,, uint256[] memory amountsOut) = IBatchRouter(swapRouter).swapExactIn(paths, block.timestamp + 10 seconds, false, "");
        calculatedAmount = amountsOut[0];
    }

    function swapBALtoUSDC(uint256 amount) private returns (uint256 amountOut) {
        IBatchRouter.SingleSwap memory singleSwap =
            IBatchRouter.SingleSwap(POOL_ID_V2, SwapKind.EXACT_IN, IAsset(BAL), IAsset(address(ASSET)), amount, "");

        IBatchRouter.FundManagement memory fundManagement =
            IBatchRouter.FundManagement(payable(address(this)), false, payable(address(this)), false);

        amountOut = IBatchRouter(swapRouterV2).swap(singleSwap, fundManagement, 0, block.timestamp + 10 seconds);
    }

    function previewSwapBALtoUSDC(uint256 amount) private view returns (uint256 amountOutDecimal6) {
        (, uint256[] memory balances,) = IPoolV2(swapRouterV2).getPoolTokens(POOL_ID_V2);
        uint256[] memory scalingFactors = IPoolBALUSDC(balancerBALUSDCPool).getScalingFactors();

        uint256 balanceTokenIn = FixedPoint.mulDown(balances[0], scalingFactors[0]);
        uint256 balanceTokenOut = FixedPoint.mulDown(balances[1], scalingFactors[1]);

        uint256 swapFeePercentage = IPoolBALUSDC(balancerBALUSDCPool).getSwapFeePercentage();
        amount - amount.mulUp(swapFeePercentage);

        // All token amounts are upscaled.
        uint256[] memory normalizedWeight = IPoolBALUSDC(balancerBALUSDCPool).getNormalizedWeights();

        uint256 amountOut = WeightedMath._calcOutGivenIn(
            balanceTokenIn,
            normalizedWeight[0],
            balanceTokenOut,
            normalizedWeight[1],
            FixedPoint.mulDown(amount, scalingFactors[0])
        );

        // amountOut tokens are exiting the Pool, so we round down.
        return FixedPoint.divDown(amountOut, scalingFactors[1]);
    }

    function previewSwapGHOtoUSDC(uint256 amount) public view returns (uint256 amountOutDecimal6) {
        VaultSwapParams memory vaultSwapParams = VaultSwapParams({
            kind: SwapKind.EXACT_IN,
            pool: balancerPool,
            tokenIn: ERC20(wrappedGHO),
            tokenOut: ERC20(wrappedUSDC),
            amountGivenRaw: amount,
            limitRaw: 0,
            userData: ""
        });
        PoolData memory poolData = IVaultExplorer(balancerExplorer).getPoolData(balancerPool);
        SwapState memory swapState;

        swapState.indexIn = 99_999_999;
        swapState.indexOut = 99_999_999;

        for (uint256 i = 0; i < poolData.tokens.length; i++) {
            if (poolData.tokens[i] == vaultSwapParams.tokenIn) {
                swapState.indexIn = i;
            }
        }

        for (uint256 i = 0; i < poolData.tokens.length; i++) {
            if (poolData.tokens[i] == vaultSwapParams.tokenOut) {
                swapState.indexOut = i;
            }
        }

        if (swapState.indexIn == 99_999_999) {
            revert TokenNotRegistered();
        }

        if (swapState.indexOut == 99_999_999) {
            revert TokenNotRegistered();
        }

        swapState.amountGivenScaled18 = vaultSwapParams.amountGivenRaw.toScaled18ApplyRateRoundDown(
            poolData.decimalScalingFactors[swapState.indexIn], poolData.tokenRates[swapState.indexIn]
        );

        swapState.swapFeePercentage = IPool(balancerPool).getStaticSwapFeePercentage();

        PoolSwapParams memory poolSwapParams = PoolSwapParams({
            kind: vaultSwapParams.kind,
            amountGivenScaled18: swapState.amountGivenScaled18,
            balancesScaled18: poolData.balancesLiveScaled18,
            indexIn: swapState.indexIn,
            indexOut: swapState.indexOut,
            router: address(this),
            userData: vaultSwapParams.userData
        });

        uint256 totalSwapFeeAmountScaled18 = poolSwapParams.amountGivenScaled18.mulUp(swapState.swapFeePercentage);
        poolSwapParams.amountGivenScaled18 -= totalSwapFeeAmountScaled18;

        uint256 amountOut = IPool(balancerPool).onSwap(poolSwapParams);

        (, uint256 convertedAmount) = Math.tryDiv(amountOut, 1e12);
        amountOutDecimal6 = convertedAmount;
    }

    function claimRewardFromBalancer() private returns (uint256) {
        uint256 ghoPendingReward = IIncentiveGauge(incentiveGauge).claimable_reward(address(this), rewardToken);
        uint256 balPendingReward = IIncentiveGauge(incentiveGauge).claimable_reward(address(this), BAL);
        uint256 usdcPendingReward = 0;
        if (ghoPendingReward > SWAPABLE_AMOUNT) {
            IIncentiveGauge(incentiveGauge).claim_rewards();
            uint256 swappedUSDC1 = swapGHOtoUSDC(ghoPendingReward);
            uint256 unswappedBal = ERC20(BAL).balanceOf(address(this));
            uint256 swappedUSDC2 = 0;
            if (unswappedBal + balPendingReward >= SWAPABLE_AMOUNT) {
                swappedUSDC2 = swapBALtoUSDC(unswappedBal + balPendingReward);
            }
            usdcPendingReward = swappedUSDC1 + swappedUSDC2;
        }
        return usdcPendingReward;
    }

    function claimableRewardFromBalancer() private view returns (uint256) {
        uint256 ghoPendingReward = IIncentiveGauge(incentiveGauge).claimable_reward(address(this), rewardToken);
        uint256 balPendingReward = IIncentiveGauge(incentiveGauge).claimable_reward(address(this), BAL);
        uint256 usdcPendingReward = 0;
        if (ghoPendingReward > SWAPABLE_AMOUNT) {
            uint256 swappedUSDC1 = previewSwapGHOtoUSDC(ghoPendingReward);
            uint256 unswappedBal = ERC20(BAL).balanceOf(address(this));
            uint256 swappedUSDC2 = 0;
            if (unswappedBal + balPendingReward >= SWAPABLE_AMOUNT) {
                swappedUSDC2 = previewSwapBALtoUSDC(unswappedBal + balPendingReward);
            }
            usdcPendingReward = swappedUSDC1 + swappedUSDC2;
        }
        return usdcPendingReward;
    }
}
