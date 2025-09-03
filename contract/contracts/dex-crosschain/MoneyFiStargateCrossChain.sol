// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IStargate } from "@stargatefinance/stg-evm-v2/src/interfaces/IStargate.sol";
import { MessagingFee, OFTReceipt, SendParam } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { DefaultAccessControlEnumerable } from "src/security/DefaultAccessControlEnumerable.sol";
import { IMoneyFiBridgeCrossChain } from "src/interfaces/IMoneyFiBridgeCrossChain.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { EnumerableMap } from "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import { ILayerZeroComposer } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroComposer.sol";
import { OFTComposeMsgCodec } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/libs/OFTComposeMsgCodec.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { IMoneyFiCrossChainRouter } from "src/interfaces/IMoneyFiCrossChainRouter.sol";
import { RouterCommonType } from "src/types/RouterDataType.sol";
import { DexCrossChainType } from "src/types/DexCrossChainType.sol";
import { IMoneyFiFundVault } from "src/interfaces/IMoneyFiFundVault.sol";
import { IMoneyFiController } from "src/interfaces/IMoneyFiController.sol";

contract MoneyFiStargateCrossChain is
    UUPSUpgradeable,
    IMoneyFiBridgeCrossChain,
    ILayerZeroComposer,
    DefaultAccessControlEnumerable
{
    using EnumerableMap for EnumerableMap.UintToAddressMap;
    using OptionsBuilder for bytes;
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////////////////
                                USER-FACING STORAGE
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Router cross chain address
    address public fundVault;
    /// @dev Controller address
    address public controller;
    /// @dev lz endpoint address
    address public LZ_ENDPOINT;
    /// @dev Mapping chainID to stargateEndpointID
    mapping(uint256 => uint256) public stargateEndpointID;
    /// @dev Mapping token address to
    mapping(address => mapping(uint256 => address)) public stargateChainPoolToken; // mapping token address to
    /// @dev Mapping srcId => guiId => message payload
    mapping(uint32 => mapping(bytes32 => bytes)) public payload;
    /// @dev Mapping guid => originMessage => isTransfer
    mapping(bytes32 guid => mapping(bytes originMessage => bool isTransfer)) public isTransferToFunVaultLzComposeAlert;

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address admin_,
        address moneyfiFundVault_,
        address controller_,
        address lzEndpoint_
    )
        external
        initializer
    {
        if (admin_ == address(0) || moneyfiFundVault_ == address(0) || lzEndpoint_ == address(0) || controller_ == address(0)) {
            revert RequiredAddressNotNull();
        }
        __DefaultAccessControlEnumerable_init(admin_);
        fundVault = moneyfiFundVault_;
        controller = controller_;
        LZ_ENDPOINT = lzEndpoint_;
    }

    /*////////////////////////////////////////////////////////////////////////// 
                                    Mofidier 
    //////////////////////////////////////////////////////////////////////////*/
    modifier supportBridgeToken(address _token, uint256 _chainId) {
        if (stargateChainPoolToken[_token][_chainId] == address(0)) {
            revert TokenNotSupportBridgeToTargetChain(_token);
        }
        _;
    }

    modifier onlyRouter() {
        if (msg.sender != IMoneyFiController(controller).crossChainRouter()) {
            revert InvalidRouter();
        }
        _;
    }
    /*////////////////////////////////////////////////////////////////////////// 
                                    Write Function
    //////////////////////////////////////////////////////////////////////////*/

    /// @inheritdoc IMoneyFiBridgeCrossChain
    function takeTransportDeposit(DexCrossChainType.DepositCrossChainParam memory _depositParam) external payable onlyRouter {
        bytes memory composeMsg = endcodeComposeMsg(
            _depositParam.depositor, _depositParam.tokenOutForBridge, _depositParam.amountIn, _depositParam.externalCallData
        );

        (uint32 dstChainId, uint128 composeGasLimit) = abi.decode(_depositParam.transportMsg, (uint32, uint128));

        (uint256 valueToSend, SendParam memory sendParam, MessagingFee memory messagingFee) = prepareForTransport(
            _depositParam.tokenInForBridge,
            dstChainId,
            _depositParam.receiver,
            _depositParam.amountIn,
            _depositParam.amountOutMin,
            composeMsg,
            composeGasLimit
        );

        address stargate = stargateChainPoolToken[_depositParam.tokenInForBridge][dstChainId];

        bytes memory message = endcodeComposeMsg(
            _depositParam.depositor, _depositParam.tokenOutForBridge, sendParam.minAmountLD, _depositParam.externalCallData
        );

        sendParam.composeMsg = message;

        IERC20(_depositParam.tokenInForBridge).safeTransferFrom(msg.sender, address(this), _depositParam.amountIn);
        IERC20(_depositParam.tokenInForBridge).safeIncreaseAllowance(stargate, _depositParam.amountIn);

        if (msg.value < valueToSend) {
            revert InsufficientValue(msg.value, valueToSend);
        }

        IStargate(stargate).sendToken{ value: msg.value }(sendParam, messagingFee, msg.sender);

        emit TakeTransport(
            _depositParam.tokenInForBridge,
            dstChainId,
            _depositParam.amountIn,
            _depositParam.receiver,
            composeMsg,
            composeGasLimit
        );
    }

    /// @inheritdoc IMoneyFiBridgeCrossChain
    function takeTransportWithdraw(DexCrossChainType.WithdrawCrossChainParam memory _withdrawParam) external payable onlyRouter {
        (uint32 dstChainId, uint128 composeGasLimit) = abi.decode(_withdrawParam.transportMsg, (uint32, uint128));

        (uint256 valueToSend, SendParam memory sendParam, MessagingFee memory messagingFee) = prepareForTransport(
            _withdrawParam.tokenInForBridge,
            dstChainId,
            _withdrawParam.receiver,
            _withdrawParam.amountIn,
            _withdrawParam.amountOutMin,
            bytes(""),
            composeGasLimit
        );

        address stargate = stargateChainPoolToken[_withdrawParam.tokenInForBridge][dstChainId];

        IERC20(_withdrawParam.tokenInForBridge).safeTransferFrom(msg.sender, address(this), _withdrawParam.amountIn);
        IERC20(_withdrawParam.tokenInForBridge).safeIncreaseAllowance(stargate, _withdrawParam.amountIn);

        if (msg.value < valueToSend) {
            revert InsufficientValue(msg.value, valueToSend);
        }

        IStargate(stargate).sendToken{ value: msg.value }(sendParam, messagingFee, msg.sender);

        emit TakeTransport(
            _withdrawParam.tokenInForBridge,
            dstChainId,
            _withdrawParam.amountIn,
            _withdrawParam.receiver,
            bytes(""),
            composeGasLimit
        );
    }

    /// @dev Implement function from layerzero
    function lzCompose(
        address _from,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    )
        external
        payable
    {
        if (msg.sender != LZ_ENDPOINT) {
            revert InvalidLzEndpoint(msg.sender);
        }

        bytes memory _composeMessage = OFTComposeMsgCodec.composeMsg(_message);
        uint32 _srcEid = OFTComposeMsgCodec.srcEid(_message);

        RouterCommonType.ReceiveFundCrossChainParam memory composeData = decodeComposeParams(_composeMessage);

        uint256 amountLD = OFTComposeMsgCodec.amountLD(_message);

        composeData.amount = amountLD;

        payload[_srcEid][_guid] = abi.encodePacked(_guid, _composeMessage);

        try IERC20(composeData.depositedTokenAddress).approve(fundVault, amountLD) {
            try IMoneyFiFundVault(fundVault).depositFund(composeData.depositedTokenAddress, composeData.depositor, amountLD) {
                delete payload[_srcEid][_guid];
                emit TransferFundFromDexCrossChainToFundVault(
                    composeData.depositor, composeData.depositedTokenAddress, amountLD, block.timestamp
                );
            } catch {
                emit ExecuteReceiveFundCrossChainFailed(
                    _guid,
                    _composeMessage,
                    composeData.depositor,
                    composeData.depositedTokenAddress,
                    amountLD,
                    _srcEid,
                    block.timestamp
                );
            }
        } catch {
            emit ExecuteReceiveFundCrossChainFailed(
                _guid,
                _composeMessage,
                composeData.depositor,
                composeData.depositedTokenAddress,
                amountLD,
                _srcEid,
                block.timestamp
            );
        }

        emit LzCompose(msg.sender, _from, _guid, _message, _executor, _extraData, block.timestamp);
    }

    /// @dev Get fund from stargate to fund vault
    function executeTransferFundFromRouterToFundVaultCrossChain(
        bytes32 _guid,
        uint32 _srcId,
        bytes calldata _composeMessage,
        address depositor,
        address _depositedToken,
        uint256 _amount,
        uint256 _transferFee
    )
        public
        onlyAtLeastOperator
    {
        bytes memory payloadHash = payload[_srcId][_guid];
        bytes memory expectedHash = abi.encodePacked(_guid, _composeMessage);

        if (keccak256(payloadHash) != keccak256(expectedHash)) {
            revert InvalidPayloadHash(payloadHash, _guid);
        }

        RouterCommonType.ReceiveFundCrossChainParam memory composeData = decodeComposeParams(_composeMessage);

        uint256 balance = IERC20(_depositedToken).balanceOf(address(this));

        if (depositor != composeData.depositor) {
            revert InvalidDepositor(depositor, composeData.depositor);
        }

        if (balance < _amount) {
            revert InsufficientBalance();
        }

        IERC20(_depositedToken).safeIncreaseAllowance(fundVault, _amount);

        IMoneyFiFundVault(fundVault).depositFund(_depositedToken, depositor, _amount);

        delete payload[_srcId][_guid];

        emit ExecuteTransferFundFromRouterToFundVaultCrossChain(depositor, _depositedToken, _amount, block.timestamp);
    }

    /// @dev Get fund from stargate to fund vault
    function executeTransferFundFromRouterToFundVaultCrossChainLzComposeAlert(
        bytes calldata _originMessage,
        address _depositedToken,
        bytes32 _guid,
        uint256 _transferFee
    )
        external
        onlyAtLeastOperator
    {
        bytes memory _composeMessage = OFTComposeMsgCodec.composeMsg(_originMessage);

        RouterCommonType.ReceiveFundCrossChainParam memory composeData = decodeComposeParams(_composeMessage);

        uint256 amountLD = OFTComposeMsgCodec.amountLD(_originMessage);

        if (isTransferToFunVaultLzComposeAlert[_guid][_originMessage]) {
            revert InvalidOriginComposeMsg();
        }

        if (IERC20(_depositedToken).balanceOf(address(this)) < amountLD) {
            revert InsufficientBalance();
        }

        isTransferToFunVaultLzComposeAlert[_guid][_originMessage] = true;

        IERC20(_depositedToken).safeIncreaseAllowance(fundVault, amountLD);

        IMoneyFiFundVault(fundVault).depositFund(_depositedToken, composeData.depositor, amountLD);

        emit ExecuteTransferFundFromRouterToFundVaultCrossChain(composeData.depositor, _depositedToken, amountLD, block.timestamp);
    }

    /// @dev Withdraw in external case
    function withdrawal(address _token, address _to, uint256 _amount) external onlyDelegateAdmin {
        if (_to == address(0)) {
            revert InvalidTokenAddress(_to);
        }
        if (_amount == 0) {
            revert InvalidAmount(_amount);
        }
        IERC20(_token).safeTransfer(_to, _amount);
    }

    fallback() external payable { }
    receive() external payable { }

    /// @dev Set router
    function setFundVault(address _fundVault) external onlyAdmin {
        fundVault = _fundVault;
    }

    /// @dev Set controller
    function setController(address _controller) external onlyAdmin {
        controller = _controller;
    }

    /// @dev Set lz end point
    function setLzEndpoint(address _lzEndpoint) external onlyAdmin {
        LZ_ENDPOINT = _lzEndpoint;
    }

    /// @dev Set stargate end point id
    function setStargateEndpointId(uint256 _chainId, uint256 _stargateEndpointID) external onlyDelegateAdmin {
        if (_chainId == 0) {
            revert InvalidChainId(_stargateEndpointID);
        }

        stargateEndpointID[_chainId] = _stargateEndpointID;
    }

    /// @dev Set stargate pool token
    function setStargatePoolToken(
        address _token,
        uint256 _desChainID,
        address _stargateSourcePoolToken
    )
        external
        onlyDelegateAdmin
    {
        if (_token == address(0)) {
            revert InvalidTokenAddress(_token);
        }
        if (_stargateSourcePoolToken == address(0)) {
            revert InvalidTokenAddress(_stargateSourcePoolToken);
        }
        if (_desChainID == 0) {
            revert InvalidChainId(_desChainID);
        }
        stargateChainPoolToken[_token][_desChainID] = _stargateSourcePoolToken;
    }

    /// @dev Get encode compose msg
    function endcodeComposeMsg(
        address _depositor,
        address _depositedTokenAddress,
        uint256 _amount,
        bytes memory _externalCallData
    )
        public
        pure
        returns (bytes memory composeMsg)
    {
        composeMsg = abi.encode(_depositor, _depositedTokenAddress, _amount, _externalCallData);
    }

    /// @dev Decode compose params
    function decodeComposeParams(bytes memory compose)
        public
        pure
        returns (RouterCommonType.ReceiveFundCrossChainParam memory params)
    {
        (params.depositor, params.depositedTokenAddress, params.amount, params.externalCallData) =
            abi.decode(compose, (address, address, uint256, bytes));
    }

    /// @dev Decode transport param
    function decodeTransportParams(bytes memory transport)
        public
        pure
        returns (DexCrossChainType.TransportParams memory params)
    {
        (params.token, params.dstChainId, params.amount, params.receiver, params.composeMsg, params.composeGasLimit) =
            abi.decode(transport, (address, uint32, uint256, address, bytes, uint128));
    }

    /// @dev Address to bytes32
    function addressToBytes32(address _addr) public pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }

    /// @dev Prepare for transport
    function prepareForTransport(
        address _token,
        uint32 _dstChainId,
        address _receiver,
        uint256 _amount,
        uint256 _amountOutMin,
        bytes memory _composeMsg,
        uint128 _composeGasLimit
    )
        public
        view
        supportBridgeToken(_token, _dstChainId)
        returns (uint256 valueToSend, SendParam memory sendParam, MessagingFee memory messagingFee)
    {
        address _stargate = stargateChainPoolToken[_token][_dstChainId];

        uint32 _dstEid = uint32(stargateEndpointID[_dstChainId]);

        bytes memory extraOptions = _composeMsg.length > 0
            ? OptionsBuilder.newOptions().addExecutorLzComposeOption(0, _composeGasLimit, 0) // compose gas limit
            : bytes("");

        sendParam = SendParam({
            dstEid: _dstEid,
            to: addressToBytes32(_receiver),
            amountLD: _amount,
            minAmountLD: _amount,
            extraOptions: extraOptions,
            composeMsg: _composeMsg,
            oftCmd: ""
        });

        IStargate stargate = IStargate(_stargate);

        (,, OFTReceipt memory receipt) = stargate.quoteOFT(sendParam);

        if (receipt.amountReceivedLD < _amountOutMin) {
            revert InvalidTargetChainAmount(_amount, receipt.amountReceivedLD, _amountOutMin);
        }

        sendParam.minAmountLD = receipt.amountReceivedLD;

        messagingFee = stargate.quoteSend(sendParam, false);
        valueToSend = messagingFee.nativeFee;

        if (stargate.token() == address(0x0)) {
            valueToSend += sendParam.amountLD;
        }
    }

    /// @dev Prepare transport msg
    function prepareTransportMsg(
        uint32 _dstChainId,
        uint128 _composeGasLimit
    )
        external
        pure
        returns (bytes memory transpostMsg)
    {
        transpostMsg = abi.encode(_dstChainId, _composeGasLimit);
    }

    /// @dev Decode lz compose msg
    function decodeLzComposeMsg(bytes calldata _message)
        external
        pure
        returns (RouterCommonType.ReceiveFundCrossChainParam memory composeData)
    {
        bytes memory _composeMessage = OFTComposeMsgCodec.composeMsg(_message);
        composeData = decodeComposeParams(_composeMessage);
    }

    /// @dev Upgrade contract
    function _authorizeUpgrade(address _newImplementation) internal override onlyDelegateAdmin { }
}
