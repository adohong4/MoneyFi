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
import { IPool } from "../interfaces/externals/compound/IPool.sol";
import { IReward } from "../interfaces/externals/compound/IReward.sol";
import { IComet } from "../interfaces/externals/compound/IComet.sol";
import { TransferHelper } from "../libraries/TransferHelper.sol";
import { IV3SwapRouterUniswap } from "../interfaces/externals/uniswap/IV3SwapRouterUniswap.sol";
import { IQuoter } from "../interfaces/externals/uniswap/IQuoter.sol";
import { SwapMath } from "../libraries/external/SwapMath.sol";

contract MoneyFiStrategyUpgradeableCompound is MoneyFiStartegyUpgradeableBase, UUPSUpgradeable {
    using Math for uint256;
    using SafeERC20 for ERC20;

    struct CompoundInitializeParams {
        address assetCompoundPool;
        address assetCompoundReward;
        address assetCompoundComet;
        address rewardToken;
        address routerV3;
        address factoryV3;
        address quoter;
    }

    event CompoundEmergencyWithdraw(address indexed compoundPool, address indexed strategy, uint256 amount, uint256 withdrawAt);

    /*//////////////////////////////////////////////////////////////////////////
                                USER-FACING STORAGE
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Storage for the Balancer contract
    IPool public assetCompoundPool;
    IReward public assetCompoundReward;
    IComet public assetCompoundComet;
    IV3SwapRouterUniswap public routerV3;
    IUniswapV3Factory public factoryV3;
    IQuoter public quoter;

    uint256 totalDepositedAsset;
    uint256 latestPendingReward;
    bool isSettedUp;
    address rewardToken;

    uint256 internal constant SWAPABLE_AMOUNT = 1e17;

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
    function setUp(CompoundInitializeParams memory _compoundInitializeParams) public {
        if (isSettedUp) {
            revert RequireSettedUpState();
        }

        assetCompoundPool = IPool(_compoundInitializeParams.assetCompoundPool);
        assetCompoundReward = IReward(_compoundInitializeParams.assetCompoundReward);
        assetCompoundComet = IComet(_compoundInitializeParams.assetCompoundComet);
        rewardToken = _compoundInitializeParams.rewardToken;
        routerV3 = IV3SwapRouterUniswap(_compoundInitializeParams.routerV3);
        factoryV3 = IUniswapV3Factory(_compoundInitializeParams.factoryV3);
        quoter = IQuoter(_compoundInitializeParams.quoter);

        isSettedUp = true;
    }

    /// @dev Override _authorizeUpgrade function to add authorization
    function _authorizeUpgrade(address newImplementation) internal override onlyDelegateAdmin { }
    /*//////////////////////////////////////////////////////////////////////////
                            OVERRIDED CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Internal conversion function (from assets to shares) with support for rounding direction.
    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view override returns (uint256) {
        if (address(assetCompoundPool) != address(0)) {
            return assets.mulDiv(totalSupply() + 10 ** _decimalsOffset(), totalAssets() + 1, rounding);
        } else {
            return super._convertToShares(assets, rounding);
        }
    }

    /// @dev Internal conversion function (from shares to assets) with support for rounding direction.
    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view override returns (uint256) {
        if (address(assetCompoundPool) != address(0)) {
            return shares.mulDiv(totalAssets() + 1, totalSupply() + 10 ** _decimalsOffset(), rounding);
        } else {
            return super._convertToAssets(shares, rounding);
        }
    }

    /// @dev See {IDiracV1ERC4626-totalAssets}.
    function totalAssets() public view override returns (uint256) {
        return ASSET.balanceOf(address(this)) + totalDepositedAsset + latestPendingReward;
    }

    function totalLiquidWhitelistPool() public view override returns (uint256) {
        return assetCompoundPool.getReserves();
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
        if (address(assetCompoundPool) != address(0)) {
            uint256 baseAssetClaimedReward = claimRewardFromCompound();

            uint256 totalDepositedAmount = assetCompoundPool.balanceOf(address(this));

            uint256 depositedAmountOfUserToWithdraw = totalDepositedAmount.mulDiv(shares, totalSupply(), Math.Rounding.Floor);

            removeLiquidity(depositedAmountOfUserToWithdraw);

            uint256 pendingRewardDepositor = baseAssetClaimedReward.mulDiv(shares, totalSupply(), Math.Rounding.Floor);

            uint256 remainReward = baseAssetClaimedReward - pendingRewardDepositor;
            accruedAssets = depositedAmountOfUserToWithdraw + pendingRewardDepositor;

            if (depositedAmountOfUserToWithdraw - remainReward > totalDepositedAsset) {
                totalDepositedAsset = remainReward;
            } else {
                totalDepositedAsset = totalDepositedAsset - depositedAmountOfUserToWithdraw + remainReward;
            }

            if (remainReward > 0) {
                addLiquidity(remainReward);
            }
            updateLatestPendingReward();
        } else {
            accruedAssets = assets;
        }
    }

    /// @dev Internal hook executed after a deposit, updating cumulative deposit count and deposit into external protocol
    /// @param assets The amount of assets being deposited.
    function afterDeposit(uint256 assets, uint256, bytes memory) internal override {
        if (address(assetCompoundPool) != address(0)) {
            uint256 baseAssetReward = claimRewardFromCompound();

            uint256 actualDeposit = assets + baseAssetReward;
            totalDepositedAsset += actualDeposit;
            if (actualDeposit > 0) {
                addLiquidity(actualDeposit);
            }
        }
    }

    /// @dev Internal hook executed before rebalance, updating latest pending reward
    function beforeRebalance() external override {
        updateLatestPendingReward();
    }

    /*//////////////////////////////////////////////////////////////////////////
                                HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/
    function addLiquidity(uint256 actualDeposit) private {
        ASSET.approve(address(assetCompoundPool), actualDeposit);
        assetCompoundPool.supply(address(ASSET), actualDeposit);
    }

    function removeLiquidity(uint256 assetAmount) private {
        assetCompoundPool.withdraw(address(ASSET), assetAmount);
    }

    function swapCOMPtoUSDCe(uint256 amount) public returns (uint256 calculatedAmount) {
        if (amount <= SWAPABLE_AMOUNT) {
            return 0;
        }
        address poolV3 = factoryV3.getPool(rewardToken, address(ASSET), 3000);
        uint24 poolFee = IUniswapV3Pool(poolV3).fee();

        // Safe approve to swap router address
        TransferHelper.safeApprove(rewardToken, address(routerV3), amount);

        IV3SwapRouterUniswap.ExactInputSingleParams memory params = IV3SwapRouterUniswap.ExactInputSingleParams({
            tokenIn: rewardToken,
            tokenOut: address(ASSET),
            fee: poolFee,
            recipient: address(this),
            amountIn: amount,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        calculatedAmount = routerV3.exactInputSingle(params);
    }

    function previewSwapCOMPtoUSDCe(uint256 amount) public view returns (uint256 calculatedAmount) {
        address poolV3 = factoryV3.getPool(rewardToken, address(ASSET), 3000);
        uint24 poolFee = IUniswapV3Pool(poolV3).fee();
        IQuoter.QuoteExactInputSingleParams memory param = IQuoter.QuoteExactInputSingleParams({
            tokenIn: rewardToken,
            tokenOut: address(ASSET),
            amountIn: amount,
            fee: poolFee,
            sqrtPriceLimitX96: 0
        });
        (calculatedAmount,,,) = quoter.quoteExactInputSingle(param);
    }

    function claimRewardFromCompound() private returns (uint256) {
        assetCompoundReward.claim(address(assetCompoundPool), address(this), true);
        uint256 reward = IERC20(rewardToken).balanceOf(address(this));
        uint256 rewardInAsset = swapCOMPtoUSDCe(reward);
        return rewardInAsset;
    }

    /*//////////////////////////////////////////////////////////////////////////
                                    EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/
    /// @notice Updates the Compound Pool address
    /// @param _assetCompoundPool The new Compound Pool contract address
    function setCompoundPool(address _assetCompoundPool) external onlyDelegateAdmin {
        assetCompoundPool = IPool(_assetCompoundPool);
    }

    /// @notice Updates the Compound Reward address
    /// @param _assetCompoundReward The new Compound Reward contract address
    function setCompoundReward(address _assetCompoundReward) external onlyDelegateAdmin {
        assetCompoundReward = IReward(_assetCompoundReward);
    }

    /// @notice Updates the Compound Comet address
    /// @param _assetCompoundComet The new Compound Comet contract address
    function setCompoundComet(address _assetCompoundComet) external onlyDelegateAdmin {
        assetCompoundComet = IComet(_assetCompoundComet);
    }

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

    /// @notice Updates the reward token address
    /// @param _rewardToken The new reward token contract address
    function setTokenReward(address _rewardToken) external onlyDelegateAdmin {
        rewardToken = _rewardToken;
    }

    /// @dev See {IMoneyFiStartegyUpgradeableBase}.
    function isSupportUnderlyingAsset(address asset) public view override returns (bool) {
        return asset == address(ASSET);
    }

    function emergencyWithdraw() external override whenNotEmergencyStop onlyRouter {
        uint256 strategyLpBalance = assetCompoundPool.balanceOf(address(this));
        uint256 beforeEmergencyWithdraw = ASSET.balanceOf(address(this));
        removeLiquidity(strategyLpBalance);
        claimRewardFromCompound();
        uint256 afterEmergencyWithdraw = ASSET.balanceOf(address(this));

        uint256 withdrawAmount = afterEmergencyWithdraw - beforeEmergencyWithdraw;

        emergencyStop = true;
        emit EmergencyWithdraw(address(assetCompoundPool), address(this), withdrawAmount, block.timestamp);
    }

    function updateLatestPendingReward() public {
        IReward.RewardOwed memory reward = assetCompoundReward.getRewardOwed(address(assetCompoundPool), address(this));
        latestPendingReward = previewSwapCOMPtoUSDCe(reward.owed);
    }
}
