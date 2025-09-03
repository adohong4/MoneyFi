// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { MoneyFiControllerType } from "../types/ControllerDataType.sol";

/// @title IMoneyFiController
/// @notice Interface for the MoneyFiController contract
interface IMoneyFiController {
    // ============================== //
    //            Errors             //
    // ============================== //

    error ExceedMaxPercentLiquidStrategyInPool();
    error ExceedMaxDepositValueInPool();
    error InvalidRouter();
    error RequiredAddressNotNull();

    /// @dev Revert when an invalid signature is provided
    /// @param _signature The invalid signature
    error InvalidSignature(bytes _signature);

    // ============================== //
    //            Events             //
    // ============================== //

    // ============================== //
    //        External Methods       //
    // ============================== //

    /// @notice Verify signature from router
    function verifySignatureReferral(bool _isReferral, bytes memory _signature, address _sender) external;

    /// @notice Sets signer
    /// @param _signer Wallet sign signature
    function setSigner(address _signer) external;

    /// @notice Sets the protocol fee
    /// @param _protocolFee New protocol fee in basis points (1% = 100)
    function setProtocolFee(uint256 _protocolFee) external;

    /// @notice Sets token info
    /// @param _token Address of the token
    /// @param _tokenInfo Token configuration
    function setTokenInfoInternal(address _token, MoneyFiControllerType.TokenInfo calldata _tokenInfo) external;

    /// @notice Sets token info
    /// @param _token Address of the token
    /// @param _tokenInfo Token configuration
    function setTokenInfoExternal(address _token, MoneyFiControllerType.TokenInfo calldata _tokenInfo) external;

    /// @notice Sets strategy info
    /// @param _strategy Strategy address
    /// @param _strategyInfo Strategy configuration
    function setStrategyInternal(address _strategy, MoneyFiControllerType.Strategy calldata _strategyInfo) external;

    /// @notice Sets strategy info
    /// @param _strategy Strategy address
    /// @param _strategyInfo Strategy configuration
    function setStrategyExternal(address _strategy, MoneyFiControllerType.StrategyExternal calldata _strategyInfo) external;

    /// @notice Enable or disable referral signature feature
    /// @dev Only callable by delegate admin
    /// @param _isEnableReferralSignature A boolean to enable or disable referral signature
    function setEnableReferralSignature(bool _isEnableReferralSignature) external;

    /// @notice Adds a new cross-chain swap
    /// @param _crossChainParam Parameters for the cross-chain swap
    /// @param _crossChainSwap Address of the cross-chain swap
    function setCrossChainSwapInternal(
        MoneyFiControllerType.CrossChainParam calldata _crossChainParam,
        address _crossChainSwap
    )
        external;

    /// @notice Adds a new cross-chain swap
    /// @param _crossChainParam Parameters for the cross-chain swap
    /// @param _crossChainSwap Address of the cross-chain swap
    function setCrossChainSwapExternal(
        MoneyFiControllerType.CrossChainParam calldata _crossChainParam,
        address _crossChainSwap
    )
        external;

    /// @notice Adds an internal swap adapter
    /// @param _internalParam Parameters for the internal swap
    /// @param _internalSwap Address of the internal swap
    function setDexInternalSwap(
        MoneyFiControllerType.InternalSwapParam calldata _internalParam,
        address _internalSwap
    )
        external;

    /// @notice Adds an internal swap adapter
    /// @param _internalParam Parameters for the internal swap
    /// @param _internalSwap Address of the internal swap
    function setDexExternalSwap(
        MoneyFiControllerType.InternalSwapParam calldata _internalParam,
        address _internalSwap
    )
        external;

    /// @notice Sets the router address
    /// @param _router Address of the router
    function setRouter(address _router) external;

    /// @notice Sets the router address
    /// @param _crossChainRouter Address of the router
    function setCrossChainRouter(address _crossChainRouter) external;

    /// @notice Set max percent of total liquidity for a token in strategy
    /// @param _tokenAddress The token address
    /// @param _maxPercentLiquidityStrategy The new max percent value
    function setMaxPercentLiquidityStrategy(address _tokenAddress, uint256 _maxPercentLiquidityStrategy) external;

    /// @notice Set max deposit value for a token
    /// @param _tokenAddress The token address
    /// @param _maxDepositValue The new max deposit value
    function setMaxDepositValue(address _tokenAddress, uint256 _maxDepositValue) external;

    /// @notice Set max percent liquidity strategy base on pool
    /// @param _tokenAddress The token address
    /// @param _maxPercentLiquidityStrategyToken The new max percent liquidity strategy base on pool
    function setMaxPercentLiquidityStrategyToken(address _tokenAddress, uint256 _maxPercentLiquidityStrategyToken) external;

