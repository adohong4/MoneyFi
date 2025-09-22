6 dex - 6 chain

### MoneyFiController
verifySignatureReferral() onlyRouter
setSigner() onlyDelegateAdmin
setProtocolFee() onlyDelegateAdmin
setTokenInfoInternal() onlyDelegateAdmin
setTokenInfoExternal() onlyDelegateAdmin
setStrategyInternal() onlyDelegateAdmin
setStrategyExternal() onlyDelegateAdmin
setCrossChainSwapInternal() onlyDelegateAdmin
setCrossChainSwapExternal() onlyDelegateAdmin
setDexInternalSwap() onlyDelegateAdmin
setDexExternalSwap() onlyDelegateAdmin
setEnableReferralSignature() onlyDelegateAdmin
setRouter() onlyDelegateAdmin
setCrossChainRouter() onlyDelegateAdmin
setMaxPercentLiquidityStrategy() onlyDelegateAdmin
setMaxDepositValue() onlyDelegateAdmin
setMaxPercentLiquidityStrategyToken() onlyDelegateAdmin
setReferralFee() onlyDelegateAdmin
setHotWallet() onlyAdmin
setAverageSystemActionFee() onlyAtLeastOperator
getSupportedTokenInternalInfor() view
isStrategyInternalActive() view
isStrategyExternalActive() view
isDexCrossChainInternalActive() view
isDexCrossChainExternalActive() view
isTokenSupportInternalActive() view
isTokenSupportExternalActive() view
isDexSwapInternalActive() view
isDexSwapExternalActive() view
isValidUnderlyingAssetStrategyExternal() view
isCrossChainSwapSameType() view
validateDistributeFundToStrategy() view

### MoneyFiFundVault
depositFund() whenNotPaused nonReentrant
transferFundToRouter() onlyRouter whenNotPaused
transferFundToRouterCrossChain() onlyRouter whenNotPaused
transferFundFromRouterToFundVault() onlyRouter whenNotPaused
withdrawUnDistributedFundToUser() onlyRouter whenNotPaused
receiveWithdrawFee() onlyRouter whenNotPaused
rebalanceFundSameChain() onlyRouter
increaseProtocolAndReferralFee() onlyRouter
setController() onlyAdmin
setFeeTo() onlyAdmin
withdrawProtocolFee() onlyDelegateAdmin whenNotPaused
withdrawDistributeFee() onlyDelegateAdmin whenNotPaused
withdrawRebalanceFee() onlyDelegateAdmin whenNotPaused
withdrawReferralFee() onlyDelegateAdmin whenNotPaused
withdrawWithdrawalFee() onlyDelegateAdmin whenNotPaused
pause() onlyDelegateAdmin
unpause() onlyDelegateAdmin
getUserDepositInfor() view
### MoneyFiReferral
deposit()
withdraw() onlyDelegateAdmin nonReentrant
claim() whenNotPaused nonReentrant
setSigner() onlyDelegateAdmin
pause() onlyDelegateAdmin
unpause() onlyDelegateAdmin
### MoneyFiCrossChainRouter
depositFundToStrategyCrossChainFromOperator() onlyAtLeastOperator whenNotPaused
withdrawFundSameChain() onlyAtLeastOperator whenNotPaused
withdrawFundAnotherChain() onlyAtLeastOperator whenNotPaused
withdrawFundCrossChainFromOperatorHotWallet() onlyAtLeastOperator whenNotPaused
upgradeControllerAndFundVault() onlyAdmin
pause() onlyDelegateAdmin
unpause() onlyDelegateAdmin
collectNative() onlyDelegateAdmin whenNotPaused
setWhiteListHotWallet() onlyDelegateAdmin
### MoneyFiRouter
depositFund() whenNotPaused nonReentrant
withdrawFundSameChain() withdrawRateLimit whenNotPaused
createWithdrawRequestOnAnotherChain() withdrawRateLimit whenNotPaused
rebalanceFundSameChain() onlyAtLeastOperator whenNotPaused
depositFundToStrategySameChainFromOperator() onlyAtLeastOperator whenNotPaused
emergencyWithdrawFund() onlyDelegateAdmin
setEmergencyStop() onlyDelegateAdmin
setCoolDownPeriodWithdrawRequest() onlyDelegateAdmin
pause() onlyDelegateAdmin
unpause() onlyDelegateAdmin
upgradeControllerAndFundVault() onlyAdmin
getNextWithdrawRequestTime() view
### MoneyFiUniSwap
swapToken()
setRouterV3() onlyDelegateAdmin
setRouterV2() onlyDelegateAdmin
setFactoryV3() onlyDelegateAdmin
setFactoryV2() onlyDelegateAdmin
checkPoolExistsV3() view
checkPoolExistsV2() view
setPoolFee() onlyDelegateAdmin
### MoneyFiStargateCrossChain
constructor()
initialize() initializer
takeTransportDeposit() onlyRouter
takeTransportWithdraw() onlyRouter
lzCompose()
executeTransferFundFromRouterToFundVaultCrossChain() onlyAtLeastOperator
executeTransferFundFromRouterToFundVaultCrossChainLzComposeAlert() onlyAtLeastOperator
withdrawal() onlyDelegateAdmin
setStargateEndpointId() onlyDelegateAdmin
setStargatePoolToken() onlyDelegateAdmin
setFundVault() onlyAdmin
setController() onlyAdmin
setLzEndpoint() onlyAdmin
endcodeComposeMsg() pure
decodeComposeParams() pure
decodeTransportParams() pure
addressToBytes32() pure
prepareForTransport() view
prepareTransportMsg() pure
decodeLzComposeMsg() pure
### UniswapPool
setSlippageWhenSwapAsset(uint256 _slippageWhenSwapAsset) only delegate admin
setMinimumSwapAmount(uint256 _minimumSwapAmount) only delegate admin
emergencyWithdraw() only router
totalLiquidWhitelistPool
totalAssets
beforeWithdraw
afterDeposit
isSupportUnderlyingAsset
emergencyWithdraw