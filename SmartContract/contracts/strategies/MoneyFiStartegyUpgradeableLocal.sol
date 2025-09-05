// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.20;

import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Context } from "@openzeppelin/contracts/utils/Context.sol";

import { DefaultAccessControlEnumerable } from "../security/DefaultAccessControlEnumerable.sol";
import { MoneyFiStartegyUpgradeableBase } from "./abstracts/MoneyFiStartegyUpgradeableBase.sol";

contract MoneyFiStartegyUpgradeableLocal is MoneyFiStartegyUpgradeableBase, UUPSUpgradeable {
    using Math for uint256;

    /*//////////////////////////////////////////////////////////////////////////
                                USER-FACING STORAGE
    //////////////////////////////////////////////////////////////////////////*/

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
        _MoneyFiStartegyUpgradeableBase_init(IERC20(asset_), router_, crossChainRouter_, name_, symbol_);
        __UUPSUpgradeable_init();
    }

    /// @dev Override _authorizeUpgrade function to add authorization
    function _authorizeUpgrade(address newImplementation) internal override onlyDelegateAdmin { }
    /*//////////////////////////////////////////////////////////////////////////
                        OVERRIDED CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Internal conversion function (from assets to shares) with support for rounding direction.
    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view override returns (uint256) {
        return super._convertToShares(assets, rounding);
    }

    /// @dev Internal conversion function (from shares to assets) with support for rounding direction.
    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view override returns (uint256) {
        return super._convertToAssets(shares, rounding);
    }

    /// @dev See {IMoneyFiV1ERC4626-totalLiquidWhitelistPool}.
    function totalLiquidWhitelistPool() public view override returns (uint256 tvl) {
        tvl = 2_000_000e6;
    }
    /*//////////////////////////////////////////////////////////////////////////
                            INTERNAL NON-CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Internal hook triggered before withdraw
    function beforeWithdraw(
        uint256 assets,
        uint256 shares,
        bytes memory externalCallData
    )
        internal
        override
        returns (uint256 accruedAssets)
    {
        accruedAssets = assets;
    }

    /// @dev Internal hook triggered after deposit
    function afterDeposit(uint256 assets, uint256 shares, bytes memory externalCallData) internal override { }

    /// @dev See {IMoneyFiStartegyUpgradeableBase}.
    function isSupportUnderlyingAsset(address asset) public view override returns (bool) {
        return asset == address(ASSET);
    }

    /// @dev See {IMoneyFiStartegyUpgradeableBase}.
    function emergencyWithdraw() external override whenNotEmergencyStop onlyRouter { }
}
