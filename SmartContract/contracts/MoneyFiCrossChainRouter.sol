// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {DefaultAccessControlEnumerable} from "./security/DefaultAccessControlEnumerable.sol";
import {IMoneyFiCrossChainRouter} from "./interfaces/IMoneyFiCrossChainRouter.sol";
import {IMoneyFiController} from "./interfaces/IMoneyFiController.sol";
import {IMoneyFiFundVault} from "./interfaces/IMoneyFiFundVault.sol";
import {IMoneyFiSwap} from "./interfaces/dex/IMoneyFiSwap.sol";
import {IMoneyFiStrategyUpgradeableCommon} from "./interfaces/IMoneyFiStrategyUpgradeableCommon.sol";
import {RouterCommonType} from "./types/RouterDataType.sol";
import {IMoneyFiBridgeCrossChain} from "./interfaces/IMoneyFiBridgeCrossChain.sol";
import {DexCrossChainType} from "./types/DexCrossChainType.sol";

contract MoneyFiCrossChainRouter is
    UUPSUpgradeable,
    DefaultAccessControlEnumerable,
    PausableUpgradeable,
    IMoneyFiCrossChainRouter
{
    using Math for uint256;
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////////////////
                                USER-FACING STORAGE
    //////////////////////////////////////////////////////////////////////////*/
    IMoneyFiController public moneyFiController;
    IMoneyFiFundVault public moneyFiFundVault;
    mapping(address hotWallet => bool isWhiteList) public isWhiteListHotWallet;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @dev Initialize storage
    /// @param admin_ The address of the initial contract owner. This address will be granted admin-level access.
    /// @param moneyFiController_ The address of the MoneyFiController contract. This contract manages core protocol logic.
    /// @param moneyFundVault_ The address of the MoneyFiFundVault contract. This contract handles fund storage and accounting.
    function initialize(address admin_, address moneyFiController_, address moneyFundVault_) external initializer {
        __UUPSUpgradeable_init(); // Khởi tạo UUPS
        __Pausable_init();
        __DefaultAccessControlEnumerable_init(admin_);

        moneyFiController = IMoneyFiController(moneyFiController_);
        moneyFiFundVault = IMoneyFiFundVault(moneyFundVault_);
    }

    // ------------------------------------------------------------------- //
    // ---------------------------- Write -------------------------------- //
    // ------------------------------------------------------------------- //

    /// @inheritdoc IMoneyFiCrossChainRouter
    function depositFundToStrategyCrossChainFromOperator(
        RouterCommonType.DepositToStrategyCrossChain memory _depositToStrategyCrossChain,
        RouterCommonType.SwapTokenWhenDepositParam memory _swapTokenInternalParam
    ) external payable onlyAtLeastOperator whenNotPaused {
        // Validate dex cross chain sender + receiver
        _validateBeforeTransferFundCrossChain(
            _depositToStrategyCrossChain.crossChainDexSender,
            _depositToStrategyCrossChain.crossChainDexReceiver,
            _depositToStrategyCrossChain.tokenInForBridge
        );

        uint256 convertedFeeIntoRightDecimal = _convertSystemFeeDecimal(
            _depositToStrategyCrossChain.distributionFee, _depositToStrategyCrossChain.tokenInForBridge
        );

        // Transfer fund from funVault to router
        // Already validate in in FundVault contract
        // Validate token transfer in "transferFundToRouter" function
        moneyFiFundVault.transferFundToRouterCrossChain(
            _depositToStrategyCrossChain.depositedTokenAddress,
            _depositToStrategyCrossChain.depositor,
            _depositToStrategyCrossChain.amountIn,
            convertedFeeIntoRightDecimal
        );

        uint256 actualAmountBridgeCrossChain = _depositToStrategyCrossChain.amountIn - convertedFeeIntoRightDecimal;

        // Swap distribute asset to underlying asset in strategy if need

        uint256 tokenInForBridgeBl = _swapTokenWhenDepositFundCrossChainFromOperator(
            _depositToStrategyCrossChain,
            _swapTokenInternalParam,
            _depositToStrategyCrossChain.tokenInForBridge,
            actualAmountBridgeCrossChain
        );

        IERC20(_depositToStrategyCrossChain.tokenInForBridge).safeIncreaseAllowance(
            _depositToStrategyCrossChain.crossChainDexSender, tokenInForBridgeBl
        );

        IMoneyFiBridgeCrossChain(_depositToStrategyCrossChain.crossChainDexSender).takeTransportDeposit{
            value: msg.value
        }(
            DexCrossChainType.DepositCrossChainParam({
                tokenInForBridge: _depositToStrategyCrossChain.tokenInForBridge,
                receiver: _depositToStrategyCrossChain.crossChainDexReceiver,
                tokenOutForBridge: _depositToStrategyCrossChain.tokenOutForBridge,
                depositor: _depositToStrategyCrossChain.depositor,
                amountIn: tokenInForBridgeBl,
                amountOutMin: _depositToStrategyCrossChain.amountOutMin,
                externalCallData: _depositToStrategyCrossChain.externalCallData,
                transportMsg: _depositToStrategyCrossChain.transportMsg
            })
        );

        emit TransferFundCrossChain(
            _depositToStrategyCrossChain.depositor,
            _depositToStrategyCrossChain.depositedTokenAddress,
            _depositToStrategyCrossChain.tokenInForBridge,
            _depositToStrategyCrossChain.tokenOutForBridge,
            _depositToStrategyCrossChain.crossChainDexSender,
            _depositToStrategyCrossChain.crossChainDexReceiver,
            _depositToStrategyCrossChain.amountIn,
            convertedFeeIntoRightDecimal,
            _depositToStrategyCrossChain.transportMsg,
            block.timestamp
        );
    }

    /// @inheritdoc IMoneyFiCrossChainRouter
    function withdrawFundSameChain(
        RouterCommonType.WithdrawSameChainFromOperator[] memory _withdrawSameChainFromOperators,
        address _receiver,
        bool _isReferral,
        uint256 _withdrawFee
    ) external onlyAtLeastOperator whenNotPaused {
        for (uint256 i; i < _withdrawSameChainFromOperators.length;) {
            RouterCommonType.WithdrawSameChainFromOperator memory withdrawSameChainFromOperators =
                _withdrawSameChainFromOperators[i];
            RouterCommonType.SwapParam memory swapParam = withdrawSameChainFromOperators.swapParam;
            RouterCommonType.WithdrawStrategySameChainUndistributed memory unDistributedWithdraw =
                withdrawSameChainFromOperators.unDistributedWithdraw;

            if (
                withdrawSameChainFromOperators.tokenIn != unDistributedWithdraw.tokenAddress
                    && unDistributedWithdraw.tokenAddress != address(0)
            ) {
                revert InvalidSameToken();
            }

            uint256 amountTokenToSend = 0;
            uint256 totalProtocolFee = 0;
            if (unDistributedWithdraw.unDistributedAmount > 0) {
                amountTokenToSend = _withdrawUndistributedFundSameChain(unDistributedWithdraw, _receiver);
            }

            if (withdrawSameChainFromOperators.withdrawStrategySameChains.length > 0) {
                (amountTokenToSend, totalProtocolFee) = _withdrawFundStrategySameChain(
                    withdrawSameChainFromOperators.withdrawStrategySameChains,
                    RouterCommonType.AdditionParam({
                        receiver: _receiver,
                        isReferral: _isReferral,
                        amountTokenToSend: amountTokenToSend,
                        tokenCommon: withdrawSameChainFromOperators.tokenIn
                    })
                );
            }

            uint256 convertedFeeIntoRightDecimal =
                _convertSystemFeeDecimal(_withdrawFee, withdrawSameChainFromOperators.tokenIn);

            if (amountTokenToSend <= convertedFeeIntoRightDecimal) {
                revert InvalidSystemFee();
            }

            if (amountTokenToSend > convertedFeeIntoRightDecimal && _withdrawFee > 0) {
                _transferWithdrawFee(withdrawSameChainFromOperators.tokenIn, convertedFeeIntoRightDecimal);
                amountTokenToSend -= convertedFeeIntoRightDecimal;
                _withdrawFee = 0;
            }

            // Swap into needed token if included
            if (swapParam.tokenReceive != withdrawSameChainFromOperators.tokenIn && swapParam.swapImpl != address(0)) {
                amountTokenToSend = _swapToken(
                    RouterCommonType.DexSwap({
                        swapContract: swapParam.swapImpl,
                        tokenIn: withdrawSameChainFromOperators.tokenIn,
                        tokenOut: swapParam.tokenReceive,
                        receiver: _receiver,
                        amountIn: amountTokenToSend,
                        amountOutMin: swapParam.amountOutMin,
                        externalCall: swapParam.externalCallData,
                        isV3: swapParam.isV3
                    })
                );
                withdrawSameChainFromOperators.tokenIn = swapParam.tokenReceive;
            } else {
                IERC20(withdrawSameChainFromOperators.tokenIn).safeTransfer(_receiver, amountTokenToSend);
            }

            unchecked {
                ++i;
            }

            // Transfer fund to user
            emit WithdrawFundCrossChainFromOperator(
                _receiver,
                withdrawSameChainFromOperators.tokenIn,
                "",
                amountTokenToSend,
                totalProtocolFee,
                _isReferral
                    ? totalProtocolFee.mulDiv(
                        moneyFiController.referralFee(), 10_000 - moneyFiController.referralFee() + 1, Math.Rounding.Floor
                    )
                    : 0,
                convertedFeeIntoRightDecimal,
                block.timestamp
            );
        }
    }

    /// @inheritdoc IMoneyFiCrossChainRouter
    function withdrawFundAnotherChain(
        RouterCommonType.WithdrawStrategyMultipleChainsV2[] memory _withdrawStrategyMultipleChainsV2,
        address _receiver,
        bool _isReferral,
        uint256 _withdrawFee
    ) external payable whenNotPaused onlyAtLeastOperator {
        for (uint256 i = 0; i < _withdrawStrategyMultipleChainsV2.length;) {
            RouterCommonType.WithdrawStrategyMultipleChainsV2 memory withdrawStruct =
                _withdrawStrategyMultipleChainsV2[i];
            RouterCommonType.SwapParam memory swapParam = withdrawStruct.swapParam;

            address tokenToSend = withdrawStruct.tokenIn;
            uint256 amountTokenToSend = 0;
            uint256 totalProtocolFee = 0;

            if (
                withdrawStruct.tokenIn != withdrawStruct.unDistributedWithdraw.tokenAddress
                    && withdrawStruct.unDistributedWithdraw.tokenAddress != address(0)
            ) {
                revert InvalidSameToken();
            }

            if (withdrawStruct.unDistributedWithdraw.unDistributedAmount > 0) {
                amountTokenToSend = _withdrawUndistributedFundSameChain(withdrawStruct.unDistributedWithdraw, _receiver);
            }

            if (withdrawStruct.withdrawStrategySameChains.length > 0) {
                (amountTokenToSend, totalProtocolFee) = _withdrawFundStrategySameChain(
                    withdrawStruct.withdrawStrategySameChains,
                    RouterCommonType.AdditionParam({
                        receiver: _receiver,
                        isReferral: _isReferral,
                        amountTokenToSend: amountTokenToSend,
                        tokenCommon: withdrawStruct.tokenIn
                    })
                );
            }
            uint256 convertedFeeIntoRightDecimal = _convertSystemFeeDecimal(_withdrawFee, address(tokenToSend));

            if (amountTokenToSend <= convertedFeeIntoRightDecimal) {
                revert InvalidSystemFee();
            }

            if (amountTokenToSend > convertedFeeIntoRightDecimal && _withdrawFee > 0) {
                _transferWithdrawFee(tokenToSend, convertedFeeIntoRightDecimal);
                amountTokenToSend -= convertedFeeIntoRightDecimal;
                _withdrawFee = 0;
            }

            // Swap into needed token if included
            if (swapParam.tokenReceive != tokenToSend && swapParam.swapImpl != address(0)) {
                amountTokenToSend = _swapToken(
                    RouterCommonType.DexSwap({
                        swapContract: swapParam.swapImpl,
                        tokenIn: tokenToSend,
                        tokenOut: swapParam.tokenReceive,
                        receiver: address(this),
                        amountIn: amountTokenToSend,
                        amountOutMin: swapParam.amountOutMin,
                        externalCall: swapParam.externalCallData,
                        isV3: swapParam.isV3
                    })
                );
                tokenToSend = swapParam.tokenReceive;
            }

            IERC20(tokenToSend).safeIncreaseAllowance(address(withdrawStruct.crossChain), amountTokenToSend);
            IMoneyFiBridgeCrossChain(withdrawStruct.crossChain).takeTransportWithdraw{value: withdrawStruct.nativeValue}(
                DexCrossChainType.WithdrawCrossChainParam({
                    tokenInForBridge: tokenToSend,
                    receiver: _receiver,
                    amountIn: amountTokenToSend,
                    amountOutMin: amountTokenToSend.mulDiv(10_000 - withdrawStruct.slippage, 10_000, Math.Rounding.Floor),
                    transportMsg: withdrawStruct.transportMsg
                })
            );

            emit WithdrawFundCrossChainFromOperator(
                _receiver,
                tokenToSend,
                withdrawStruct.transportMsg,
                amountTokenToSend,
                totalProtocolFee,
                _isReferral
                    ? totalProtocolFee.mulDiv(
                        moneyFiController.referralFee(), 10_000 - moneyFiController.referralFee() + 1, Math.Rounding.Floor
                    )
                    : 0,
                convertedFeeIntoRightDecimal,
                block.timestamp
            );

            unchecked {
                ++i;
            }
        }
    }

    /// @inheritdoc IMoneyFiCrossChainRouter
    function withdrawFundCrossChainFromOperatorHotWallet(
        RouterCommonType.WithdrawFromOperatorHotWallet[] memory _withdrawFromOperatorHotWallets,
        RouterCommonType.AdditionParamWithDrawHotWallet memory _additionParamWithDrawHotWallet
    ) external onlyAtLeastOperator whenNotPaused {
        if (
            _additionParamWithDrawHotWallet.hotWallet == address(0)
                || !isWhiteListHotWallet[_additionParamWithDrawHotWallet.hotWallet]
        ) {
            revert InvalidHotWallet();
        }

        for (uint256 i; i < _withdrawFromOperatorHotWallets.length;) {
            RouterCommonType.WithdrawFromOperatorHotWallet memory withdrawFromOperatorHotWallet =
                _withdrawFromOperatorHotWallets[i];

            if (
                withdrawFromOperatorHotWallet.tokenIn
                    != withdrawFromOperatorHotWallet.unDistributedWithdraw.tokenAddress
                    && withdrawFromOperatorHotWallet.unDistributedWithdraw.tokenAddress != address(0)
            ) {
                revert InvalidSameToken();
            }

            uint256 amountTokenToSend = 0;
            uint256 totalProtocolFee = 0;
            if (withdrawFromOperatorHotWallet.unDistributedWithdraw.unDistributedAmount > 0) {
                amountTokenToSend = _withdrawUndistributedFundSameChain(
                    withdrawFromOperatorHotWallet.unDistributedWithdraw, _additionParamWithDrawHotWallet.depositor
                );
            }

            if (withdrawFromOperatorHotWallet.withdrawStrategySameChains.length > 0) {
                (amountTokenToSend, totalProtocolFee) = _withdrawFundStrategySameChain(
                    withdrawFromOperatorHotWallet.withdrawStrategySameChains,
                    RouterCommonType.AdditionParam({
                        receiver: _additionParamWithDrawHotWallet.depositor,
                        isReferral: _additionParamWithDrawHotWallet.isReferral,
                        amountTokenToSend: amountTokenToSend,
                        tokenCommon: withdrawFromOperatorHotWallet.tokenIn
                    })
                );
            }

            uint256 convertedFeeIntoRightDecimal = _convertSystemFeeDecimal(
                _additionParamWithDrawHotWallet.withdrawFee, withdrawFromOperatorHotWallet.tokenIn
            );

            if (amountTokenToSend <= convertedFeeIntoRightDecimal) {
                revert InvalidSystemFee();
            }

            if (amountTokenToSend > convertedFeeIntoRightDecimal && _additionParamWithDrawHotWallet.withdrawFee > 0) {
                _transferWithdrawFee(withdrawFromOperatorHotWallet.tokenIn, convertedFeeIntoRightDecimal);
                amountTokenToSend -= convertedFeeIntoRightDecimal;
                _additionParamWithDrawHotWallet.withdrawFee = 0;
            }

            IERC20(withdrawFromOperatorHotWallet.tokenIn).safeTransfer(
                _additionParamWithDrawHotWallet.hotWallet, amountTokenToSend
            );

            unchecked {
                ++i;
            }

            // Transfer fund to user
            emit WithdrawFundCrossChainFromOperatorHotWallet(
                _additionParamWithDrawHotWallet.depositor,
                _additionParamWithDrawHotWallet.hotWallet,
                withdrawFromOperatorHotWallet.tokenIn,
                _additionParamWithDrawHotWallet.tokenOut,
                withdrawFromOperatorHotWallet.uuid,
                amountTokenToSend,
                totalProtocolFee,
                _additionParamWithDrawHotWallet.isReferral
                    ? totalProtocolFee.mulDiv(
                        moneyFiController.referralFee(), 10_000 - moneyFiController.referralFee() + 1, Math.Rounding.Floor
                    )
                    : 0,
                convertedFeeIntoRightDecimal,
                _additionParamWithDrawHotWallet.destinationChainId,
                block.timestamp
            );
        }
    }

    /// @inheritdoc IMoneyFiCrossChainRouter
    function pause() external onlyDelegateAdmin {
        _pause();
    }

    /// @inheritdoc IMoneyFiCrossChainRouter
    function unpause() external onlyDelegateAdmin {
        _unpause();
    }

    /// @inheritdoc IMoneyFiCrossChainRouter
    function upgradeControllerAndFundVault(address moneyFiController_, address moneyFundVault_) external onlyAdmin {
        if (moneyFiController_ == address(0) || moneyFundVault_ == address(0)) {
            revert RequiredAddressNotNull();
        }
        moneyFiController = IMoneyFiController(moneyFiController_);
        moneyFiFundVault = IMoneyFiFundVault(moneyFundVault_);
    }

    /// @inheritdoc IMoneyFiCrossChainRouter
    function collectNative(address payable _to) external virtual whenNotPaused onlyDelegateAdmin {
        if (_to == address(0)) {
            revert RequiredAddressNotNull();
        }
        (bool sent,) = _to.call{value: address(this).balance}("");
        if (!sent) {
            revert FailedSendNative();
        }
        emit CollectNativeToken(_to);
    }

    /// @inheritdoc IMoneyFiCrossChainRouter
    function setWhiteListHotWallet(address _whiteList, bool _isWhiteListHotWallet) external onlyDelegateAdmin {
        if (_whiteList == address(0)) {
            revert RequiredAddressNotNull();
        }

        isWhiteListHotWallet[_whiteList] = _isWhiteListHotWallet;
        emit SetWhiteListHotWallet(_whiteList, _isWhiteListHotWallet);
    }

    // ------------------------------------------------------------------- //
    // --------------------------- Internal  ------------------------------//
    // ------------------------------------------------------------------- //
    /// @dev Override _authorizeUpgrade function to add authorization
    function _authorizeUpgrade(address _newImplementation) internal override onlyDelegateAdmin {}

    /// @dev Swap deposited token to underlying asset strategy before swap token
    function _swapTokenWhenDepositFundCrossChainFromOperator(
        RouterCommonType.DepositToStrategyCrossChain memory _depositToStrategyCrossChain,
        RouterCommonType.SwapTokenWhenDepositParam memory _swapTokenInternalParam,
        address _tokenOut,
        uint256 _actualAmountIn
    ) internal returns (uint256 amountOut) {
        if (_depositToStrategyCrossChain.tokenInForBridge != _depositToStrategyCrossChain.depositedTokenAddress) {
            // Swap distribute asset to underlying asset in strategy if need
            if (
                _swapTokenInternalParam.swapContract == address(0) || _swapTokenInternalParam.amountOutMin == 0
                    || !moneyFiController.isDexSwapInternalActive(_swapTokenInternalParam.swapContract)
            ) {
                revert InvalidSwapParam();
            }

            // Swap to underlying assest
            amountOut = _swapToken(
                RouterCommonType.DexSwap({
                    swapContract: _swapTokenInternalParam.swapContract,
                    tokenIn: _depositToStrategyCrossChain.depositedTokenAddress,
                    tokenOut: _tokenOut,
                    receiver: address(this),
                    amountIn: _actualAmountIn,
                    amountOutMin: _swapTokenInternalParam.amountOutMin,
                    externalCall: _swapTokenInternalParam.externalCallData,
                    isV3: _swapTokenInternalParam.isV3
                })
            );
        } else {
            // If tokenInForBridge is same as depositedTokenAddress, no need to swap
            amountOut = _actualAmountIn;
        }
    }

    /// @dev With draw strategy fund same chain
    function _withdrawFundStrategySameChain(
        RouterCommonType.WithdrawStrategySameChain[] memory _withdrawStrategySameChains,
        RouterCommonType.AdditionParam memory _additionParam
    ) internal returns (uint256, uint256) {
        uint256 i = 0;
        uint256 totalProtocolFee = 0;
        address sender = _additionParam.receiver;

        // Transfer strategy fund to user
        for (; i < _withdrawStrategySameChains.length;) {
            IMoneyFiStrategyUpgradeableCommon strategy =
                IMoneyFiStrategyUpgradeableCommon(_withdrawStrategySameChains[i].strategyAddress);
            uint256 maxUserShare = strategy.balanceOf(sender);

            if (_additionParam.tokenCommon != strategy.asset()) {
                revert InvalidSameToken();
            }

            if (
                _withdrawStrategySameChains[i].share <= 0 || maxUserShare < _withdrawStrategySameChains[i].share
                    || maxUserShare <= 0
            ) {
                revert InvalidShare();
            }

            int256 curUserProfit = strategy.getUserProfit(sender);
            // protocol fee include referral fee
            (uint256 protocolFee, uint256 referralFee) = _getUserSystemProfit(curUserProfit, _additionParam.isReferral);

            if (protocolFee > referralFee) totalProtocolFee += protocolFee - referralFee;
            uint256 maxWithDraw = strategy.redeem(maxUserShare, address(this), sender, "");

            uint256 expectWithdrawAsset = _withdrawStrategySameChains[i].share == maxUserShare
                ? maxWithDraw
                : maxWithDraw.mulDiv(_withdrawStrategySameChains[i].share, maxUserShare, Math.Rounding.Floor);

            if (protocolFee > 0 && maxWithDraw >= protocolFee) {
                IERC20(strategy.asset()).safeIncreaseAllowance(address(moneyFiFundVault), protocolFee);
                moneyFiFundVault.increaseProtocolAndReferralFee(strategy.asset(), protocolFee, referralFee);
                maxWithDraw = maxWithDraw - protocolFee;
            }

            if (expectWithdrawAsset >= maxWithDraw) {
                _additionParam.amountTokenToSend += maxWithDraw;
                maxWithDraw = 0;
            } else {
                _additionParam.amountTokenToSend += expectWithdrawAsset;
                maxWithDraw -= expectWithdrawAsset;
            }

            if (maxWithDraw > 0) {
                _rebalanceStrategy(
                    RouterCommonType.RebalanceStrategy({
                        strategy: strategy,
                        asset: strategy.asset(),
                        owner: sender,
                        rebalanceAmount: maxWithDraw,
                        receivedReward: curUserProfit - int256(protocolFee),
                        protocolFee: 0,
                        referralFee: 0,
                        rebalanceFee: 0
                    })
                );
            }

            unchecked {
                ++i;
            }
        }

        return (_additionParam.amountTokenToSend, totalProtocolFee);
    }

    /// @dev With draw strategy fund same chain
    function _withdrawUndistributedFundSameChain(
        RouterCommonType.WithdrawStrategySameChainUndistributed memory _unDistributedWithdraw,
        address _receiver
    ) internal returns (uint256) {
        moneyFiFundVault.withdrawUnDistributedFundToUser(
            _receiver, address(this), _unDistributedWithdraw.tokenAddress, _unDistributedWithdraw.unDistributedAmount
        );

        return _unDistributedWithdraw.unDistributedAmount;
    }

    /// @dev Validate param when transfer fund cross chain
    function _validateBeforeTransferFundCrossChain(
        address _crossChainDexSender,
        address _crossChainDexReceiver,
        address _tokenInForBridge
    ) internal view {
        // Check dex cross chain sender is active
        if (!moneyFiController.isDexCrossChainInternalActive(_crossChainDexSender)) {
            revert InvalidDexCrossChainInternal();
        }

        // Check dex cross chain receiver is active
        if (!moneyFiController.isDexCrossChainExternalActive(_crossChainDexReceiver)) {
            revert InvalidDexCrossChainExternal();
        }

        if (!moneyFiController.isCrossChainSwapSameType(_crossChainDexSender, _crossChainDexReceiver)) {
            revert InvalidTypeDexCrossChainSenderReceiver();
        }

        if (!moneyFiController.isTokenSupportInternalActive(_tokenInForBridge)) {
            revert InvalidSupportedTokenInternal();
        }
    }

    /// @dev Convert to right decimal fee
    function _convertSystemFeeDecimal(uint256 _originalFee, address _asset)
        internal
        view
        returns (uint256 convertFee)
    {
        if (_originalFee > moneyFiController.averageSystemActionFee()) {
            revert InvalidSystemFee();
        }

        uint256 tokenDecimal = ERC20(_asset).decimals();
        if (tokenDecimal != 18) {
            uint256 decimalNeedToBuff = 18 - tokenDecimal;
            convertFee = _originalFee.mulDiv(1, 10 ** decimalNeedToBuff, Math.Rounding.Floor);
        } else {
            convertFee = _originalFee;
        }
    }

    /// @dev Swap token
    function _swapToken(RouterCommonType.DexSwap memory _dexSwap) internal returns (uint256) {
        if (!moneyFiController.isDexSwapInternalActive(_dexSwap.swapContract)) {
            revert InvalidSwapParam();
        }
        IERC20(_dexSwap.tokenIn).safeIncreaseAllowance(address(_dexSwap.swapContract), _dexSwap.amountIn);

        try IMoneyFiSwap(_dexSwap.swapContract).swapToken(
            _dexSwap.tokenIn,
            _dexSwap.tokenOut,
            _dexSwap.amountIn,
            _dexSwap.amountOutMin,
            _dexSwap.receiver,
            _dexSwap.isV3,
            _dexSwap.externalCall
        ) returns (uint256 actualAmountOut) {
            return actualAmountOut;
        } catch {
            revert SwapFailed();
        }
    }

    /// @dev Rebalance strategy
    function _rebalanceStrategy(RouterCommonType.RebalanceStrategy memory _rebalanceStrategyParam) internal {
        _rebalanceStrategyParam.strategy.beforeRebalance();
        IERC20(_rebalanceStrategyParam.asset).safeIncreaseAllowance(
            address(moneyFiFundVault),
            _rebalanceStrategyParam.rebalanceAmount + _rebalanceStrategyParam.protocolFee
                + _rebalanceStrategyParam.rebalanceFee
        );
        moneyFiFundVault.rebalanceFundSameChain(
            _rebalanceStrategyParam.asset,
            _rebalanceStrategyParam.owner,
            _rebalanceStrategyParam.rebalanceAmount,
            _rebalanceStrategyParam.protocolFee,
            _rebalanceStrategyParam.referralFee,
            _rebalanceStrategyParam.rebalanceFee
        );
        emit RebalanceFundSameChain(
            address(_rebalanceStrategyParam.strategy),
            _rebalanceStrategyParam.owner,
            _rebalanceStrategyParam.asset,
            _rebalanceStrategyParam.rebalanceAmount,
            int256(_rebalanceStrategyParam.receivedReward),
            0,
            0,
            _rebalanceStrategyParam.rebalanceFee,
            block.timestamp
        );
        _rebalanceStrategyParam.strategy.afterRebalance();
    }

    /// @dev Get system profit
    function _getUserSystemProfit(int256 _totalProfit, bool _isReferral)
        internal
        view
        returns (uint256 protocolFee, uint256 referralFee)
    {
        if (_totalProfit > 0) {
            protocolFee = uint256(_totalProfit).mulDiv(moneyFiController.protocolFee(), 10_000, Math.Rounding.Floor);
            if (_isReferral) {
                referralFee = protocolFee.mulDiv(moneyFiController.referralFee(), 10_000, Math.Rounding.Floor);
            }
        }
    }

    /// @dev Transfer withdraw fe to fund vault
    function _transferWithdrawFee(address _asset, uint256 _amount) internal {
        IERC20(_asset).safeIncreaseAllowance(address(moneyFiFundVault), _amount);
        moneyFiFundVault.receiveWithdrawFee(_asset, _amount);
    }
}
