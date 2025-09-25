import MoneyFiControllerJSON from "@/contracts/MoneyFiController.json"
import MoneyFiFundVaultJSON from "@/contracts/MoneyFiFundVault.json"
import MoneyFiRouterJSON from "@/contracts/MoneyFiRouter.json"
import MoneyFiRouterCrossChainJSON from "@/contracts/MoneyFiCrossChainRouter.json"
import MoneyFiStrategyJSON from "@/contracts/MoneyFiStrategyUpgradeableUniswap.json"
import MoneyFiReferralJSON from "@/contracts/MoneyFiReferral.json"

export const CONTRACT_ABI = {
    MONEYFI_ROUTER: MoneyFiRouterJSON.abi,
    MONEYFI_FUND_VAULT: MoneyFiFundVaultJSON.abi,
    MONEYFI_CONTROLLER: MoneyFiControllerJSON.abi,
    MONEYFI_ROUTER_CROSS_CHAIN: MoneyFiRouterCrossChainJSON.abi,
    MONEYFI_STRATEGY: MoneyFiStrategyJSON.abi,
    MONEYFI_REFERRAL: MoneyFiReferralJSON.abi,
}