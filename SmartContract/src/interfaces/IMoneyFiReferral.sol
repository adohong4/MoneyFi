// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title IMoneyFiReferral
/// @notice Interface for the MoneyFiReferral contract
interface IMoneyFiReferral {
    // ============================== //
    //            Errors              //
    // ============================== //

    /// @dev Revert when contract does not have enough balance for the operation
    error InsufficientBalance();

    /// @dev Revert when an invalid signature is provided
    /// @param _signature The invalid signature
    error InvalidSignature(bytes _signature);

    // @dev Revert when
    error RequiredAddressNotNull();
    // ============================== //
    //            Events              //
    // ============================== //

    /// @notice Emitted when the contract owner withdraws tokens
    /// @param amount Amount withdrawn
    event Withdraw(address receiver, uint256 amount, uint256 withdrawAt);

    /// @notice Emitted when a user successfully claims tokens
    /// @param amount Amount claimed
    /// @param from Address funds are claimed from (the contract itself)
    /// @param to Address funds are claimed to (the user)
    event Claim(uint256 amount, address from, address to, uint256 claimAt);

    // ============================== //
    //        External Functions      //
    // ============================== //

    /// @notice Deposit tokens into the referral contract
    /// @param _amount Amount of tokens to deposit
    function deposit(uint256 _amount) external;

    /// @notice Withdraw tokens from the referral contract by the owner
    /// @param _amount Amount of tokens to withdraw
    function withdraw(uint256 _amount) external;

    /// @notice Claim reward tokens using a signed message
    /// @param _amount Amount to claim
    /// @param _signature Valid signature from signer authorizing the claim
    function claim(uint256 _amount, bytes calldata _signature) external;

    /// @notice Set a new signer address for reward claims
    /// @param _signer New signer address
    function setSigner(address _signer) external;

    /// @notice Pause the contract’s claim functionality
    function pause() external;

    /// @notice Unpause the contract’s claim functionality
    function unpause() external;

    // ============================== //
    //         View Functions         //
    // ============================== //

    /// @notice Get the current reward signer address
    /// @return Address of the signer
    function signer() external view returns (address);

    /// @notice Get the current nonce used in signed messages
    /// @return Current nonce value
    function nonce() external view returns (uint256);

    /// @notice Check if the contract is active (not paused)
    /// @return Boolean representing active status
    function isActive() external view returns (bool);

    /// @notice Get the address of the ERC20 token used in the contract
    /// @return Token contract address
    function token() external view returns (IERC20);
}
