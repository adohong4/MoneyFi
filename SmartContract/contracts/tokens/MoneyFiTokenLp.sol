// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.20;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol"; // Chỉ giữ ContextUpgradeable

import {IMoneyFiTokenLp} from "../interfaces/IMoneyFiTokenLp.sol";
import {DefaultAccessControlEnumerable} from "../security/DefaultAccessControlEnumerable.sol";

/// @title MoneyFiV1Token.
/// @notice See document in {IMoneyFiLpStrategy}.
contract MoneyFiTokenLp is ERC20Upgradeable, UUPSUpgradeable, DefaultAccessControlEnumerable, IMoneyFiTokenLp {
    address public fundVault;
    uint8 public decimalsOverride;

    modifier onlyFundVault() {
        if (msg.sender != fundVault) {
            revert InvalidFundVault();
        }
        _;
    }
    /// @dev Disable initializers.

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address fundVault_, address admin_, string memory name_, string memory symbol_, uint8 decimals_)
        public
        initializer
    {
        __ERC20_init(name_, symbol_);
        __DefaultAccessControlEnumerable_init(admin_);
        __UUPSUpgradeable_init();
        fundVault = fundVault_;
        decimalsOverride = decimals_;
    }

    /// @dev Override function transfer from erc20 standard add {whenNotPaused}.
    function _update(address from, address to, uint256 value) internal override onlyFundVault {
        super._update(from, to, value);
    }

    function mint(address account, uint256 amount) public override onlyFundVault {
        super._mint(account, amount);
    }

    function burn(address account, uint256 amount) public override onlyFundVault {
        super._burn(account, amount);
    }

    function decimals() public view override returns (uint8) {
        return decimalsOverride;
    }

    /// @dev Override with authentication modifer.
    function _authorizeUpgrade(address newImplementation) internal override onlyDelegateAdmin {}

    function _msgSender() internal view override(ContextUpgradeable) returns (address) {
        // Xóa Context
        return msg.sender;
    }

    function _msgData() internal pure override(ContextUpgradeable) returns (bytes calldata) {
        // Xóa Context
        return msg.data;
    }

    function _contextSuffixLength() internal pure override(ContextUpgradeable) returns (uint256) {
        // Xóa Context
        return 0;
    }

    function _spendAllowance(address owner, address spender, uint256 value) internal override onlyFundVault {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance < type(uint256).max) {
            // Allow fund vault spend allowance without approve
            if (currentAllowance < value && msg.sender != fundVault) {
                revert ERC20InsufficientAllowance(spender, currentAllowance, value);
            }
            unchecked {
                _approve(owner, spender, currentAllowance - value, false);
            }
        }
    }
}
