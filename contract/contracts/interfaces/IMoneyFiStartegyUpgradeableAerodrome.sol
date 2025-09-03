// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMoneyFiStartegyUpgradeableAerodrome {
    struct AeroDromeInitializeParams {
        address aeroDromeToken;
        address aeroDromerouter;
        address positionManager;
        address poolAerodrome;
        address aerodromeCLGauge;
        address aeroDromeRouterV2;
        address aeroDromeFactoryV2;
        address aeroUsdcPoolV2;
    }

    enum AeroDromeAddressType {
        AERODROME_TOKEN,
        AERODROME_ROUTER,
        POSITION_MANAGER,
        POOL_AERODROME,
        AERODROME_CL_GAUGE,
        AERODROME_ROUTER_V2,
        AERODROME_FACTORY_V2
    }

    // ============================== //
    //            Errors             //
    // ============================== //
    error CanNotSwapInAeroDrome(uint256 amountIn, uint256 minimumAmountOut);
    error CanNotAddNewLiquidToAerodrome();
    error CanNotCollectRewardFromAerodrome();
    error CanNotRemoveLiquidInAeroDrome();
    error InvalidOwnerPositionNft(uint256 tokenId);
    error InvalidTickValue();
    error InvalidAeroDromeInitializeParams();
    error InvalidAeroDromeAddressType();
    error InvalidAddress();
}
