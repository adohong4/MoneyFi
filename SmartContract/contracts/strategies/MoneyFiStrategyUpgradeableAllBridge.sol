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
import { IAllBridgePool } from "../interfaces/externals/IAllBridgePool.sol";
import { IMoneyFiStrategyUpgradeableAllBridge } from "../interfaces/IMoneyFiStrategyUpgradeableAllBridge.sol";

contract MoneyFiStrategyUpgradeableAllBridge is
    MoneyFiStartegyUpgradeableBase,
    UUPSUpgradeable,
    IMoneyFiStrategyUpgradeableAllBridge
{
    using Math for uint256;
    using SafeERC20 for ERC20;

    /*//////////////////////////////////////////////////////////////////////////
                                USER-FACING STORAGE
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Storage for the AllBridgePool contract
    IAllBridgePool public allBridgePool;
    uint256 public tokenAmountReduceAllBridge;
    uint256 public tokenAmountIncreaseAllBridge;
    uint256 public systemPrecisionAllbridge;

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
        address allBridgeAddress_,
        string memory name_,
        string memory symbol_
    )
        public
        initializer
    {
        __DefaultAccessControlEnumerable_init(admin_);
        _MoneyFiStartegyUpgradeableBase_init(IERC20(asset_), router_, crossChainRouter_, name_, symbol_);
        __UUPSUpgradeable_init();
        allBridgePool = IAllBridgePool(allBridgeAddress_);

        /// @dev Validate the asset token match with underlying asset in allbridge
        if (address(asset_) != allBridgePool.token()) {
            revert InvalidUnderlyingAllBridgeAsset();
        }
        /// @dev Set up base on allbridge contract
        uint256 decimals = ERC20(asset_).decimals();

        systemPrecisionAllbridge = 3;
        tokenAmountReduceAllBridge = decimals > systemPrecisionAllbridge ? 10 ** (decimals - systemPrecisionAllbridge) : 0;
        tokenAmountIncreaseAllBridge = decimals < systemPrecisionAllbridge ? 10 ** (systemPrecisionAllbridge - decimals) : 0;

        ERC20(asset_).safeIncreaseAllowance(address(allBridgePool), type(uint256).max);
    }

    /// @dev Override _authorizeUpgrade function to add authorization
    function _authorizeUpgrade(address newImplementation) internal override onlyDelegateAdmin { }
    /*//////////////////////////////////////////////////////////////////////////
                        OVERRIDED CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Internal conversion function (from assets to shares) with support for rounding direction.
    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view override returns (uint256) {
        if (address(allBridgePool) != address(0)) {
            return assets.mulDiv(totalSupply() + 10 ** _decimalsOffset(), totalAssets() + 1, rounding);
        } else {
            return super._convertToShares(assets, rounding);
        }
    }

    /// @dev Internal conversion function (from shares to assets) with support for rounding direction.
    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view override returns (uint256) {
        if (address(allBridgePool) != address(0)) {
            return shares.mulDiv(totalAssets() + 1, totalSupply() + 10 ** _decimalsOffset(), rounding);
        } else {
            return super._convertToAssets(shares, rounding);
        }
    }

    /// @dev See {IMoneyFiV1ERC4626-totalAssets}.
    function totalAssets() public view override returns (uint256) {
        if (address(allBridgePool) != address(0)) {
            uint256 strategyLpBalance = allBridgePool.balanceOf(address(this));
            uint256 actualUnderlyingAssetBalance = convertLpToUnderlyingAssetAllBridge(strategyLpBalance);
            uint256 pendingReward = allBridgePool.pendingReward(address(this));
            return actualUnderlyingAssetBalance + pendingReward + ASSET.balanceOf(address(this));
        } else {
            return ASSET.balanceOf(address(this));
        }
    }

    /// @dev Return total liquidity of whitelist pool
    function totalLiquidWhitelistPool() public view override returns (uint256 tvl) {
        tvl = ASSET.balanceOf(address(allBridgePool));
    }

    /*//////////////////////////////////////////////////////////////////////////
                            INTERNAL NON-CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Internal hook executed before a withdrawal, updating cumulative withdrawal count and deposit into external
    /// protocol
    /// @param assets The amount of assets being withdrawn.
    function beforeWithdraw(uint256 assets, uint256 shares, bytes memory) internal override returns (uint256 accruedAssets) {
        if (address(allBridgePool) != address(0)) {
            uint256 strategyLpBalance = allBridgePool.balanceOf(address(this));

            // Current total reward frrom all bridge
            uint256 pendingAllBridgeReward = allBridgePool.pendingReward(address(this));

            // Reward for depositor
            uint256 pendingRewardDepositor = pendingAllBridgeReward.mulDiv(shares, totalSupply(), Math.Rounding.Floor);

            // Remain reward from will distribute to other depositors
            uint256 remainAllBridgeReward = pendingAllBridgeReward - pendingRewardDepositor;

            uint256 depositorLPInAllBridge = strategyLpBalance.mulDiv(shares, totalSupply(), Math.Rounding.Floor);

            allBridgePool.withdraw(depositorLPInAllBridge);

            accruedAssets = ASSET.balanceOf(address(this)) - remainAllBridgeReward;

            uint256 convertAssetToDepisitAllBridge = convertMinimumDepositAmountAllBridge(remainAllBridgeReward);

            // Deposit remain underlying strategy asset to allBridge.
            if (convertAssetToDepisitAllBridge > 0) {
                allBridgePool.deposit(remainAllBridgeReward);
            }
        } else {
            accruedAssets = assets;
        }
    }

    /// @dev Internal hook executed before a deposit, updating cumulative deposit count and deposit into external protocol
    /// @param assets The amount of assets being deposited.
    function beforeDeposit(uint256 assets, bytes memory) internal virtual override whenNotEmergencyStop returns (uint256) {
        return assets;
    }

    /// @dev Internal hook executed after a deposit, updating cumulative deposit count and deposit into external protocol
    /// @param assets The amount of assets being deposited.
    function afterDeposit(uint256 assets, uint256, bytes memory) internal override {
        if (address(allBridgePool) != address(0)) {
            // Claim reward from allBridge
            allBridgePool.claimRewards();

            // Total underlying asset strategy
            uint256 curUnderlyingStrategyBl = ASSET.balanceOf(address(this));

            // Convert deposit form in AllBridge
            uint256 convertAssetToDepisitAllBridge = convertMinimumDepositAmountAllBridge(curUnderlyingStrategyBl);

            if (convertAssetToDepisitAllBridge > 0) {
                allBridgePool.deposit(curUnderlyingStrategyBl);
            }
        }
    }

    /// @dev Convert LP token of AllBridge to underlying asset in AllBridge
    function convertLpToUnderlyingAssetAllBridge(uint256 amount) public view returns (uint256) {
        if (tokenAmountReduceAllBridge > 0) {
            return amount * tokenAmountReduceAllBridge;
        } else if (tokenAmountIncreaseAllBridge > 0) {
            return amount / tokenAmountIncreaseAllBridge;
        }

        return amount;
    }

    /// @dev Convert deposit amount to deposit amount form of AllBridge
    function convertMinimumDepositAmountAllBridge(uint256 _depositAmount) public view returns (uint256) {
        if (tokenAmountReduceAllBridge > 0) {
            return _depositAmount / tokenAmountReduceAllBridge;
        } else if (tokenAmountIncreaseAllBridge > 0) {
            return _depositAmount * tokenAmountIncreaseAllBridge;
        }

        return _depositAmount;
    }

    /// @notice Updates the AllBridgePool contract address
    /// @param _allBridgePool The new AllBridgePool contract address
    function setAllBridgePool(address _allBridgePool) external onlyDelegateAdmin {
        allBridgePool = IAllBridgePool(_allBridgePool);
    }

    /// @notice Updates the system precision value for AllBridge calculations
    /// @param _precision The new system precision value
    function setSystemPrecisionAllBridge(uint256 _precision) external onlyDelegateAdmin {
        uint256 decimals = ERC20(address(ASSET)).decimals();
        systemPrecisionAllbridge = _precision;
        tokenAmountReduceAllBridge = decimals > systemPrecisionAllbridge ? 10 ** (decimals - systemPrecisionAllbridge) : 0;
        tokenAmountIncreaseAllBridge = decimals < systemPrecisionAllbridge ? 10 ** (systemPrecisionAllbridge - decimals) : 0;
    }

    /// @dev See {IMoneyFiStartegyUpgradeableBase}.
    function isSupportUnderlyingAsset(address asset) public view override returns (bool) {
        return asset == address(ASSET);
    }

    /// @dev See {IMoneyFiStartegyUpgradeableBase}.
    function emergencyWithdraw() external override onlyRouter {
        uint256 strategyLpBalance = allBridgePool.balanceOf(address(this));
        uint256 beforeEmergencyWithdraw = ASSET.balanceOf(address(this));
        allBridgePool.withdraw(strategyLpBalance);
        uint256 afterEmergencyWithdraw = ASSET.balanceOf(address(this));

        uint256 withdrawAmount = afterEmergencyWithdraw - beforeEmergencyWithdraw;

        emergencyStop = true;
        emit EmergencyWithdraw(address(allBridgePool), address(this), withdrawAmount, block.timestamp);
    }
}
