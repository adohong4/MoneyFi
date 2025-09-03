// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import { SignatureChecker } from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import { DefaultAccessControlEnumerable } from "./security/DefaultAccessControlEnumerable.sol";
import { MoneyFiControllerType } from "./types/ControllerDataType.sol";
import { IMoneyFiController } from "./interfaces/IMoneyFiController.sol";
import { IMoneyFiERC4626UpgradeableBase } from "./interfaces/IMoneyFiERC4626UpgradeableBase.sol";

contract MoneyFiController is UUPSUpgradeable, DefaultAccessControlEnumerable, IMoneyFiController {
    using Math for uint256;

    /*//////////////////////////////////////////////////////////////////////////
                                USER-FACING STORAGE
    //////////////////////////////////////////////////////////////////////////*/

    // Fee in percentage
    // 10000 = 100%
    uint256 public protocolFee;
    uint256 public nonce;
    address public router;
    address public crossChainRouter;
    address public signer;
    address public hotWallet;
    // Default 10^18 decimal
    uint256 public averageSystemActionFee;

    // Referral fee base of protocol fee
    // Div to 10_000.
    uint256 public referralFee;
    bool public isEnableReferralSignature;

    // Store supported token internal information
    mapping(address supportAssetToken => MoneyFiControllerType.TokenInfo token) public tokenInternal;

    // Store supported token external information
    mapping(address supportAssetToken => MoneyFiControllerType.TokenInfo token) public tokenExternal;

    // Store cross chains swap internal information
    mapping(address crossChainSwap => MoneyFiControllerType.CrossChainParam crossChainSwapParam) public crossChainSwapInternal;

    // Store cross chains swap external information
    mapping(address crossChainSwap => MoneyFiControllerType.CrossChainParam crossChainSwapParam) public crossChainSwapExternal;

    // Store strategy internal information
    mapping(address strategy => MoneyFiControllerType.Strategy data) public strategyInternal;

    // Store strategy external information
    mapping(address strategy => MoneyFiControllerType.StrategyExternal data) public strategyExternal;

    // Store dex swap internal information
    mapping(address internalSwap => MoneyFiControllerType.InternalSwapParam internalSwapParam) public dexSwapInternal;

    // Store dex swap external information
    mapping(address externalSwap => MoneyFiControllerType.InternalSwapParam internalSwapParam) public dexSwapExternal;

    // Max percent of total liquidity our strategy have already deposit in whitelist pool
    // Div to 10_000
    mapping(address token => uint256 maxPercentLiquidityStrategy) public maxPercentLiquidityStrategyToken;

    // Max deposit value of user in whitelist pool
    mapping(address token => uint256 maxDepositValue) public maxDepositValueToken;

    /*////////////////////////////////////////////////////////////////////////// 
                                    Mofidier 
    //////////////////////////////////////////////////////////////////////////*/

    modifier onlyRouter() {
        if (msg.sender != router && msg.sender != crossChainRouter) {
            revert InvalidRouter();
        }
        _;
    }

    constructor() {
        _disableInitializers();
    }

    /// @param admin_ The address of the initial contract owner.
    function initialize(address admin_, uint256 protocolFee_) public initializer {
        __DefaultAccessControlEnumerable_init(admin_);
        protocolFee = protocolFee_;
    }

    /*////////////////////////////////////////////////////////////////////////// 
                                    Write Function
    //////////////////////////////////////////////////////////////////////////*/

    /// @inheritdoc IMoneyFiController
    function setSigner(address _signer) public onlyDelegateAdmin {
        if (_signer == address(0)) {
            revert RequiredAddressNotNull();
        }
        signer = _signer;
    }

    /// @inheritdoc IMoneyFiController
    function setProtocolFee(uint256 _protocolFee) public onlyDelegateAdmin {
        protocolFee = _protocolFee;
    }

    /// @inheritdoc IMoneyFiController
    function setTokenInfoInternal(address _token, MoneyFiControllerType.TokenInfo memory _tokenInfo) public onlyDelegateAdmin {
        tokenInternal[_token].minDepositAmount = _tokenInfo.minDepositAmount;
        tokenInternal[_token].decimals = _tokenInfo.decimals;
        tokenInternal[_token].chainId = _tokenInfo.chainId;
        tokenInternal[_token].isActive = _tokenInfo.isActive;

        if (tokenInternal[_token].lpTokenAddress == address(0)) {
            tokenInternal[_token].lpTokenAddress = _tokenInfo.lpTokenAddress;
        }
    }

    /// @inheritdoc IMoneyFiController
    function setTokenInfoExternal(address _token, MoneyFiControllerType.TokenInfo memory _tokenInfo) public onlyDelegateAdmin {
        tokenExternal[_token] = _tokenInfo;
    }

    /// @inheritdoc IMoneyFiController
    function setStrategyInternal(
        address _strategy,
        MoneyFiControllerType.Strategy memory _strategyInfo
    )
        public
        onlyDelegateAdmin
    {
        strategyInternal[_strategy] = _strategyInfo;
    }

    /// @inheritdoc IMoneyFiController
    function setStrategyExternal(
        address _strategy,
        MoneyFiControllerType.StrategyExternal memory _strategyInfo
    )
        public
        onlyDelegateAdmin
    {
        strategyExternal[_strategy] = _strategyInfo;
    }

    /// @inheritdoc IMoneyFiController
    function setEnableReferralSignature(bool _isEnableReferralSignature) public onlyDelegateAdmin {
        isEnableReferralSignature = _isEnableReferralSignature;
    }

    /// @inheritdoc IMoneyFiController
    function setCrossChainSwapInternal(
        MoneyFiControllerType.CrossChainParam calldata _crossChainParam,
        address _crossChainSwap
    )
        public
        onlyDelegateAdmin
    {
        crossChainSwapInternal[_crossChainSwap] = _crossChainParam;
    }

    /// @inheritdoc IMoneyFiController
    function setCrossChainSwapExternal(
        MoneyFiControllerType.CrossChainParam calldata _crossChainParam,
        address _crossChainSwap
    )
        public
        onlyDelegateAdmin
    {
        crossChainSwapExternal[_crossChainSwap] = _crossChainParam;
    }

    /// @inheritdoc IMoneyFiController
    function setDexInternalSwap(
        MoneyFiControllerType.InternalSwapParam calldata _internalParam,
        address _internalSwap
    )
        public
        onlyDelegateAdmin
    {
        dexSwapInternal[_internalSwap] = _internalParam;
    }

    /// @inheritdoc IMoneyFiController
    function setDexExternalSwap(
        MoneyFiControllerType.InternalSwapParam calldata _internalParam,
        address _internalSwap
    )
        public
        onlyDelegateAdmin
    {
        dexSwapExternal[_internalSwap] = _internalParam;
    }

    /// @inheritdoc IMoneyFiController
    function setRouter(address _router) public onlyDelegateAdmin {
        if (_router == address(0)) {
            revert RequiredAddressNotNull();
        }
        router = _router;
    }

    /// @inheritdoc IMoneyFiController
    function setCrossChainRouter(address _crossChainRouter) public onlyDelegateAdmin {
        if (_crossChainRouter == address(0)) {
            revert RequiredAddressNotNull();
        }
        crossChainRouter = _crossChainRouter;
    }

    /// @inheritdoc IMoneyFiController
    function setMaxPercentLiquidityStrategy(
        address _tokenAddress,
        uint256 _maxPercentLiquidityStrategy
    )
        public
        onlyDelegateAdmin
    {
        maxPercentLiquidityStrategyToken[_tokenAddress] = _maxPercentLiquidityStrategy;
    }

    /// @inheritdoc IMoneyFiController
    function setMaxDepositValue(address _tokenAddress, uint256 _maxDepositValue) public onlyDelegateAdmin {
        maxDepositValueToken[_tokenAddress] = _maxDepositValue;
    }

    /// @inheritdoc IMoneyFiController
    function setMaxPercentLiquidityStrategyToken(
        address _tokenAddress,
        uint256 _maxPercentLiquidityStrategyToken
    )
        public
        onlyDelegateAdmin
    {
        maxPercentLiquidityStrategyToken[_tokenAddress] = _maxPercentLiquidityStrategyToken;
    }

    /// @inheritdoc IMoneyFiController
    function setReferralFee(uint256 _referralFee) public onlyDelegateAdmin {
        referralFee = _referralFee;
    }

    /// @inheritdoc IMoneyFiController
    function setHotWallet(address _hotWallet) public onlyAdmin {
        hotWallet = _hotWallet;
    }

    /// @inheritdoc IMoneyFiController
    function setAverageSystemActionFee(uint256 _averageSystemActionFee) public onlyAtLeastOperator {
        averageSystemActionFee = _averageSystemActionFee;
    }

    /// @inheritdoc IMoneyFiController
    function verifySignatureReferral(bool _isReferral, bytes memory _signature, address _sender) public onlyRouter {
        if (isEnableReferralSignature) {
            bytes32 message =
                MessageHashUtils.toEthSignedMessageHash(keccak256(abi.encodePacked(signer, nonce++, _sender, _isReferral)));

            //validate the signature was signed from the contract's signer
            if (!SignatureChecker.isValidSignatureNow(signer, message, _signature)) {
                revert InvalidSignature(_signature);
            }
        }
    }

    /*////////////////////////////////////////////////////////////////////////// 
                                    Read Function
    //////////////////////////////////////////////////////////////////////////*/
    /// @inheritdoc IMoneyFiController
    function getSupportedTokenInternalInfor(address _token) public view returns (MoneyFiControllerType.TokenInfo memory) {
        return tokenInternal[_token];
    }

    /// @inheritdoc IMoneyFiController
    function isStrategyInternalActive(address _strategy) public view returns (bool) {
        return strategyInternal[_strategy].isActive;
    }

    /// @inheritdoc IMoneyFiController
    function isStrategyExternalActive(address _strategy) public view returns (bool) {
        return strategyExternal[_strategy].isActive;
    }

    /// @inheritdoc IMoneyFiController
    function isDexCrossChainInternalActive(address _dexCrossChain) external view returns (bool) {
        return crossChainSwapInternal[_dexCrossChain].isActive;
    }

    /// @inheritdoc IMoneyFiController
    function isDexCrossChainExternalActive(address _dexCrossChain) external view returns (bool) {
        return crossChainSwapExternal[_dexCrossChain].isActive;
    }

    /// @inheritdoc IMoneyFiController
    function isTokenSupportInternalActive(address _token) public view returns (bool) {
        return tokenInternal[_token].isActive;
    }

    /// @inheritdoc IMoneyFiController
    function isTokenSupportExternalActive(address _token) public view returns (bool) {
        return tokenExternal[_token].isActive;
    }

    /// @inheritdoc IMoneyFiController
    function isDexSwapInternalActive(address _dexSwap) public view returns (bool) {
        return dexSwapInternal[_dexSwap].isActive;
    }

    /// @inheritdoc IMoneyFiController
    function isDexSwapExternalActive(address _dexSwap) public view returns (bool) {
        return dexSwapExternal[_dexSwap].isActive;
    }

    /// @inheritdoc IMoneyFiController
    function isValidUnderlyingAssetStrategyExternal(address _strategy, address _underlyingAsset) public view returns (bool) {
        return strategyExternal[_strategy].underlyingAsset == _underlyingAsset;
    }

    /// @inheritdoc IMoneyFiController
    function isCrossChainSwapSameType(address _crossChainSender, address _crossChainReceiver) public view returns (bool) {
        return crossChainSwapInternal[_crossChainSender].typeDex == crossChainSwapExternal[_crossChainReceiver].typeDex;
    }

    /// @inheritdoc IMoneyFiController
    function validateDistributeFundToStrategy(address _strategy, address _depositor, uint256 _depositAmount) public view {
        IMoneyFiERC4626UpgradeableBase strategyInstance = IMoneyFiERC4626UpgradeableBase(_strategy);
        uint256 maxPercentLiquidityStrategyStrategy = maxPercentLiquidityStrategyToken[strategyInstance.asset()];
        uint256 maxDepositValueTokenStrategy = maxDepositValueToken[strategyInstance.asset()];

        uint256 totalStrategyAssets = strategyInstance.totalAssets();
        uint256 poolTVL = strategyInstance.totalLiquidWhitelistPool();
        uint256 posTotalAssetAfterDeposit = totalStrategyAssets + _depositAmount;
        uint256 currentDepositorAsset = strategyInstance.convertToAssets(strategyInstance.balanceOf(_depositor));

        // Make sure max percent liquidity in strategy smaller than maxPercentLiquidityStrategyStrategy's percent of whitelist
        if (posTotalAssetAfterDeposit.mulDiv(10_000, poolTVL, Math.Rounding.Floor) > maxPercentLiquidityStrategyStrategy) {
            revert ExceedMaxPercentLiquidStrategyInPool();
        }

        // Make sure max user's position in strategy smaller than maxDepositValueTokenStrategy
        if (currentDepositorAsset + _depositAmount > maxDepositValueTokenStrategy) {
            revert ExceedMaxDepositValueInPool();
        }
    }

    /*////////////////////////////////////////////////////////////////////////// 
                                    Internal Function
    //////////////////////////////////////////////////////////////////////////*/
    /// @dev Override _authorizeUpgrade function to add authorization
    function _authorizeUpgrade(address newImplementation) internal override onlyDelegateAdmin { }
}
