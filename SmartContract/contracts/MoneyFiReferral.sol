// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {IMoneyFiReferral} from "./interfaces/IMoneyFiReferral.sol";
import {SignatureUtils} from "./libraries/SignatureUtils.sol";
import {DefaultAccessControlEnumerable} from "./security/DefaultAccessControlEnumerable.sol";

contract MoneyFiReferral is Pausable, ReentrancyGuard, DefaultAccessControlEnumerable, IMoneyFiReferral {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////////////////
                                USER-FACING STORAGE
    //////////////////////////////////////////////////////////////////////////*/
    address public signer;
    address remainTo;
    uint256 public nonce;
    bool public isActive = true;
    IERC20 public token;

    constructor(address signer_, address remainTo_, address admin_, address token_) {
        signer = signer_;
        remainTo = remainTo_;
        token = IERC20(token_);
        __DefaultAccessControlEnumerable_init(admin_);
    }

    /*////////////////////////////////////////////////////////////////////////// 
                                    Write Function
    //////////////////////////////////////////////////////////////////////////*/

    /// @inheritdoc IMoneyFiReferral
    function deposit(uint256 _amount) external {
        token.safeTransferFrom(msg.sender, address(this), _amount);
    }

    /// @inheritdoc IMoneyFiReferral
    function withdraw(uint256 _amount) external nonReentrant onlyDelegateAdmin {
        if (token.balanceOf(address(this)) < _amount) {
            revert InsufficientBalance();
        }

        token.safeTransfer(remainTo, _amount);
        emit Withdraw(remainTo, _amount, block.timestamp);
    }

    /// @inheritdoc IMoneyFiReferral
    function claim(uint256 _amount, bytes memory _signature) external whenNotPaused nonReentrant {
        address sender = msg.sender;
        bytes32 message =
            MessageHashUtils.toEthSignedMessageHash(keccak256(abi.encodePacked(signer, nonce++, sender, _amount)));

        //validate the signature was signed from the contract's signer
        if (!SignatureChecker.isValidSignatureNow(signer, message, _signature)) {
            revert InvalidSignature(_signature);
        }

        if (token.balanceOf(address(this)) < _amount) {
            revert InsufficientBalance();
        }

        token.safeTransfer(sender, _amount);
        emit Claim(_amount, address(this), msg.sender, block.timestamp);
    }

    /// @inheritdoc IMoneyFiReferral
    function setSigner(address _signer) public onlyDelegateAdmin {
        if (_signer == address(0)) {
            revert RequiredAddressNotNull();
        }

        signer = _signer;
    }

    /// @inheritdoc IMoneyFiReferral
    function pause() external onlyDelegateAdmin {
        isActive = false;
        _pause();
    }

    /// @inheritdoc IMoneyFiReferral
    function unpause() external onlyDelegateAdmin {
        isActive = true;
        _unpause();
    }
}
