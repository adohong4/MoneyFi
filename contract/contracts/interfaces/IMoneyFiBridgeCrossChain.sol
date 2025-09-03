// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { DexCrossChainType } from "../types/DexCrossChainType.sol";
import { RouterCommonType } from "../types/RouterDataType.sol";

interface IMoneyFiBridgeCrossChain {
    // ============================== //
    //            Errors              //
    // ============================== //

    error InvalidChainId(uint256 chainId);
    error InvalidAddress(address addr);
    error InvalidTokenAddress(address token);
    error TokenNotSupportBridgeToTargetChain(address token);
    error InsufficientValue(uint256 value, uint256 exptected);
    error InvalidSlippage(uint256 slippage);
    error InvalidTargetChainAmount(uint256 amount, uint256 targetMinAmount, uint256 expectedAmount);
    error InvalidSender(address sender);
    error InvalidStargatePool(address pool);
    error InvalidAmount(uint256 amount);
    error InvalidLzEndpoint(address lzEndpoint);
    error InvalidPayloadHash(bytes payloadHash, bytes32 guid);
    error InsufficientBalance();
    error InvalidDepositor(address depositor, address expectedDepositor);
    error InvalidDepositedToken(address depositedToken, address expectedDepositedToken);
    error InvalidOriginComposeMsg();
    error RequiredAddressNotNull();
    error InvalidRouter();

    // ============================== //
    //            Events              //
    // ============================== //
    event LzComposeLogs(string message);

    event ExecuteReceiveFundCrossChainFailed(
        bytes32 indexed guid,
        bytes composeMsg,
        address indexed depositor,
        address depositedTokenAddress,
        uint256 amount,
        uint256 srcId,
        uint256 executedAt
    );

    event ExecuteTransferFundFromRouterToFundVaultCrossChain(
        address indexed depositor, address indexed depositToken, uint256 amount, uint256 executedAt
    );
    event ReceiveFundCrossChainFailed(address router, bytes message);
    event TakeTransport(
        address indexed _token,
        uint32 _dstChainId,
        uint256 _amount,
        address indexed _receiver,
        bytes _composeMsg,
        uint128 _composeGasLimit
    );
    event TestReceiver(
        address strategyAddress, address depositor, address depositedTokenAddress, uint256 amount, bytes externalCallData
    );
    event LzCompose(
        address sender, address _from, bytes32 _guid, bytes _message, address _executor, bytes _extraData, uint256 lzComposeAt
    );

    event TransferFundFromDexCrossChainToFundVault(address depositor, address tokenAddress, uint256 amount, uint256 depositedAt);

    /// @notice Takes a deposit and initiates a cross-chain transport
    /// @param _depositParam Struct containing all parameters needed for the cross-chain deposit
    function takeTransportDeposit(DexCrossChainType.DepositCrossChainParam memory _depositParam) external payable;

    /// @notice Withdraws funds cross-chain via Stargate
    /// @param _withdrawParam Structured withdrawal parameters
    function takeTransportWithdraw(DexCrossChainType.WithdrawCrossChainParam calldata _withdrawParam) external payable;

    /// @notice Sets the Stargate endpoint ID for a specific chain
    /// @param _chainId The ID of the chain to associate with a Stargate endpoint
    /// @param _stargateEndpointID The Stargate endpoint ID to assign
    function setStargateEndpointId(uint256 _chainId, uint256 _stargateEndpointID) external;

    /// @notice Sets the Stargate pool token address for a given token
    /// @param _token The original token address
    /// @param _stargatePoolToken The Stargate pool token address associated with `_token`
    function setStargatePoolToken(address _token, uint256 _chainId, address _stargatePoolToken) external;

    /// @notice Decode lz compose msg
    /// @param _message Origin data from lz compose alert
    function decodeLzComposeMsg(bytes calldata _message)
        external
        returns (RouterCommonType.ReceiveFundCrossChainParam memory composeData);

    /// @notice Transfer fund from dex cross chain to fund vault
    /// @param _originMessage The origin message from lz compose alert
    /// @param _depositedToken The deposit token
    /// @param _guid The guid id
    /// @param _transferFee The transfer fee
    function executeTransferFundFromRouterToFundVaultCrossChainLzComposeAlert(
        bytes calldata _originMessage,
        address _depositedToken,
        bytes32 _guid,
        uint256 _transferFee
    )
        external;
}
