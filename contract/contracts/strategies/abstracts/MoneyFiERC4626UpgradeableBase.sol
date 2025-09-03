// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.20;

import { IERC20, IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { ERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IMoneyFiERC4626UpgradeableBase } from "../../interfaces/IMoneyFiERC4626UpgradeableBase.sol";

/**
 * @dev Custom ERC4626
 * @dev Implementation of the ERC4626 "Tokenized Vault Standard" as defined in
 * https://eips.ethereum.org/EIPS/eip-4626[EIP-4626].
 *
 * Inspired from openzeppelin implementation
 * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/extensions/ERC4626.sol
 */
abstract contract MoneyFiERC4626UpgradeableBase is ERC20Upgradeable, IMoneyFiERC4626UpgradeableBase {
    using Math for uint256;

    /*//////////////////////////////////////////////////////////////////////////
                                PRIVATE STORAGE
    //////////////////////////////////////////////////////////////////////////*/

    IERC20 internal ASSET;

    uint8 private UNDERLYING_DECIMALS;

    /*//////////////////////////////////////////////////////////////////////////
                                     CONSTRUCTOR
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Set the underlying asset contract. This must be an ERC20-compatible contract (ERC20 or ERC777).
    function __MoneyFiERC4626UpgradeableBase_init(
        IERC20 asset_,
        string memory name_,
        string memory symbol_
    )
        internal
        onlyInitializing
    {
        (bool success, uint8 assetDecimals) = _tryGetAssetDecimals(asset_);
        UNDERLYING_DECIMALS = success ? assetDecimals : 18;
        ASSET = asset_;
        __ERC20_init(name_, symbol_);
    }

    /// @dev Attempts to fetch the asset decimals. A return value of false indicates that the attempt failed in some way.
    function _tryGetAssetDecimals(IERC20 asset_) private view returns (bool, uint8) {
        (bool success, bytes memory encodedDecimals) = address(asset_).staticcall(abi.encodeCall(IERC20Metadata.decimals, ()));
        if (success && encodedDecimals.length >= 32) {
            uint256 returnedDecimals = abi.decode(encodedDecimals, (uint256));
            if (returnedDecimals <= type(uint8).max) {
                return (true, uint8(returnedDecimals));
            }
        }
        return (false, 0);
    }

    /*//////////////////////////////////////////////////////////////////////////
                         USER-FACING CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Decimals are computed by adding the decimal offset on top of the underlying asset's decimals. This
    /// "original" value is cached during construction of the vault contract. If this read operation fails (e.g., the
    /// asset has not been created yet), a default of 18 is used to represent the underlying asset's decimals.
    ///
    ///  See {IERC20Metadata-decimals}.
    function decimals() public view virtual override(IERC20Metadata, ERC20Upgradeable) returns (uint8) {
        return UNDERLYING_DECIMALS + _decimalsOffset();
    }

    /// @dev See {IMoneyFiV1ERC4626-asset}.
    function asset() public view virtual returns (address) {
        return address(ASSET);
    }

    /// @dev See {IMoneyFiV1ERC4626-totalAssets}.
    function totalAssets() public view virtual returns (uint256) {
        return ASSET.balanceOf(address(this));
    }

    /// @dev See {IMoneyFiV1ERC4626-totalLiquidAssets}.
    function totalLiquidWhitelistPool() external view virtual returns (uint256 tvl) {
        tvl = totalAssets();
    }

    /// @dev See {IMoneyFiV1ERC4626-maxDeposit}.
    function maxDeposit(address) public view virtual returns (uint256) {
        return type(uint256).max;
    }

    /// @dev See {IMoneyFiV1ERC4626-maxMint}.
    function maxMint(address) public view virtual returns (uint256) {
        return type(uint256).max;
    }

    /*//////////////////////////////////////////////////////////////////////////
                         USER-FACING NON-CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev See {IMoneyFiV1ERC4626-convertToShares}.
    function convertToShares(uint256 assets) public view virtual returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Floor);
    }

    /// @dev See {IMoneyFiV1ERC4626-convertToAssets}.
    function convertToAssets(uint256 shares) public view virtual returns (uint256) {
        return _convertToAssets(shares, Math.Rounding.Floor);
    }

    /// @dev See {IMoneyFiV1ERC4626-maxWithdraw}.
    function maxWithdraw(address owner) public view virtual returns (uint256) {
        return _convertToAssets(balanceOf(owner), Math.Rounding.Floor);
    }

    /// @dev See {IMoneyFiV1ERC4626-maxRedeem}.
    function maxRedeem(address owner) public view virtual returns (uint256) {
        return balanceOf(owner);
    }

    /// @dev See {IMoneyFiV1ERC4626-previewDeposit}.
    function previewDeposit(uint256 assets) public view virtual returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Floor);
    }

    ///@dev See {IMoneyFiV1ERC4626-previewMint}.
    function previewMint(uint256 shares) public view virtual returns (uint256) {
        return _convertToAssets(shares, Math.Rounding.Ceil);
    }

    /// @dev See {IMoneyFiV1ERC4626-previewWithdraw}.
    function previewWithdraw(uint256 assets) public view virtual returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Ceil);
    }

    /// @dev See {IMoneyFiV1ERC4626-previewRedeem}.
    function previewRedeem(uint256 shares) public view virtual returns (uint256) {
        return _convertToAssets(shares, Math.Rounding.Floor);
    }

    /// @dev See {IMoneyFiV1ERC4626-deposit}.
    function deposit(uint256 assets, address receiver, bytes memory externalCallData) public virtual returns (uint256 shares) {
        assets = beforeDeposit(assets, externalCallData);

        uint256 maxAssets = maxDeposit(receiver);
        if (assets > maxAssets) {
            revert ERC4626ExceededMaxDeposit(receiver, assets, maxAssets);
        }

        shares = previewDeposit(assets);
        _deposit(_msgSender(), receiver, assets, shares);

        afterDeposit(assets, shares, externalCallData);
    }

    /// @dev See {IMoneyFiV1ERC4626-mint}.
    ///
    /// As opposed to {deposit}, minting is allowed even if the vault is in a state where the price of a share is zero.
    /// In this case, the shares will be minted without requiring any assets to be deposited.
    function mint(uint256 shares, address receiver, bytes memory externalCallData) public virtual returns (uint256 assets) {
        uint256 maxShares = maxMint(receiver);
        if (shares > maxShares) {
            revert ERC4626ExceededMaxMint(receiver, shares, maxShares);
        }

        assets = previewMint(shares);
        _deposit(_msgSender(), receiver, assets, shares);

        afterDeposit(assets, shares, externalCallData);
    }

    /// @dev See {IMoneyFiV1ERC4626-withdraw}.
    function withdraw(
        uint256 assets,
        address receiver,
        address owner,
        bytes memory externalCallData
    )
        public
        virtual
        returns (uint256 shares)
    {
        uint256 maxAssets = maxWithdraw(owner);
        if (assets > maxAssets) {
            revert ERC4626ExceededMaxWithdraw(owner, assets, maxAssets);
        }

        shares = previewWithdraw(assets);

        uint256 accruedAssets = beforeWithdraw(assets, shares, externalCallData);

        _withdraw(_msgSender(), receiver, owner, accruedAssets, shares);
    }

    /// @dev See {IMoneyFiV1ERC4626-redeem}.
    function redeem(
        uint256 shares,
        address receiver,
        address owner,
        bytes memory externalCallData
    )
        public
        virtual
        returns (uint256 accruedAssets)
    {
        uint256 maxShares = maxRedeem(owner);
        if (shares > maxShares) {
            revert ERC4626ExceededMaxRedeem(owner, shares, maxShares);
        }

        uint256 assets = previewRedeem(shares);
        accruedAssets = beforeWithdraw(assets, shares, externalCallData);

        _withdraw(_msgSender(), receiver, owner, accruedAssets, shares);
    }

    /*//////////////////////////////////////////////////////////////////////////
                            INTERNAL NON-CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Internal conversion function (from assets to shares) with support for rounding direction.
    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view virtual returns (uint256) {
        return assets.mulDiv(totalSupply() + 10 ** _decimalsOffset(), totalAssets() + 1, rounding);
    }

    /// @dev Internal conversion function (from shares to assets) with support for rounding direction.
    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view virtual returns (uint256) {
        return shares.mulDiv(totalAssets() + 1, totalSupply() + 10 ** _decimalsOffset(), rounding);
    }

    /// @dev Deposit/mint common workflow.
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal virtual {
        // If ASSET is ERC777, `transferFrom` can trigger a reentrancy BEFORE the transfer happens through the
        // `tokensToSend` hook. On the other hand, the `tokenReceived` hook, that is triggered after the transfer,
        // calls the vault, which is assumed not malicious.
        //
        // Conclusion: we need to do the transfer before we mint so that any reentrancy would happen before the
        // assets are transferred and before the shares are minted, which is a valid state.
        // slither-disable-next-line reentrancy-no-eth

        SafeERC20.safeTransferFrom(ASSET, caller, address(this), assets);
        _mint(receiver, shares);

        emit Deposit(caller, receiver, assets, shares);
    }

    /// @dev Withdraw/redeem common workflow.
    function _withdraw(address caller, address receiver, address owner, uint256 assets, uint256 shares) internal virtual {
        if (caller != owner) {
            _spendAllowance(owner, caller, shares);
        }

        // If ASSET is ERC777, `transfer` can trigger a reentrancy AFTER the transfer happens through the
        // `tokensReceived` hook. On the other hand, the `tokensToSend` hook, that is triggered before the transfer,
        // calls the vault, which is assumed not malicious.
        //
        // Conclusion: we need to do the transfer after the burn so that any reentrancy would happen after the
        // shares are burned and after the assets are transferred, which is a valid state.
        _burn(owner, shares);
        SafeERC20.safeTransfer(ASSET, receiver, assets);

        emit Withdraw(caller, receiver, owner, assets, shares);
    }

    /// @dev Internal hook triggered before withdraw
    function beforeWithdraw(
        uint256 assets,
        uint256 shares,
        bytes memory externalCallData
    )
        internal
        virtual
        returns (uint256 accruedAssets);

    /// @dev Internal hook triggered after deposit
    function afterDeposit(uint256 assets, uint256 shares, bytes memory externalCallData) internal virtual;

    /// @dev Internal hook triggered before deposit
    function beforeDeposit(uint256 assets, bytes memory) internal virtual returns (uint256 actualAssets) {
        return assets;
    }

    /*//////////////////////////////////////////////////////////////////////////
                            INTERNAL CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    function _decimalsOffset() internal view virtual returns (uint8) {
        return 0;
    }
}
