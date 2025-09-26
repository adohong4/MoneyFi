export const admin_permissions = [
    "setHotWallet",
    "setController",
    "setFeeTo",
    "upgradeControllerAndFundVault",
    "setFundVault",
    "setLzEndpoint",
    "setStargatePoolToken",
    "setStargateEndpointId",
    "pause",
    "unpause"
];

export const operator_permissions = [
    "depositFundToStrategyCrossChainFromOperator",
    "withdrawFundSameChain",
    "withdrawFundAnotherChain",
    "withdrawFundCrossChainFromOperatorHotWallet",
    "rebalanceFundSameChain",
    "depositFundToStrategySameChainFromOperator",
    "collectNative"
];

export const delegate_admin_permissions = [
    "setSigner",
    "setProtocolFee",
    "setTokenInfoInternal",
    "setTokenInfoExternal",
    "setStrategyInternal",
    "setStrategyExternal",
    "setCrossChainSwapInternal",
    "setCrossChainSwapExternal",
    "setDexInternalSwap",
    "setDexExternalSwap",
    "setEnableReferralSignature",
    "setRouter",
    "setCrossChainRouter",
    "setMaxPercentLiquidityStrategy",
    "setMaxDepositValue",
    "setMaxPercentLiquidityStrategyToken",
    "setReferralFee",
    "withdrawProtocolFee",
    "withdrawDistributeFee",
    "withdrawRebalanceFee",
    "withdrawReferralFee",
    "withdrawWithdrawalFee",
    "pause",
    "unpause",
    "emergencyWithdraw",
    "setEmergencyStop",
    "setCoolDownPeriodWithdrawRequest",
    "withdrawUnDistributedFundToUser"
];

export const signer_permissions = [
    "verifySignatureReferral"
];
