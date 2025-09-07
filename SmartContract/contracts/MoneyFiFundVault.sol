// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {DefaultAccessControlEnumerable} from "./security/DefaultAccessControlEnumerable.sol";
import {IMoneyFiFundVault} from "./interfaces/IMoneyFiFundVault.sol";
import {IMoneyFiController} from "./interfaces/IMoneyFiController.sol";
import {IMoneyFiTokenLp} from "./interfaces/IMoneyFiTokenLp.sol";
import {MoneyFiFundVaultType} from "./types/FundVaultDataType.sol";
import {MoneyFiControllerType} from "./types/ControllerDataType.sol";

contract MoneyFiFundVault is
    UUPSUpgradeable,
    PausableUpgradeable,
    DefaultAccessControlEnumerable,
    ReentrancyGuardUpgradeable,
    IMoneyFiFundVault
{
    using SafeERC20 for IERC20;
    using Math for uint256;

    /*//////////////////////////////////////////////////////////////////////////
                                USER-FACING STORAGE
    //////////////////////////////////////////////////////////////////////////*/

    // Controller address
    address public controller;

    // Receiver address
    address public feeTo;

    // Store user deposit information follow on token
    mapping(address token => mapping(address user => MoneyFiFundVaultType.UserDepositInfor depositInfor))
        userDepositInfor;

    // Store total token fee
    mapping(address token => uint256 totalFee) public totalProtocolFee;

    // Store user to list deposited strategy
    mapping(address user => address[] strategy) public userStrategy;

    // Store token to distribute fee
    mapping(address token => uint256 fee) public distributeFee;

    // Store token to rebalance fee
    mapping(address token => uint256 fee) public rebalanceFee;

    // Store token to referral fee
    mapping(address token => uint256 fee) public referralFee;

    // Store token to referral fee
    mapping(address token => uint256 fee) public withdrawFee;

    /*////////////////////////////////////////////////////////////////////////// 
                                    Mofidier 
    //////////////////////////////////////////////////////////////////////////*/
    modifier onlyRouter() {
        if (
            msg.sender != IMoneyFiController(controller).router()
                && msg.sender != IMoneyFiController(controller).crossChainRouter()
        ) {
            revert InvalidRouter();
        }
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /*////////////////////////////////////////////////////////////////////////// 
                                    Write Function
    //////////////////////////////////////////////////////////////////////////*/
    function initialize(address admin_, address controller_, address feeTo_) external initializer {
        __UUPSUpgradeable_init(); // Khởi tạo UUPS
        __Pausable_init(); // Khởi tạo Pausable
        __ReentrancyGuard_init(); // Khởi tạo ReentrancyGuard
        __DefaultAccessControlEnumerable_init(admin_); // Khởi tạo AccessControl
        controller = controller_;
        feeTo = feeTo_;
    }

    /// @inheritdoc IMoneyFiFundVault
    function depositFund(address _tokenAddress, address _receiver, uint256 _amount)
        external
        whenNotPaused
        nonReentrant
        returns (uint256)
    {
        _validateDeposit(_amount, _tokenAddress);

        userDepositInfor[_tokenAddress][_receiver].originalDepositAmount += _amount;
        userDepositInfor[_tokenAddress][_receiver].currentDepositAmount += _amount;
        userDepositInfor[_tokenAddress][_receiver].updatedAt = block.timestamp;
        _mintLp(_tokenAddress, _receiver, _amount);

        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _amount);

        emit DepositFundVault(_tokenAddress, _receiver, _amount, _amount, block.timestamp);

        return _amount;
    }

    /// @inheritdoc IMoneyFiFundVault
    function transferFundToRouter(
        address _tokenAddress,
        address _userAddress,
        uint256 _amount,
        uint256 _distributionFee
    ) external onlyRouter whenNotPaused {
        uint256 actualDistributionAmount =
            _transferFundToRouter(_tokenAddress, _userAddress, _amount, 0, _distributionFee);
        emit TransferFundToRouterFundVault(_tokenAddress, _amount, actualDistributionAmount, block.timestamp);
    }

    /// @inheritdoc IMoneyFiFundVault
    function transferFundToRouterCrossChain(
        address _tokenAddress,
        address _userAddress,
        uint256 _amount,
        uint256 _distributionFee
    ) external onlyRouter whenNotPaused {
        uint256 actualDistributionAmount =
            _transferFundToRouter(_tokenAddress, _userAddress, _amount, _amount, _distributionFee);
        emit TransferFundToRouterFundVaultCrossChain(
            _tokenAddress, _amount, actualDistributionAmount, _amount, block.timestamp
        );
    }

    /// @inheritdoc IMoneyFiFundVault
    function transferFundFromRouterToFundVault(address _tokenAddress, address _depositor, uint256 _amount)
        public
        onlyRouter
        whenNotPaused
    {
        _validateToken(_tokenAddress);

        if (_amount <= 0) {
            revert InvalidAmount();
        }

        uint256 preTokenBalance = IERC20(_tokenAddress).balanceOf(address(this));
        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _amount);
        uint256 posTokenBalance = IERC20(_tokenAddress).balanceOf(address(this));

        if (posTokenBalance - preTokenBalance != _amount) {
            revert InvalidAmount();
        }

        userDepositInfor[_tokenAddress][_depositor].currentDepositAmount += _amount;
        userDepositInfor[_tokenAddress][_depositor].updatedAt = block.timestamp;
        _mintLp(_tokenAddress, _depositor, _amount);
        emit TransferFundFromRouterToFundVault(_tokenAddress, _amount, block.timestamp);
    }

    /// @inheritdoc IMoneyFiFundVault
    function withdrawUnDistributedFundToUser(
        address _userAddress,
        address _receiver,
        address _tokenAddress,
        uint256 _amount
    ) external onlyRouter whenNotPaused {
        if (_amount <= 0) {
            revert InvalidAmount();
        }
        uint256 currentDepositAmount = userDepositInfor[_tokenAddress][_userAddress].currentDepositAmount;

        if (currentDepositAmount < _amount) {
            revert InsufficientAmount();
        }

        userDepositInfor[_tokenAddress][_userAddress].currentDepositAmount -= _amount;
        userDepositInfor[_tokenAddress][_userAddress].updatedAt = block.timestamp;
        _burnLp(_tokenAddress, _userAddress, _amount);
        IERC20(_tokenAddress).safeTransfer(_receiver, _amount);

        emit WithdrawUnDistributedFundToUserFundVault(_userAddress, _tokenAddress, _amount, block.timestamp);
    }

    /// @inheritdoc IMoneyFiFundVault
    function receiveWithdrawFee(address _tokenAddress, uint256 _amount) external onlyRouter whenNotPaused {
        _validateToken(_tokenAddress);
        withdrawFee[_tokenAddress] += _amount;

        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _amount);
    }

    /// @inheritdoc IMoneyFiFundVault
    function rebalanceFundSameChain(
        address _token,
        address _receiver,
        uint256 _rebalanceAmount,
        uint256 _protocolFee,
        uint256 _referralFee,
        uint256 _rebalanceFee
    ) external onlyRouter {
        _validateToken(_token);

        // protocol fee includes referral fee
        uint256 totalUnderlyingAssetTransfer = _rebalanceAmount + _protocolFee + _rebalanceFee;

        IERC20(_token).safeTransferFrom(msg.sender, address(this), totalUnderlyingAssetTransfer);

        userDepositInfor[_token][_receiver].currentDepositAmount += _rebalanceAmount;
        userDepositInfor[_token][_receiver].updatedAt = block.timestamp;

        if (_referralFee > 0) {
            referralFee[_token] += _referralFee;
        }
        rebalanceFee[_token] += _rebalanceFee;
        if (_protocolFee > _referralFee) {
            totalProtocolFee[_token] += _protocolFee - _referralFee;
        }

        _mintLp(_token, _receiver, _rebalanceAmount);
        emit RebalanceFundSameChainFundVault(
            _token, _receiver, _rebalanceAmount, _protocolFee, _referralFee, _rebalanceFee, block.timestamp
        );
    }

    /// @inheritdoc IMoneyFiFundVault
    function increaseProtocolAndReferralFee(address _token, uint256 _protocolFee, uint256 _referralFee)
        external
        onlyRouter
    {
        _validateToken(_token);

        if (_referralFee > 0) {
            referralFee[_token] += _referralFee;
        }

        if (_protocolFee > _referralFee) {
            totalProtocolFee[_token] += _protocolFee - _referralFee;
        }

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _protocolFee);
    }

    /// @inheritdoc IMoneyFiFundVault
    function withdrawProtocolFee(address[] memory supportedTokens) external onlyDelegateAdmin whenNotPaused {
        uint256 supportedTokensLength = supportedTokens.length;

        for (uint256 i; i < supportedTokensLength;) {
            address token = supportedTokens[i];
            uint256 fee = totalProtocolFee[token];
            if (fee > 0) {
                totalProtocolFee[token] = 0;
                IERC20(token).safeTransfer(feeTo, fee);
                emit WithDrawProtocolFee(token, fee, block.timestamp);
            }

            unchecked {
                ++i;
            }
        }
    }

    /// @inheritdoc IMoneyFiFundVault
    function withdrawDistributeFee(address[] memory supportedTokens) external onlyDelegateAdmin whenNotPaused {
        uint256 supportedTokensLength = supportedTokens.length;

        for (uint256 i; i < supportedTokensLength;) {
            address token = supportedTokens[i];
            uint256 fee = distributeFee[token];
            if (fee > 0) {
                distributeFee[token] = 0;
                IERC20(token).safeTransfer(feeTo, fee);
                emit WithDrawDistributeFee(token, fee, block.timestamp);
            }

            unchecked {
                ++i;
            }
        }
    }

    /// @inheritdoc IMoneyFiFundVault
    function withdrawRebalanceFee(address[] memory supportedTokens) external onlyDelegateAdmin whenNotPaused {
        uint256 supportedTokensLength = supportedTokens.length;

        for (uint256 i; i < supportedTokensLength;) {
            address token = supportedTokens[i];
            uint256 fee = rebalanceFee[token];
            if (fee > 0) {
                rebalanceFee[token] = 0;
                IERC20(token).safeTransfer(feeTo, fee);
                emit WithDrawRebalanceFee(token, fee, block.timestamp);
            }

            unchecked {
                ++i;
            }
        }
    }

    /// @inheritdoc IMoneyFiFundVault
    function withdrawReferralFee(address[] memory supportedTokens) external onlyDelegateAdmin whenNotPaused {
        uint256 supportedTokensLength = supportedTokens.length;

        for (uint256 i; i < supportedTokensLength;) {
            address token = supportedTokens[i];
            uint256 fee = referralFee[token];
            if (fee > 0) {
                referralFee[token] = 0;
                IERC20(token).safeTransfer(feeTo, fee);
                emit WithDrawReferralFee(token, fee, block.timestamp);
            }

            unchecked {
                ++i;
            }
        }
    }

    /// @inheritdoc IMoneyFiFundVault
    function withdrawWithdrawalFee(address[] memory supportedTokens) external onlyDelegateAdmin whenNotPaused {
        uint256 supportedTokensLength = supportedTokens.length;

        for (uint256 i; i < supportedTokensLength;) {
            address token = supportedTokens[i];
            uint256 fee = withdrawFee[token];
            if (fee > 0) {
                withdrawFee[token] = 0;
                IERC20(token).safeTransfer(feeTo, fee);
                emit WithDrawWithdrawalFee(token, fee, block.timestamp);
            }

            unchecked {
                ++i;
            }
        }
    }

    /// @inheritdoc IMoneyFiFundVault
    function setController(address _moneyFiController) external onlyAdmin {
        if (_moneyFiController == address(0)) {
            revert RequiredAddressNotNull();
        }
        controller = _moneyFiController;
    }

    /// @inheritdoc IMoneyFiFundVault
    function setFeeTo(address _feeTo) external onlyAdmin {
        if (_feeTo == address(0)) {
            revert RequiredAddressNotNull();
        }
        feeTo = _feeTo;
    }

    /// @inheritdoc IMoneyFiFundVault
    function pause() external onlyDelegateAdmin {
        _pause();
    }

    /// @inheritdoc IMoneyFiFundVault
    function unpause() external onlyDelegateAdmin {
        _unpause();
    }

    /*////////////////////////////////////////////////////////////////////////// 
                                    Read Function
    //////////////////////////////////////////////////////////////////////////*/

    /// @inheritdoc IMoneyFiFundVault
    function getUserDepositInfor(address _token, address _user)
        external
        view
        returns (MoneyFiFundVaultType.UserDepositInfor memory)
    {
        return userDepositInfor[_token][_user];
    }

    /// @dev Transfer fund to router
    function _transferFundToRouter(
        address _tokenAddress,
        address _userAddress,
        uint256 _amount,
        uint256 _minusOriginAmount,
        uint256 _distributionFee
    ) internal whenNotPaused returns (uint256 actualDistributionAmount) {
        if (_amount <= 0) {
            revert InvalidAmount();
        }

        if (_amount <= _distributionFee) {
            revert InvalidDistributionFee();
        }

        actualDistributionAmount = _amount - _distributionFee;

        _validateToken(_tokenAddress);

        IERC20 token = IERC20(_tokenAddress);
        MoneyFiFundVaultType.UserDepositInfor memory userDepoisit = userDepositInfor[_tokenAddress][_userAddress];

        if (userDepoisit.currentDepositAmount < _amount) {
            revert InsufficientAmount();
        }

        uint256 remainAmount = userDepoisit.currentDepositAmount - _amount;

        if (token.balanceOf(address(this)) < _amount) {
            revert InsufficientAmount();
        }

        if (
            userDepositInfor[_tokenAddress][_userAddress].originalDepositAmount >= _minusOriginAmount
                && _minusOriginAmount >= 0
        ) {
            userDepositInfor[_tokenAddress][_userAddress].originalDepositAmount -= _minusOriginAmount;
        }

        userDepositInfor[_tokenAddress][_userAddress].currentDepositAmount = remainAmount;
        userDepositInfor[_tokenAddress][_userAddress].updatedAt = block.timestamp;
        distributeFee[_tokenAddress] += _distributionFee;
        _burnLp(_tokenAddress, _userAddress, _amount);

        token.safeTransfer(msg.sender, actualDistributionAmount);
    }

    /*////////////////////////////////////////////////////////////////////////// 
                                    Internal Function
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Override with authentication modifer.
    function _authorizeUpgrade(address newImplementation) internal override onlyDelegateAdmin {}

    // / @dev Validate active token and minimum deposit amount
    function _validateDeposit(uint256 _amount, address _token) internal view {
        MoneyFiControllerType.TokenInfo memory tokenInfo =
            IMoneyFiController(controller).getSupportedTokenInternalInfor(_token);

        if (!tokenInfo.isActive) {
            revert InvalidSupportedTokenInternal();
        }

        if (tokenInfo.minDepositAmount > _amount) {
            revert InvalidAmount();
        }
    }

    /// @dev Validate token active
    function _validateToken(address _token) internal view {
        if (!IMoneyFiController(controller).getSupportedTokenInternalInfor(_token).isActive) {
            revert InvalidSupportedTokenInternal();
        }
    }

    /// @dev Mint lp token
    function _mintLp(address _token, address _depositor, uint256 _amount) internal {
        MoneyFiControllerType.TokenInfo memory tokenInfo =
            IMoneyFiController(controller).getSupportedTokenInternalInfor(_token);
        address lpToken = tokenInfo.lpTokenAddress;

        if (lpToken == address(0)) {
            revert InvalidLpToken();
        }

        IMoneyFiTokenLp(lpToken).mint(_depositor, _amount);
    }

    /// @dev Burn lp token
    function _burnLp(address _token, address _depositor, uint256 _amount) internal {
        MoneyFiControllerType.TokenInfo memory tokenInfo =
            IMoneyFiController(controller).getSupportedTokenInternalInfor(_token);
        address lpToken = tokenInfo.lpTokenAddress;

        if (lpToken == address(0)) {
            revert InvalidLpToken();
        }

        if (IERC20(lpToken).balanceOf(_depositor) < _amount) {
            revert InvalidLpAmount();
        }

        IMoneyFiTokenLp(lpToken).burn(_depositor, _amount);
    }
}
