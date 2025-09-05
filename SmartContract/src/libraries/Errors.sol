// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.20;

/// @title Errors
/// @notice Library containing all custom errors the protocol may revert with.
library Errors {
    /*//////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////*/

    /// @notice Attempted to fetch a price from oracle with incorrect value.
    error GrowFiProxy_BadPrice();
}
