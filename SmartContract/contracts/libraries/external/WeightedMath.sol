// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.24;

import { FixedPoint } from "./FixedPoint.sol";
import { Math } from "./Math.sol";

/**
 * @notice Implementation of Balancer Weighted Math, essentially unchanged since v1.
 * @dev It is a generalization of the x * y = k constant product formula, accounting for cases with more than two
 * tokens, and weights that are not 50/50.
 *
 * See https://docs.balancer.fi/concepts/explore-available-balancer-pools/weighted-pool/weighted-math.html
 *
 * For security reasons, to help ensure that for all possible "round trip" paths the caller always receives the same
 * or fewer tokens than supplied, we have chosen the rounding direction to favor the protocol in all cases.
 */
library WeightedMath {
    uint256 internal constant _AMP_PRECISION = 1e3;

    using FixedPoint for uint256;
    using Math for uint256;

    /// @notice User attempted to extract a disproportionate amountOut of tokens from a pool.
    error MaxOutRatio();

    /// @notice User attempted to add a disproportionate amountIn of tokens to a pool.
    error MaxInRatio();

    /**
     * @notice Error thrown when the calculated invariant is zero, indicating an issue with the invariant calculation.
     * @dev Most commonly, this happens when a token balance is zero.
     */
    error ZeroInvariant();

    // Pool limits that arise from limitations in the fixed point power function. When computing x^y, the valid range
    // of `x` is -41 (ExpMin) to 130 (ExpMax). See `LogExpMath.sol` for the derivation of these values.
    //
    // Invariant calculation:
    // In computing `balance^normalizedWeight`, `log(balance) * normalizedWeight` must fall within the `pow` function
    // bounds described above. Since 0.01 <= normalizedWeight <= 0.99, the balance is constrained to the range between
    // e^(ExpMin) and e^(ExpMax).
    //
    // This corresponds to 10^(-18) < balance < 2^(188.56). Since the maximum balance is 2^(128) - 1, the invariant
    // calculation is unconstrained by the `pow` function limits.
    //
    // It's a different story with `computeBalanceOutGivenInvariant` (inverse invariant):
    // This uses the power function to raise the invariant ratio to the power of 1/weight. Similar to the computation
    // for the invariant, this means the following expression must hold:
    // ExpMin < log(invariantRatio) * 1/weight < ExpMax
    //
    // Given the valid range of weights (i.e., 1 < 1/weight < 100), we have:
    // ExpMin/100 < log(invariantRatio) < ExpMax/100, or e^(-0.41) < invariantRatio < e^(1.3). Numerically, this
    // constrains the invariantRatio to between 0.661 and 3.695. For an added safety margin, we set the limits to
    // 0.7 < invariantRatio < 3.

    // Swap limits: amounts swapped may not be larger than this percentage of the total balance.
    uint256 internal constant _MAX_IN_RATIO = 30e16; // 30%
    uint256 internal constant _MAX_OUT_RATIO = 30e16; // 30%

    // Invariant growth limit: non-proportional add cannot cause the invariant to increase by more than this ratio.
    uint256 internal constant _MAX_INVARIANT_RATIO = 300e16; // 300%
    // Invariant shrink limit: non-proportional remove cannot cause the invariant to decrease by less than this ratio.
    uint256 internal constant _MIN_INVARIANT_RATIO = 70e16; // 70%

    /**
     * @notice Compute the invariant, rounding down.
     * @dev The invariant functions are called by the Vault during various liquidity operations, and require a specific
     * rounding direction in order to ensure safety (i.e., that the final result is always rounded in favor of the
     * protocol. The invariant (i.e., all token balances) must always be greater than 0, or it will revert.
     *
     * @param normalizedWeights The pool token weights, sorted in token registration order
     * @param balances The pool token balances, sorted in token registration order
     * @return invariant The invariant, rounded down
     */
    function computeInvariantDown(
        uint256[] memory normalizedWeights,
        uint256[] memory balances
    )
        internal
        pure
        returns (uint256 invariant)
    {
        /**
         *
         *     // invariant               _____                                                             //
         *     // wi = weight index i      | |      wi                                                      //
         *     // bi = balance index i     | |  bi ^   = i                                                  //
         *     // i = invariant                                                                             //
         *
         */
        invariant = FixedPoint.ONE;
        for (uint256 i = 0; i < normalizedWeights.length; ++i) {
            invariant = invariant.mulDown(balances[i].powDown(normalizedWeights[i]));
        }

        if (invariant == 0) {
            revert ZeroInvariant();
        }
    }

    /**
     * @notice Compute the invariant, rounding up.
     * @dev The invariant functions are called by the Vault during various liquidity operations, and require a specific
     * rounding direction in order to ensure safety (i.e., that the final result is always rounded in favor of the
     * protocol. The invariant (i.e., all token balances) must always be greater than 0, or it will revert.
     *
     * @param normalizedWeights The pool token weights, sorted in token registration order
     * @param balances The pool token balances, sorted in token registration order
     * @return invariant The invariant, rounded up
     */
    function computeInvariantUp(
        uint256[] memory normalizedWeights,
        uint256[] memory balances
    )
        internal
        pure
        returns (uint256 invariant)
    {
        /**
         *
         *     // invariant               _____                                                             //
         *     // wi = weight index i      | |      wi                                                      //
         *     // bi = balance index i     | |  bi ^   = i                                                  //
         *     // i = invariant                                                                             //
         *
         */
        invariant = FixedPoint.ONE;
        for (uint256 i = 0; i < normalizedWeights.length; ++i) {
            invariant = invariant.mulUp(balances[i].powUp(normalizedWeights[i]));
        }

        if (invariant == 0) {
            revert ZeroInvariant();
        }
    }

    /**
     * @notice Compute a token balance after a liquidity operation, given the current balance and invariant ratio.
     * @dev This is called as part of the "inverse invariant" `computeBalance` calculation.
     * @param currentBalance The current balance of the token
     * @param weight The weight of the token
     * @param invariantRatio The invariant ratio (i.e., new/old; will be > 1 for add; < 1 for remove)
     * @return newBalance The adjusted token balance after the operation
     */
    function computeBalanceOutGivenInvariant(
        uint256 currentBalance,
        uint256 weight,
        uint256 invariantRatio
    )
        internal
        pure
        returns (uint256 newBalance)
    {
        /**
         *
         *     // calculateBalanceGivenInvariant                                                        //
         *     // o = balanceOut                                                                        //
         *     // b = balanceIn                      (1 / w)                                            //
         *     // w = weight              o = b * i ^                                                   //
         *     // i = invariantRatio                                                                    //
         *
         */

        // Rounds result up overall, rounding up the two individual steps:
        // - balanceRatio = invariantRatio ^ (1 / weight)
        // - newBalance = balance * balanceRatio
        //
        // Regarding `balanceRatio`, the exponent is always > FP(1), but the invariant ratio can be either greater or
        // lower than FP(1) depending on whether this is solving an `add` or a `remove` operation.
        // - For i > 1, we need to round the exponent up, as i^x is monotonically increasing for i > 1.
        // - For i < 1, we need to round the exponent down, as as i^x is monotonically decreasing for i < 1.

        function(uint256, uint256) internal pure returns (uint256) divUpOrDown =
            invariantRatio > 1 ? FixedPoint.divUp : FixedPoint.divDown;

        // Calculate by how much the token balance has to increase to match the invariantRatio.
        uint256 balanceRatio = invariantRatio.powUp(divUpOrDown(FixedPoint.ONE, weight));

        return currentBalance.mulUp(balanceRatio);
    }

    // Computes how many tokens can be taken out of a pool if `tokenAmountIn` are sent, given the current balances.
    // The amplification parameter equals: A n^(n-1)
    // Computes how many tokens can be taken out of a pool if `amountIn` are sent, given the
    // current balances and weights.
    function _calcOutGivenIn(
        uint256 balanceIn,
        uint256 weightIn,
        uint256 balanceOut,
        uint256 weightOut,
        uint256 amountIn
    )
        internal
        pure
        returns (uint256)
    {
        /**
         *
         *     // outGivenIn                                                                                //
         *     // aO = amountOut                                                                            //
         *     // bO = balanceOut                                                                           //
         *     // bI = balanceIn              /      /            bI             \    (wI / wO) \           //
         *     // aI = amountIn    aO = bO * |  1 - | --------------------------  | ^            |          //
         *     // wI = weightIn               \      \       ( bI + aI )         /              /           //
         *     // wO = weightOut                                                                            //
         *
         */

        // Amount out, so we round down overall.

        // The multiplication rounds down, and the subtrahend (power) rounds up (so the base rounds up too).
        // Because bI / (bI + aI) <= 1, the exponent rounds down.

        // Cannot exceed maximum in ratio
        require(amountIn <= balanceIn.mulDown(_MAX_IN_RATIO), "Errors.MAX_IN_RATIO");

        uint256 denominator = balanceIn.add(amountIn);
        uint256 base = FixedPoint.divUp(balanceIn, denominator);
        uint256 exponent = FixedPoint.divDown(weightIn, weightOut);
        uint256 power = base.powUp(exponent);

        return balanceOut.mulDown(power.complement());
    }
}
