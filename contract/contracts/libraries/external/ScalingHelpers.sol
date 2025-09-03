// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.24;

import { FixedPoint } from "./FixedPoint.sol";
import { InputHelpers } from "./InputHelpers.sol";

/**
 * @notice Helper functions to apply/undo token decimal and rate adjustments, rounding in the direction indicated.
 * @dev To simplify Pool logic, all token balances and amounts are normalized to behave as if the token had
 * 18 decimals. When comparing DAI (18 decimals) and USDC (6 decimals), 1 USDC and 1 DAI would both be
 * represented as 1e18. This allows us to not consider differences in token decimals in the internal Pool
 * math, simplifying it greatly.
 *
 * The Vault does not support tokens with more than 18 decimals (see `_MAX_TOKEN_DECIMALS` in `VaultStorage`),
 * or tokens that do not implement `IERC20Metadata.decimals`.
 *
 * These helpers can also be used to scale amounts by other 18-decimal floating point values, such as rates.
 */
library ScalingHelpers {
    using FixedPoint for *;
    using ScalingHelpers for uint256;

    /**
     *
     *                             Single Value Functions
     *
     */

    /**
     * @notice Applies `scalingFactor` and `tokenRate` to `amount`.
     * @dev This may result in a larger or equal value, depending on whether it needed scaling/rate adjustment or not.
     * The result is rounded down.
     *
     * @param amount Amount to be scaled up to 18 decimals
     * @param scalingFactor The token decimal scaling factor, `10^(18-tokenDecimals)`
     * @param tokenRate The token rate scaling factor
     * @return result The final 18-decimal precision result, rounded down
     */
    function toScaled18ApplyRateRoundDown(
        uint256 amount,
        uint256 scalingFactor,
        uint256 tokenRate
    )
        internal
        pure
        returns (uint256)
    {
        return (amount * scalingFactor).mulDown(tokenRate);
    }
}
