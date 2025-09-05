// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./VaultTypes.sol";

interface IPool {
    struct StablePoolDynamicData {
        uint256[] balancesLiveScaled18;
        uint256[] tokenRates;
        uint256 staticSwapFeePercentage;
        uint256 totalSupply;
        uint256 bptRate;
        uint256 amplificationParameter;
        uint256 startValue;
        uint256 endValue;
        uint32 startTime;
        uint32 endTime;
        bool isAmpUpdating;
        bool isPoolInitialized;
        bool isPoolPaused;
        bool isPoolInRecoveryMode;
    }

    struct UserBasic {
        int104 principal;
        uint64 baseTrackingIndex;
        uint64 baseTrackingAccrued;
        uint16 assetsIn;
    }

    function balanceOf(address addr) external view returns (uint256);

    function totalSupply() external view returns (uint256);

    function getCurrentLiveBalances() external view returns (uint256[] memory);

    function getStablePoolDynamicData() external view returns (StablePoolDynamicData memory);

    function getStaticSwapFeePercentage() external view returns (uint256);

    function onSwap(PoolSwapParams memory request) external pure returns (uint256);

    function userBasic(address user) external view returns (UserBasic memory);

    function trackingIndexScale() external view returns (uint256);

    function baseScale() external view returns (uint256);

    function supplyPerSecondInterestRateSlopeLow() external view returns (uint256);

    function supplyPerSecondInterestRateSlopeHigh() external view returns (uint256);

    function borrowPerSecondInterestRateBase() external view returns (uint256);

    function borrowPerSecondInterestRateSlopeLow() external view returns (uint256);

    function borrowPerSecondInterestRateSlopeHigh() external view returns (uint256);

    function baseMinForRewards() external view returns (uint256);

    function baseTrackingSupplySpeed() external view returns (uint256);

    function baseTrackingBorrowSpeed() external view returns (uint256);

    function borrowKink() external view returns (uint256);

    function supplyKink() external view returns (uint256);
}