    /// @notice Sets the referral fee
    /// @param _referralFee New referral fee in basis points (1% = 100)
    function setReferralFee(uint256 _referralFee) external;

    /// @notice Sets new hot wallet
    /// @param _hotWallet New hot wallet.
    function setHotWallet(address _hotWallet) external;

    /// @notice Sets new averageSystemActionFee
    /// @param _averageSystemActionFee New averageSystemActionFee.
    function setAverageSystemActionFee(uint256 _averageSystemActionFee) external;

    /// @notice Gets supported token info
    /// @param _token Address of the token
    /// @return TokenInfo struct
    function getSupportedTokenInternalInfor(address _token) external view returns (MoneyFiControllerType.TokenInfo memory);

    /// @notice Checks if a strategy is active and internal
    /// @param _strategy The address of the strategy
    /// @return True if the strategy is internal and active
    function isStrategyInternalActive(address _strategy) external view returns (bool);

    /// @notice Checks if a strategy is active and external
    /// @param _strategy The address of the strategy
    /// @return True if the strategy is external and active
    function isStrategyExternalActive(address _strategy) external view returns (bool);

    /// @notice Checks if a cross-chain DEX is active and internal
    /// @param _dexCrossChain The address of the cross-chain DEX
    /// @return True if the DEX is internal and active
    function isDexCrossChainInternalActive(address _dexCrossChain) external view returns (bool);

    /// @notice Checks if a cross-chain DEX is active and external
    /// @param _dexCrossChain The address of the cross-chain DEX
    /// @return True if the DEX is external and active
    function isDexCrossChainExternalActive(address _dexCrossChain) external view returns (bool);

    /// @notice Checks if a token is supported and internal
    /// @param _token The address of the token
    /// @return True if the token is internal and supported
    function isTokenSupportInternalActive(address _token) external view returns (bool);

    /// @notice Checks if a token is supported and external
    /// @param _token The address of the token
    /// @return True if the token is external and supported
    function isTokenSupportExternalActive(address _token) external view returns (bool);

    /// @notice Checks if a swap DEX is internal and active
    /// @param _dexSwap The address of the swap DEX
    /// @return True if the DEX is internal and active
    function isDexSwapInternalActive(address _dexSwap) external view returns (bool);

    /// @notice Checks if a swap DEX is external and active
    /// @param _dexSwap The address of the swap DEX
    /// @return True if the DEX is external and active
    function isDexSwapExternalActive(address _dexSwap) external view returns (bool);

    /// @notice Checks underlying asset in strategy external valid
    /// @param _strategy The address of external strategy
    /// @param _underlyingAsset The address of the underlying strategy
    /// @return True if the DEX is external and active
    function isValidUnderlyingAssetStrategyExternal(address _strategy, address _underlyingAsset) external view returns (bool);

    /// @notice Validates whether a user can deposit into a strategy
    /// @param _strategy Address of the strategy
    /// @param _depositor User depositing
    /// @param _depositAmount Amount intended to deposit
    function validateDistributeFundToStrategy(address _strategy, address _depositor, uint256 _depositAmount) external;

    /// @notice Return protocol fee
    function protocolFee() external view returns (uint256);

    /// @notice Return router address
    function router() external view returns (address);

    /// @notice Return nonce address
    function nonce() external view returns (uint256);

    /// @notice Return cross chain router address
    function crossChainRouter() external view returns (address);

    /// @notice Return signer address
    function signer() external view returns (address);

    /// @notice Return hotWallet address
    function hotWallet() external view returns (address);

    /// @notice Return averageSystemActionFee
    function averageSystemActionFee() external view returns (uint256);

    /// @notice Get max percent of total liquidity for a token in strategy
    /// @param token The token address
    /// @return maxPercentLiquidityStrategy The max percent value
    function maxPercentLiquidityStrategyToken(address token) external view returns (uint256);

    /// @notice Get max deposit value for a token
    /// @param token The token address
    /// @return maxDepositValue The max deposit value allowed
    function maxDepositValueToken(address token) external view returns (uint256);

    /// @notice Return referral fee
    function referralFee() external view returns (uint256);

    /// @notice Checks if two cross-chain swap addresses are of the same type
    /// @param _crossChainSender The address of the sender cross-chain swap
    /// @param _crossChainReceiver The address of the receiver cross-chain swap
    /// @return Returns true if both cross-chain swaps have the same DEX type, otherwise false
    function isCrossChainSwapSameType(address _crossChainSender, address _crossChainReceiver) external view returns (bool);
}
