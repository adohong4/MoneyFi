// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.20;

import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Context } from "@openzeppelin/contracts/utils/Context.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IUniswapV3Factory } from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import { IUniswapV3Pool } from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import { DefaultAccessControlEnumerable } from "../security/DefaultAccessControlEnumerable.sol";
import { MoneyFiStartegyUpgradeableBase } from "./abstracts/MoneyFiStartegyUpgradeableBase.sol";
import { IStargateStaking } from "../interfaces/externals/stargate/IStargateStaking.sol";
import { IStargatePool } from "../interfaces/externals/stargate/IStargatePool.sol";
import { IMultiRewarder } from "../interfaces/externals/stargate/IMultiRewarder.sol";
import { IRewarder } from "../interfaces/externals/stargate/IRewarder.sol";
import { IV3SwapRouterUniswap } from "../interfaces/externals/uniswap/IV3SwapRouterUniswap.sol";
import { IQuoter } from "../interfaces/externals/uniswap/IQuoter.sol";

contract MoneyFiStrategyUpgradeableStargate is MoneyFiStartegyUpgradeableBase, UUPSUpgradeable {
    using Math for uint256;
    using SafeERC20 for ERC20;

    struct StargateInitializeParams {
        address stargateStaking;
        address stargatePool;
        address stargateRewarder;
        address stargateLpToken;
        address routerV3;
        address factoryV3;
        address quoter;
    }

    /*//////////////////////////////////////////////////////////////////////////
                                USER-FACING STORAGE
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Storage for the Balancer contract
    uint256 constant SWAPABLE_AMOUNT = 1e16;

    IStargateStaking stargateStaking;
    IMultiRewarder stargateRewarder;
    IERC20 stargateLpToken;
    IERC20 rewardToken;
    IStargatePool stargatePool;
    uint256 totalDepositedAsset;
    uint24 poolFee;
    bool isSettedUp;

    IV3SwapRouterUniswap public routerV3;
    IUniswapV3Factory public factoryV3;
    IQuoter public quoter;
    bool public emergencyStopDeposit;

    /*//////////////////////////////////////////////////////////////////////////
                                     CONSTRUCTOR
    //////////////////////////////////////////////////////////////////////////*/

    constructor() {
        _disableInitializers();
    }

    /*//////////////////////////////////////////////////////////////////////////
                                     MODIFIER
    //////////////////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////////////////
                                    INITIALIZER
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
        _MoneyFiStartegyUpgradeableBase_init(IERC20(asset_), router_, crossChainRouter_, name_, symbol_);
        __UUPSUpgradeable_init();
        emergencyStopDeposit = false;
        totalDepositedAsset = 0;
    }

    /// @dev Only call by operator - just one time
    /// Must be call before executing strategy action
    function setUp(StargateInitializeParams memory _stargateInitializeParams) public {
        if (isSettedUp) {
            revert RequireSettedUpState();
        }

        stargateStaking = IStargateStaking(_stargateInitializeParams.stargateStaking);
        stargatePool = IStargatePool(_stargateInitializeParams.stargatePool);
        stargateLpToken = IERC20(_stargateInitializeParams.stargateLpToken);
        routerV3 = IV3SwapRouterUniswap(_stargateInitializeParams.routerV3);
        factoryV3 = IUniswapV3Factory(_stargateInitializeParams.factoryV3);
        quoter = IQuoter(_stargateInitializeParams.quoter);

        isSettedUp = true;
    }

    /// @dev Override _authorizeUpgrade function to add authorization
    function _authorizeUpgrade(address newImplementation) internal override onlyDelegateAdmin { }
    /*//////////////////////////////////////////////////////////////////////////
                            OVERRIDED CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Internal conversion function (from assets to shares) with support for rounding direction.
    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view override returns (uint256) {
        if (address(stargatePool) != address(0)) {
            return assets.mulDiv(totalSupply() + 10 ** _decimalsOffset(), totalAssets() + 1, rounding);
        } else {
            return super._convertToShares(assets, rounding);
        }
    }

    /// @dev Internal conversion function (from shares to assets) with support for rounding direction.
    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view override returns (uint256) {
        if (address(stargatePool) != address(0)) {
            return shares.mulDiv(totalAssets() + 1, totalSupply() + 10 ** _decimalsOffset(), rounding);
        } else {
            return super._convertToAssets(shares, rounding);
        }
    }

    /// @dev See {IDiracV1ERC4626-totalAssets}.
    function totalAssets() public view override returns (uint256) {
        (uint256 pendingRewardInUSDC,,) = pendingRewardFromStargate();
        return ASSET.balanceOf(address(this)) + totalDepositedAsset + pendingRewardInUSDC;
    }

    function totalLiquidWhitelistPool() public view override returns (uint256) {
        return stargatePool.poolBalance();
    }
    /*//////////////////////////////////////////////////////////////////////////
                            INTERNAL NON-CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Internal hook executed before a deposit, updating cumulative deposit count and deposit into external protocol
    /// @param assets The amount of assets being deposited.
    function beforeDeposit(uint256 assets, bytes memory) internal virtual override whenNotEmergencyStop returns (uint256) {
        return assets;
    }

    /// @dev Internal hook executed before a withdrawal, updating cumulative withdrawal count and deposit into external protocol
    /// @param assets The amount of assets being withdrawn.
    function beforeWithdraw(uint256 assets, uint256 shares, bytes memory) internal override returns (uint256 accruedAssets) {
        if (address(stargatePool) != address(0)) {
            uint256 baseAssetClaimedReward = claimRewardFromStargate();

            uint256 stakedStargateLpTokens = stargateStaking.balanceOf(stargateLpToken, address(this));
            uint256 depositorLPInStargate = stakedStargateLpTokens.mulDiv(shares, totalSupply(), Math.Rounding.Floor);
            uint256 depositedAmountOfUserToWithdraw = removeLiquidity(depositorLPInStargate);

            uint256 pendingRewardDepositor = baseAssetClaimedReward.mulDiv(shares, totalSupply(), Math.Rounding.Floor);

            uint256 remainReward = baseAssetClaimedReward - pendingRewardDepositor;
            accruedAssets = depositedAmountOfUserToWithdraw + pendingRewardDepositor;

            if (depositedAmountOfUserToWithdraw > totalDepositedAsset + remainReward) {
                totalDepositedAsset = remainReward;
            } else {
                totalDepositedAsset = totalDepositedAsset - depositedAmountOfUserToWithdraw + remainReward;
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
    function afterDeposit(uint256 assets, uint256, bytes memory) internal override {
        if (address(stargatePool) != address(0)) {
            uint256 baseAssetReward = claimRewardFromStargate();

            uint256 actualDeposit = assets + baseAssetReward;
            totalDepositedAsset += actualDeposit;
            if (actualDeposit > 0) {
                addLiquidity(actualDeposit);
            }
        }
    }

    /*//////////////////////////////////////////////////////////////////////////
                                HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/
    function addLiquidity(uint256 actualDeposit) private {
        ASSET.approve(address(stargatePool), actualDeposit);
        uint256 amountLD = stargatePool.deposit(address(this), actualDeposit);
        stargateLpToken.approve(address(stargateStaking), amountLD);
        stargateStaking.deposit(stargateLpToken, amountLD);
    }

    function removeLiquidity(uint256 stakedStargateLpTokens) private returns (uint256 assetAmount) {
        stargateStaking.withdraw(stargateLpToken, stakedStargateLpTokens);
        uint256 redeemableAmount = stargatePool.redeemable(address(this));
        assetAmount = stargatePool.redeem(redeemableAmount, address(this));
    }

    function swapRewardTokenstoUSDC(address tokenReward, uint256 amount) public returns (uint256 calculatedAmount) {
        // Safe approve to swap router address
        ERC20(tokenReward).safeIncreaseAllowance(address(routerV3), amount);

        IV3SwapRouterUniswap.ExactInputSingleParams memory params = IV3SwapRouterUniswap.ExactInputSingleParams({
            tokenIn: address(tokenReward),
            tokenOut: address(ASSET),
            fee: poolFee,
            recipient: address(this),
            amountIn: amount,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        calculatedAmount = routerV3.exactInputSingle(params);
    }

    function previewSwapRewardTokenstoUSDC(address tokenReward, uint256 amount) public view returns (uint256 calculatedAmount) {
        IQuoter.QuoteExactInputSingleParams memory param = IQuoter.QuoteExactInputSingleParams({
            tokenIn: address(tokenReward),
            tokenOut: address(ASSET),
            amountIn: amount,
            fee: poolFee,
            sqrtPriceLimitX96: 0
        });
        (calculatedAmount,,,) = quoter.quoteExactInputSingle(param);
    }

    function claimRewardFromStargate() private returns (uint256) {
        (uint256 totalRewardInUSD, address[] memory tokenRewards, uint256[] memory rewardAmounts) = pendingRewardFromStargate();
        if (totalRewardInUSD == 0) {
            return 0;
        }
        IERC20[] memory tokens = new IERC20[](1);
        tokens[0] = stargateLpToken;
        stargateStaking.claim(tokens);

        uint256 pendingRewardInUSDC = 0;
        for (uint256 index = 0; index < tokenRewards.length; index++) {
            if (rewardAmounts[index] > 0) {
                pendingRewardInUSDC += swapRewardTokenstoUSDC(tokenRewards[index], rewardAmounts[index]);
            }
        }
        return pendingRewardInUSDC;
    }

    function pendingRewardFromStargate() private view returns (uint256, address[] memory, uint256[] memory) {
        IRewarder rewarder = stargateStaking.rewarder(stargateLpToken);
        (address[] memory tokens, uint256[] memory rewardAmounts) =
            IMultiRewarder(address(rewarder)).getRewards(stargateLpToken, address(this));
        uint256 totalReward;
        bool tooSmallAmountCheck = false;
        for (uint256 index = 0; index < tokens.length; index++) {
            uint256 tokenDecimal = ERC20(tokens[index]).decimals();
            uint256 convertedSwapableAmount = SWAPABLE_AMOUNT;
            if (tokenDecimal != 18) {
                uint256 decimalNeedToBuff = 18 - tokenDecimal;
                convertedSwapableAmount = SWAPABLE_AMOUNT.mulDiv(1, 10 ** decimalNeedToBuff, Math.Rounding.Floor);
            }
            if (convertedSwapableAmount > rewardAmounts[index]) {
                tooSmallAmountCheck = true;
                totalReward = 0;
                break;
            } else {
                totalReward += previewSwapRewardTokenstoUSDC(tokens[index], rewardAmounts[index]);
            }
        }
        return (totalReward, tokens, rewardAmounts);
    }

    /*//////////////////////////////////////////////////////////////////////////
                                    EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/
    /// @notice Updates the Uniswap router V3 address
    /// @param _routerV3 The new Uniswap router V3 contract address
    function setRouterV3(address _routerV3) external onlyDelegateAdmin {
        routerV3 = IV3SwapRouterUniswap(_routerV3);
    }

    /// @notice Updates the Uniswap factory V3 address
    /// @param _factoryV3 The new Uniswap factory V3 contract address
    function setFactoryV3(address _factoryV3) external onlyDelegateAdmin {
        factoryV3 = IUniswapV3Factory(_factoryV3);
    }

    function setPoolFee(uint24 _newValue) external onlyDelegateAdmin {
        poolFee = _newValue;
    }

    /// @dev See {IMoneyFiStartegyUpgradeableBase}.
    function isSupportUnderlyingAsset(address asset) public view override returns (bool) {
        return asset == address(ASSET);
    }

    function emergencyWithdraw() external override whenNotEmergencyStop onlyRouter {
        uint256 stakedStargateLpTokens = stargateStaking.balanceOf(stargateLpToken, address(this));
        uint256 beforeEmergencyWithdraw = ASSET.balanceOf(address(this));
        removeLiquidity(stakedStargateLpTokens);
        claimRewardFromStargate();
        uint256 afterEmergencyWithdraw = ASSET.balanceOf(address(this));

        uint256 withdrawAmount = afterEmergencyWithdraw - beforeEmergencyWithdraw;

        emergencyStop = true;
        emit EmergencyWithdraw(address(stargatePool), address(this), withdrawAmount, block.timestamp);
    }
}
