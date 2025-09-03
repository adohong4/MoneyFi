// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.20;

import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Context } from "@openzeppelin/contracts/utils/Context.sol";
import { ContextUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IMoneyFiStartegyUpgradeableBase } from "../../interfaces/IMoneyFiStartegyUpgradeableBase.sol";
import { DefaultAccessControlEnumerable } from "../../security/DefaultAccessControlEnumerable.sol";
import { MoneyFiERC4626UpgradeableBase } from "./MoneyFiERC4626UpgradeableBase.sol";
import { StrategyType } from "../../types/StrageryDataType.sol";

abstract contract MoneyFiStartegyUpgradeableBase is
    MoneyFiERC4626UpgradeableBase,
    DefaultAccessControlEnumerable,
    Pausable,
    IMoneyFiStartegyUpgradeableBase
{
    using Math for uint256;
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////////////////
                                USER-FACING STORAGE
    //////////////////////////////////////////////////////////////////////////*/

    bool public emergencyStop;
    // Router address
    address private router;
    address private crossChainRouter;
    mapping(address user => StrategyType.UserDeposit currentDeposit) private userStrategy;

    /*//////////////////////////////////////////////////////////////////////////s
                                    CONSTRUCTOR
    //////////////////////////////////////////////////////////////////////////*/

    constructor() {
        _disableInitializers();
    }

    /*//////////////////////////////////////////////////////////////////////////
                                    MODIFIER
    //////////////////////////////////////////////////////////////////////////*/

    modifier onlyRouter() {
        if (msg.sender != router && msg.sender != crossChainRouter) {
            revert InvalidRouter();
        }
        _;
    }

    modifier whenNotEmergencyStop() {
        if (emergencyStop) {
            revert EnforcedEmergencyStop();
        }
        _;
    }

    /// @dev Set the underlying asset contract. This must be an ERC20-compatible contract (ERC20 or ERC777).
    function _MoneyFiStartegyUpgradeableBase_init(
        IERC20 asset_,
        address router_,
        address crossChainRouter_,
        string memory name_,
        string memory symbol_
    )
        internal
        onlyInitializing
    {
        __MoneyFiERC4626UpgradeableBase_init(asset_, name_, symbol_);
        router = router_;
        crossChainRouter = crossChainRouter_;
    }

    /*//////////////////////////////////////////////////////////////////////////
                        OVERRIDED WRITE FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Override _msgSender() function
    function _msgSender() internal view override(Context, ContextUpgradeable) returns (address) {
        return msg.sender;
    }

    /// @dev Override _msgData() function
    function _msgData() internal pure override(Context, ContextUpgradeable) returns (bytes calldata) {
        return msg.data;
    }

    /// @dev Override _contextSuffixLength() function
    function _contextSuffixLength() internal pure override(Context, ContextUpgradeable) returns (uint256) {
        return 0;
    }

    /// @dev Override _deposit() function - only router can deposit
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override onlyRouter {
        userStrategy[receiver].totalDeposited += assets;
        super._deposit(caller, receiver, assets, shares);
    }

    /// @dev Override _withdraw() function - only router can withdraw
    function _withdraw(
        address caller,
        address receiver,
        address owner,
        // assets = accruedAssets
        uint256 assets,
        uint256 shares
    )
        internal
        override
        onlyRouter
    {
        // Calculate total accumulate reward of owner
        int256 totalClaimedProfit = int256(assets) + int256(userStrategy[owner].totalWithDraw)
            - int256(userStrategy[owner].totalDeposited) - userStrategy[owner].totalClaimedProfit;

        // Update total withdraw
        userStrategy[owner].totalWithDraw += assets;

        // Update total claimed profit
        userStrategy[owner].totalClaimedProfit += totalClaimedProfit;

        if (caller != owner && caller != router && caller != crossChainRouter) {
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

    /// @dev Only router can transfer LP strategy asset
    function _update(address from, address to, uint256 value) internal override onlyRouter {
        super._update(from, to, value);
    }

    /// @dev Internal hook triggered before deposit override from MoneyFiERC4626UpgradeableBase
    function beforeDeposit(uint256 assets, bytes memory) internal virtual override returns (uint256) {
        return assets;
    }

    /// @dev Get actual asset
    function getActualAssets(address _userAddress, address _tokenAddress) external view virtual returns (uint256) {
        if (_tokenAddress != address(ASSET)) return 0;
        return convertToAssets(balanceOf(_userAddress));
    }

    /// @notice Allows for an emergency withdrawal of funds.
    /// @dev This function is intended to be overridden by derived contracts to implement
    ///      specific emergency withdrawal logic. It is marked as `virtual` to allow customization.
    ///      Access control should be implemented in the overriding function to restrict usage.
    function listUnderlyingAsset() external view returns (address, address) {
        return (address(ASSET), address(ASSET));
    }

    /// @dev Get user strategy information
    function getUserStrategy(address _user) external view returns (StrategyType.UserDeposit memory) {
        return userStrategy[_user];
    }

    /// @notice Sets the emergency stop status for deposits.
    /// @dev This function allows enabling or disabling the emergency stop for deposits.
    ///      It is intended to be overridden by derived contracts to implement specific logic.
    /// @param _isEmergencyStop A boolean indicating whether the emergency stop for deposits
    ///        should be enabled (true) or disabled (false).
    function setEmergencyStop(bool _isEmergencyStop) external onlyRouter {
        emergencyStop = _isEmergencyStop;
    }

    /// @dev Set router
    function setRouter(address _router) external onlyAdmin {
        if (_router == address(0)) {
            revert RequireSettedUpState();
        }
        router = _router;
    }

    /// @dev Set cross chain router
    function setCrossChainRouter(address _crossChainRouter) external onlyAdmin {
        if (_crossChainRouter == address(0)) {
            revert RequireSettedUpState();
        }
        crossChainRouter = _crossChainRouter;
    }

    /// @dev Implement pause
    function pause() external onlyDelegateAdmin {
        _pause();
    }

    /// @dev Implement unpause
    function unpause() external onlyDelegateAdmin {
        _unpause();
    }

    /// @inheritdoc IMoneyFiStartegyUpgradeableBase
    function beforeRebalance() external virtual { }

    /// @inheritdoc IMoneyFiStartegyUpgradeableBase
    function afterRebalance() external virtual { }

    /// @inheritdoc IMoneyFiStartegyUpgradeableBase
    function getUserProfit(address _userAddress) external view returns (int256 reward) {
        // Calculate total accumulate reward
        reward = _getUserProfit(_userAddress);
    }

    /// @dev Return current profit
    function _getUserProfit(address _userAddress) private view returns (int256 reward) {
        reward = int256(_convertToAssets(balanceOf(_userAddress), Math.Rounding.Floor))
            + int256(userStrategy[_userAddress].totalWithDraw) - int256(userStrategy[_userAddress].totalDeposited)
            - userStrategy[_userAddress].totalClaimedProfit;
    }
}
