// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {DefaultAccessControlEnumerable} from "./security/DefaultAccessControlEnumerable.sol";
import {IMoneyFiRouter} from "./interfaces/IMoneyFiRouter.sol";
import {IMoneyFiController} from "./interfaces/IMoneyFiController.sol";
import {IMoneyFiFundVault} from "./interfaces/IMoneyFiFundVault.sol";
import {IMoneyFiSwap} from "./interfaces/dex/IMoneyFiSwap.sol";
import {IMoneyFiStrategyUpgradeableCommon} from "./interfaces/IMoneyFiStrategyUpgradeableCommon.sol";
import {RouterCommonType} from "./types/RouterDataType.sol";

contract MoneyFiRouter is
    UUPSUpgradeable,
    DefaultAccessControlEnumerable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    IMoneyFiRouter
{
    using Math for uint256;
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////////////////
                                USER-FACING STORAGE
    //////////////////////////////////////////////////////////////////////////*/
    IMoneyFiController public moneyFiController;
    IMoneyFiFundVault public moneyFiFundVault;

    /// @dev Prevent spam withdraw request
    mapping(address user => uint256 timestamp) public lastRequestTimestamp;
    /// @dev Withdraw request cooldown period -- second unit
    uint256 public coolDownPeriodWithdrawRequest;

    /*////////////////////////////////////////////////////////////////////////// 
                                    Mofidier 
    //////////////////////////////////////////////////////////////////////////*/

    modifier withdrawRateLimit() {
        uint256 lastRequest = lastRequestTimestamp[msg.sender];
        uint256 nextAllowed = lastRequest + coolDownPeriodWithdrawRequest;

        if (block.timestamp < nextAllowed) {
            revert WithdrawRateLimit();
        }

        _;
        lastRequestTimestamp[msg.sender] = block.timestamp;
    }

    constructor() {
        _disableInitializers();
    }

    /// @dev Initialize storage
    /// @param admin_ The address of the initial contract owner. This address will be granted admin-level access.
    /// @param moneyFiController_ The address of the MoneyFiController contract. This contract manages core protocol logic.
    /// @param moneyFundVault_ The address of the MoneyFiFundVault contract. This contract handles fund storage and accounting.
    function initialize(address admin_, address moneyFiController_, address moneyFundVault_) external initializer {
        __UUPSUpgradeable_init(); // Khởi tạo UUPS
        __Pausable_init(); // Khởi tạo Pausable
        __ReentrancyGuard_init();
        __DefaultAccessControlEnumerable_init(admin_);

        moneyFiController = IMoneyFiController(moneyFiController_);
        moneyFiFundVault = IMoneyFiFundVault(moneyFundVault_);
    }

    // ------------------------------------------------------------------- //
    // ---------------------------- Write -------------------------------- //
    // ------------------------------------------------------------------- //

    /// @inheritdoc IMoneyFiRouter
    function depositFund(RouterCommonType.DepositParam memory _depositParam) external whenNotPaused nonReentrant {
        IERC20(_depositParam.tokenAddress).safeTransferFrom(msg.sender, address(this), _depositParam.amount);
        IERC20(_depositParam.tokenAddress).safeIncreaseAllowance(address(moneyFiFundVault), _depositParam.amount);

        uint256 actualDepositAmount =
            moneyFiFundVault.depositFund(_depositParam.tokenAddress, msg.sender, _depositParam.amount);

        emit DepositFund(
            msg.sender, _depositParam.tokenAddress, _depositParam.amount, actualDepositAmount, block.timestamp
        );
    }

    /// @inheritdoc IMoneyFiRouter
    function depositFundToStrategySameChainFromOperator(
        RouterCommonType.DepositToStrategySameChain memory _depositToStrategy,
        RouterCommonType.SwapTokenWhenDepositParam memory _swapTokenParam
    ) external onlyAtLeastOperator whenNotPaused {
        // Check strategy active
        if (!moneyFiController.isStrategyInternalActive(_depositToStrategy.strategyAddress)) {
            revert InvalidStrategyInternalChain();
        }
        address underlyingAsset = IMoneyFiStrategyUpgradeableCommon(_depositToStrategy.strategyAddress).asset();

        uint256 convertedFeeIntoRightDecimal =
            _convertSystemFeeDecimal(_depositToStrategy.distributionFee, underlyingAsset);

        // Transfer fund from funVault to router
        moneyFiFundVault.transferFundToRouter(
            _depositToStrategy.depositedTokenAddress,
            _depositToStrategy.depositor,
            _depositToStrategy.amount,
            convertedFeeIntoRightDecimal
        );

        // Swap distribute asset to underlying asset in strategy if need + validate swap params
        uint256 actualSwapAmountOut = _swapTokenWhenDepositFundSameChainFromOperator(
            _depositToStrategy,
            _swapTokenParam,
            underlyingAsset,
            _depositToStrategy.amount - convertedFeeIntoRightDecimal
        );

        uint256 underlyingAssetBalance = IERC20(underlyingAsset).balanceOf(address(this));

        // Validate total deposit value from strategy to pool
        // Validate user position not exceed max deposit amount
        moneyFiController.validateDistributeFundToStrategy(
            _depositToStrategy.strategyAddress, _depositToStrategy.depositor, underlyingAssetBalance
        );

        if (underlyingAssetBalance < _swapTokenParam.amountOutMin) {
            revert InsufficientBalance();
        }

        IERC20(underlyingAsset).safeIncreaseAllowance(_depositToStrategy.strategyAddress, underlyingAssetBalance);

        // Deposit fund to strategy
        uint256 strategyShare = IMoneyFiStrategyUpgradeableCommon(_depositToStrategy.strategyAddress).deposit(
            underlyingAssetBalance, _depositToStrategy.depositor, _depositToStrategy.externalCallData
        );

        emit DistributeUserFund(
            _depositToStrategy.strategyAddress,
            _depositToStrategy.depositor,
            _depositToStrategy.depositedTokenAddress,
            _depositToStrategy.amount,
            _swapTokenParam.swapContract,
            underlyingAsset,
            actualSwapAmountOut,
            strategyShare,
            convertedFeeIntoRightDecimal,
            block.timestamp
        );
    }

    /// @inheritdoc IMoneyFiRouter
    function withdrawFundSameChain(
        RouterCommonType.WithdrawStrategySameChain[] memory _withdrawStrategySameChains,
        RouterCommonType.WithdrawStrategySameChainUndistributed[] memory _unDistributedWithdraw,
        bool _isReferral,
        bytes memory _signature,
        RouterCommonType.SwapParam memory swapParam
    ) external withdrawRateLimit whenNotPaused {
        moneyFiController.verifySignatureReferral(_isReferral, _signature, msg.sender);

        // Transfer un-distribute fund to user
        if (_unDistributedWithdraw.length > 0) {
            _withdrawUndistributedFundSameChain(_unDistributedWithdraw, swapParam);
        }
        if (_withdrawStrategySameChains.length > 0) {
            _withdrawFundStrategySameChain(_withdrawStrategySameChains, swapParam, _isReferral);
        }
    }

    /// @inheritdoc IMoneyFiRouter
    function createWithdrawRequestOnAnotherChain(
        RouterCommonType.WithdrawStrategyMultipleChains[] memory _withdrawStrategyMultipleChains
    ) external withdrawRateLimit whenNotPaused {
        uint16 _withdrawStrategyMultipleChainsLength = uint16(_withdrawStrategyMultipleChains.length);

        if (_withdrawStrategyMultipleChains.length <= 0) {
            revert InvalidWithdrawRequestArg();
        }

        for (uint16 index; index < _withdrawStrategyMultipleChainsLength;) {
            _validateWithdrawRequestArg(_withdrawStrategyMultipleChains[index]);

            emit WithdrawRequest(
                msg.sender,
                _withdrawStrategyMultipleChains[index].chainId,
                _withdrawStrategyMultipleChains[index].withdrawStrategySameChains,
                _withdrawStrategyMultipleChains[index].unDistributedWithdraw,
                _withdrawStrategyMultipleChains[index].tokenOut,
                block.timestamp
            );

            unchecked {
                ++index;
            }
        }
    }

    /// @inheritdoc IMoneyFiRouter
    function emergencyWithdrawFund(address strategyAddress) external onlyDelegateAdmin {
        if (!moneyFiController.isStrategyInternalActive(strategyAddress)) {
            revert InvalidStrategyInternalChain();
        }

        IMoneyFiStrategyUpgradeableCommon(strategyAddress).emergencyWithdraw();
    }

    /// @inheritdoc IMoneyFiRouter
    function setEmergencyStop(address strategyAddress, bool isEmergencyStop) external onlyDelegateAdmin {
        if (!moneyFiController.isStrategyInternalActive(strategyAddress)) {
            revert InvalidStrategyInternalChain();
        }

        IMoneyFiStrategyUpgradeableCommon(strategyAddress).setEmergencyStop(isEmergencyStop);
    }

    /// @inheritdoc IMoneyFiRouter
    function rebalanceFundSameChain(RouterCommonType.RebalanceStrategySameChain memory _rebalanceParam)
        external
        onlyAtLeastOperator
        whenNotPaused
    {
        IMoneyFiStrategyUpgradeableCommon strategy = IMoneyFiStrategyUpgradeableCommon(_rebalanceParam.strategyAddress);

        // Get current user share
        uint256 totalUserShare = strategy.balanceOf(_rebalanceParam.userAddress);

        // Get underlying asset of strategy
        address underlyingAsset = strategy.asset();

        if (!moneyFiController.isTokenSupportInternalActive(underlyingAsset)) {
            revert InvalidSupportedTokenInternal();
        }

        if (totalUserShare <= 0) {
            revert InvalidShare();
        }

        int256 curUserProfit = strategy.getUserProfit(_rebalanceParam.userAddress);

        // protocol fee include referral fee
        (uint256 protocolFee, uint256 referralFee) = _getUserSystemProfit(curUserProfit, _rebalanceParam.isReferral);

        // Redeem asset to router
        uint256 redeemAsset = strategy.redeem(totalUserShare, address(this), _rebalanceParam.userAddress, "");

        uint256 convertedFeeIntoRightDecimal = _convertSystemFeeDecimal(_rebalanceParam.rebalancesFee, strategy.asset());

        if (redeemAsset < convertedFeeIntoRightDecimal + protocolFee) {
            revert InvalidRebalanceAmount();
        }

        _rebalanceStrategy(
            RouterCommonType.RebalanceStrategy({
                strategy: strategy,
                asset: strategy.asset(),
                owner: _rebalanceParam.userAddress,
                rebalanceAmount: redeemAsset - protocolFee - convertedFeeIntoRightDecimal,
                receivedReward: curUserProfit - int256(protocolFee),
                protocolFee: protocolFee,
                referralFee: referralFee,
                rebalanceFee: convertedFeeIntoRightDecimal
            })
        );
    }

    /// @inheritdoc IMoneyFiRouter
    function setCoolDownPeriodWithdrawRequest(uint256 _newPeriod) external onlyDelegateAdmin {
        coolDownPeriodWithdrawRequest = _newPeriod;
    }

    /// @inheritdoc IMoneyFiRouter
    function pause() external onlyDelegateAdmin {
        _pause();
    }

    /// @inheritdoc IMoneyFiRouter
    function unpause() external onlyDelegateAdmin {
        _unpause();
    }

    /// @inheritdoc IMoneyFiRouter
    function upgradeControllerAndFundVault(address moneyFiController_, address moneyFundVault_) external onlyAdmin {
        if (moneyFiController_ == address(0) || moneyFundVault_ == address(0)) {
            revert RequiredAddressNotNull();
        }
        moneyFiController = IMoneyFiController(moneyFiController_);
        moneyFiFundVault = IMoneyFiFundVault(moneyFundVault_);
    }

    /// @inheritdoc IMoneyFiRouter
    function getNextWithdrawRequestTime(address user) external view returns (uint256 nextAllowedTimestamp) {
        return lastRequestTimestamp[user] + coolDownPeriodWithdrawRequest;
    }

    // ------------------------------------------------------------------- //
    // --------------------------- Internal  ------------------------------//
    // ------------------------------------------------------------------- //
    /// @dev Override _authorizeUpgrade function to add authorization
    function _authorizeUpgrade(address _newImplementation) internal override onlyDelegateAdmin {}

    /// @dev Swap deposited token to underlying asset strategy
    function _swapTokenWhenDepositFundSameChainFromOperator(
        RouterCommonType.DepositToStrategySameChain memory _depositToStrategy,
        RouterCommonType.SwapTokenWhenDepositParam memory _swapTokenParam,
        address _underlyingAsset,
        uint256 _actualAmountin
    ) internal returns (uint256 amountOut) {
        // Swap distribute asset to underlying asset in strategy if need
        if (_depositToStrategy.depositedTokenAddress != _underlyingAsset) {
            amountOut = _swapToken(
                RouterCommonType.DexSwap({
                    swapContract: _swapTokenParam.swapContract,
                    tokenIn: _depositToStrategy.depositedTokenAddress,
                    tokenOut: _underlyingAsset,
                    receiver: address(this),
                    amountIn: _actualAmountin,
                    amountOutMin: _swapTokenParam.amountOutMin,
                    externalCall: _swapTokenParam.externalCallData,
                    isV3: _swapTokenParam.isV3
                })
            );
        } else {
            amountOut = _actualAmountin;
        }
    }

    /// @dev With draw strategy fund same chain
    function _withdrawFundStrategySameChain(
        RouterCommonType.WithdrawStrategySameChain[] memory _withdrawStrategySameChains,
        RouterCommonType.SwapParam memory _swapParam,
        bool _isReferral
    ) internal {
        uint256 i = 0;
        // Transfer strategy fund to user
        for (; i < _withdrawStrategySameChains.length;) {
            IMoneyFiStrategyUpgradeableCommon strategy =
                IMoneyFiStrategyUpgradeableCommon(_withdrawStrategySameChains[i].strategyAddress);

            uint256 maxUserShare = strategy.balanceOf(msg.sender);

            if (_withdrawStrategySameChains[i].share <= 0 || maxUserShare < _withdrawStrategySameChains[i].share) {
                revert InvalidShare();
            }

            int256 curUserProfit = strategy.getUserProfit(msg.sender);

            // protocol fee includes referral fee
            (uint256 protocolFee, uint256 referralFee) = _getUserSystemProfit(curUserProfit, _isReferral);

            uint256 maxWithDraw = strategy.redeem(maxUserShare, address(this), msg.sender, "");
            uint256 expectWithdrawAsset = _withdrawStrategySameChains[i].share == maxUserShare
                ? maxWithDraw
                : maxWithDraw.mulDiv(_withdrawStrategySameChains[i].share, maxUserShare, Math.Rounding.Floor);

            if (protocolFee > 0 && maxWithDraw >= protocolFee) {
                IERC20(strategy.asset()).safeIncreaseAllowance(address(moneyFiFundVault), protocolFee);
                moneyFiFundVault.increaseProtocolAndReferralFee(strategy.asset(), protocolFee, referralFee);
                maxWithDraw = maxWithDraw - protocolFee;
            }

            if (expectWithdrawAsset >= maxWithDraw) {
                expectWithdrawAsset = maxWithDraw;
                maxWithDraw = 0;
            } else {
                maxWithDraw -= expectWithdrawAsset;
            }

            // Rebalance remain fund
            if (maxWithDraw > 0) {
                _rebalanceStrategy(
                    RouterCommonType.RebalanceStrategy({
                        strategy: strategy,
                        asset: strategy.asset(),
                        owner: msg.sender,
                        rebalanceAmount: maxWithDraw,
                        receivedReward: int256(curUserProfit) - int256(protocolFee),
                        protocolFee: 0,
                        referralFee: 0,
                        rebalanceFee: 0
                    })
                );
            }

            if (_swapParam.swapImpl != address(0) && _swapParam.tokenReceive != address(0)) {
                _swapToken(
                    RouterCommonType.DexSwap({
                        swapContract: _swapParam.swapImpl,
                        tokenIn: strategy.asset(),
                        tokenOut: _swapParam.tokenReceive,
                        receiver: msg.sender,
                        amountIn: expectWithdrawAsset,
                        amountOutMin: _swapParam.amountOutMin,
                        externalCall: _swapParam.externalCallData,
                        isV3: _swapParam.isV3
                    })
                );
            } else {
                IERC20(strategy.asset()).safeTransfer(msg.sender, expectWithdrawAsset);
            }

            emit WithDrawFundSameChain(
                msg.sender,
                msg.sender,
                _withdrawStrategySameChains[i].strategyAddress,
                strategy.asset(),
                _withdrawStrategySameChains[i].share,
                expectWithdrawAsset,
                referralFee.mulDiv(10_000, moneyFiController.referralFee() + 1, Math.Rounding.Floor),
                referralFee,
                block.timestamp
            );

            unchecked {
                ++i;
            }
        }
    }

    /// @dev Withdraw undistributed fund same chain
    function _withdrawUndistributedFundSameChain(
        RouterCommonType.WithdrawStrategySameChainUndistributed[] memory _unDistributedWithdraw,
        RouterCommonType.SwapParam memory _swapParam
    ) internal {
        // Transfer un-distribute fund to user
        uint256 unDistributedLength = _unDistributedWithdraw.length;
        uint256 i;
        for (; i < unDistributedLength;) {
            if (_swapParam.tokenReceive != address(0) && _swapParam.swapImpl != address(0)) {
                moneyFiFundVault.withdrawUnDistributedFundToUser(
                    msg.sender,
                    address(this),
                    _unDistributedWithdraw[i].tokenAddress,
                    _unDistributedWithdraw[i].unDistributedAmount
                );
                _swapToken(
                    RouterCommonType.DexSwap({
                        swapContract: _swapParam.swapImpl,
                        tokenIn: _unDistributedWithdraw[i].tokenAddress,
                        tokenOut: _swapParam.tokenReceive,
                        receiver: msg.sender,
                        amountIn: _unDistributedWithdraw[i].unDistributedAmount,
                        amountOutMin: 0,
                        externalCall: "",
                        isV3: _swapParam.isV3
                    })
                );
            } else {
                moneyFiFundVault.withdrawUnDistributedFundToUser(
                    msg.sender,
                    msg.sender,
                    _unDistributedWithdraw[i].tokenAddress,
                    _unDistributedWithdraw[i].unDistributedAmount
                );
            }

            emit WithDrawFundSameChain(
                msg.sender,
                msg.sender,
                address(0),
                _unDistributedWithdraw[i].tokenAddress,
                0,
                _unDistributedWithdraw[i].unDistributedAmount,
                0,
                0,
                block.timestamp
            );

            unchecked {
                i++;
            }
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
            _rebalanceStrategyParam.protocolFee - _rebalanceStrategyParam.referralFee,
            _rebalanceStrategyParam.referralFee,
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

    function _validateWithdrawRequestArg(
        RouterCommonType.WithdrawStrategyMultipleChains memory _withdrawStrategyMultipleChain
    ) internal pure {
        if (
            _withdrawStrategyMultipleChain.withdrawStrategySameChains.length <= 0
                && _withdrawStrategyMultipleChain.unDistributedWithdraw.length <= 0
        ) {
            revert InvalidWithdrawRequestArg();
        }

        if (_withdrawStrategyMultipleChain.tokenOut == address(0)) {
            revert RequiredAddressNotNull();
        }
        uint16 withdrawStrategySameChainLength =
            uint16(_withdrawStrategyMultipleChain.withdrawStrategySameChains.length);
        uint16 unDistributedWithdrawLength = uint16(_withdrawStrategyMultipleChain.unDistributedWithdraw.length);

        for (uint16 index1; index1 < withdrawStrategySameChainLength;) {
            if (
                _withdrawStrategyMultipleChain.withdrawStrategySameChains[index1].share <= 0
                    || _withdrawStrategyMultipleChain.withdrawStrategySameChains[index1].strategyAddress == address(0)
            ) {
                revert InvalidWithdrawRequestArg();
            }

            unchecked {
                ++index1;
            }
        }

        for (uint16 index2; index2 < unDistributedWithdrawLength;) {
            if (
                _withdrawStrategyMultipleChain.unDistributedWithdraw[index2].unDistributedAmount <= 0
                    || _withdrawStrategyMultipleChain.unDistributedWithdraw[index2].tokenAddress == address(0)
            ) {
                revert InvalidWithdrawRequestArg();
            }
            unchecked {
                ++index2;
            }
        }
    }
}
