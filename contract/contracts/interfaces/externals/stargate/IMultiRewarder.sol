// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import { IERC20 } from "@openzeppelin/contracts/interfaces/IERC20.sol";

/// @notice A rewarder that can distribute multiple reward tokens (ERC20 and native) to `StargateStaking` pools.
/// @dev The native token is encoded as 0x0.
interface IMultiRewarder {
    /**
     *  @notice Returns the reward pools linked to the `stakingToken` alongside the pending rewards for `user`
     *          for these pools.
     */
    function getRewards(IERC20 stakingToken, address user) external view returns (address[] memory, uint256[] memory);
}
