// lib/web3/ControllerContract.ts
import { ethers } from "ethers"
import { CONTRACT_ADDRESSES, UNISWAPV2_ADDRESSES } from "@/lib/web3/config"
import { CONTRACT_ABI } from "@/config/abis"
import { Strategy, StrategyExternal, TokenInfo, CrossChainParam, InternalSwapParam } from "@/lib/web3/type/controllerType"

export class ControllerContract {
    private provider: ethers.BrowserProvider | null = null
    private signer: ethers.Signer | null = null
    private contract: ethers.Contract | null = null
    private baseTokenDecimals: number = 18 // Default to 18 decimals if not specified

    constructor(provider?: ethers.BrowserProvider) {
        this.provider = provider || null
        if (typeof window !== "undefined" && window.ethereum && !this.provider) {
            this.provider = new ethers.BrowserProvider(window.ethereum)
        }
        this.initializeContract()
    }

    private async initializeContract() {
        try {
            if (this.provider && !this.contract) {
                const signer = await this.getSigner()
                this.contract = new ethers.Contract(
                    CONTRACT_ADDRESSES.MONEYFI_CONTROLLER,
                    CONTRACT_ABI.MONEYFI_CONTROLLER,
                    signer
                )
            }
        } catch (error) {
            console.error("Error initializing contract:", error)
        }
    }

    private async getSigner() {
        if (!this.provider) {
            throw new Error("No Ethereum provider found. Please install MetaMask.")
        }
        if (!this.signer) {
            try {
                this.signer = await this.provider.getSigner()
            } catch (error) {
                console.error("Error getting signer:", error)
                throw new Error("Failed to get signer. Please connect your wallet.")
            }
        }
        return this.signer
    }

    private ensureContractInitialized() {
        if (!this.contract) {
            throw new Error("Contract not initialized. Please ensure a valid provider and signer are available.")
        }
    }

    // --- Set Functions ---
    async setSigner(address: string) {
        this.ensureContractInitialized()
        if (!ethers.isAddress(address)) throw new Error("Invalid address")
        return await this.contract!.setSigner(address)
    }

    async setProtocolFee(fee: number) {
        this.ensureContractInitialized()
        const feeInBasisPoints = Math.round(fee * 100) // Convert percentage to basis points
        return await this.contract!.setProtocolFee(feeInBasisPoints)
    }

    async setTokenInfoInternal(token: string, tokenInfo: TokenInfo) {
        this.ensureContractInitialized()
        if (!ethers.isAddress(token)) throw new Error("Invalid token address")
        return await this.contract!.setTokenInfoInternal(token, tokenInfo)
    }

    async setTokenInfoExternal(token: string, tokenInfo: TokenInfo) {
        this.ensureContractInitialized()
        if (!ethers.isAddress(token)) throw new Error("Invalid token address")
        return await this.contract!.setTokenInfoExternal(token, tokenInfo)
    }

    async setStrategyInternal(strategy: string, strategyInfo: Strategy) {
        this.ensureContractInitialized()
        if (!ethers.isAddress(strategy)) throw new Error("Invalid strategy address")
        return await this.contract!.setStrategyInternal(strategy, strategyInfo)
    }

    async setStrategyExternal(strategy: string, strategyInfo: StrategyExternal) {
        this.ensureContractInitialized()
        if (!ethers.isAddress(strategy)) throw new Error("Invalid strategy address")
        return await this.contract!.setStrategyExternal(strategy, strategyInfo)
    }

    async setEnableReferralSignature(isEnabled: boolean) {
        this.ensureContractInitialized()
        return await this.contract!.setEnableReferralSignature(isEnabled)
    }

    async setCrossChainSwapInternal(crossChainSwap: string, crossChainParam: CrossChainParam) {
        this.ensureContractInitialized()
        if (!ethers.isAddress(crossChainSwap)) throw new Error("Invalid cross-chain swap address")
        return await this.contract!.setCrossChainSwapInternal(crossChainParam, crossChainSwap)
    }

    async setCrossChainSwapExternal(crossChainSwap: string, crossChainParam: CrossChainParam) {
        this.ensureContractInitialized()
        if (!ethers.isAddress(crossChainSwap)) throw new Error("Invalid cross-chain swap address")
        return await this.contract!.setCrossChainSwapExternal(crossChainParam, crossChainSwap)
    }

    async setDexInternalSwap(internalSwap: string, internalParam: InternalSwapParam) {
        this.ensureContractInitialized()
        if (!ethers.isAddress(internalSwap)) throw new Error("Invalid internal swap address")
        return await this.contract!.setDexInternalSwap(internalParam, internalSwap)
    }

    async setDexExternalSwap(externalSwap: string, internalParam: InternalSwapParam) {
        this.ensureContractInitialized()
        if (!ethers.isAddress(externalSwap)) throw new Error("Invalid external swap address")
        return await this.contract!.setDexExternalSwap(internalParam, externalSwap)
    }

    async setRouter(router: string) {
        this.ensureContractInitialized()
        if (!ethers.isAddress(router)) throw new Error("Invalid router address")
        return await this.contract!.setRouter(router)
    }

    async setCrossChainRouter(crossChainRouter: string) {
        this.ensureContractInitialized()
        if (!ethers.isAddress(crossChainRouter)) throw new Error("Invalid cross-chain router address")
        return await this.contract!.setCrossChainRouter(crossChainRouter)
    }

    async setMaxPercentLiquidityStrategy(tokenAddress: string, percent: number) {
        this.ensureContractInitialized()
        if (!ethers.isAddress(tokenAddress)) throw new Error("Invalid token address")
        const percentInBasisPoints = Math.round(percent * 100) // Convert percentage to basis points
        return await this.contract!.setMaxPercentLiquidityStrategy(tokenAddress, percentInBasisPoints)
    }

    async setMaxDepositValue(tokenAddress: string, maxDepositValue: number) {
        this.ensureContractInitialized()
        if (!ethers.isAddress(tokenAddress)) throw new Error("Invalid token address")
        const maxDepositValueInWei = ethers.parseUnits(maxDepositValue.toString(), this.baseTokenDecimals)
        return await this.contract!.setMaxDepositValue(tokenAddress, maxDepositValueInWei)
    }

    async setMaxPercentLiquidityStrategyToken(tokenAddress: string, maxPercent: number) {
        this.ensureContractInitialized()
        if (!ethers.isAddress(tokenAddress)) throw new Error("Invalid token address")
        const percentInBasisPoints = Math.round(maxPercent * 100) // Convert percentage to basis points
        return await this.contract!.setMaxPercentLiquidityStrategyToken(tokenAddress, percentInBasisPoints)
    }

    async setReferralFee(fee: number) {
        this.ensureContractInitialized()
        const feeInBasisPoints = Math.round(fee * 100) // Convert percentage to basis points
        return await this.contract!.setReferralFee(feeInBasisPoints)
    }

    async setHotWallet(hotWallet: string) {
        this.ensureContractInitialized()
        if (!ethers.isAddress(hotWallet)) throw new Error("Invalid hot wallet address")
        return await this.contract!.setHotWallet(hotWallet)
    }

    async setAverageSystemActionFee(fee: number) {
        this.ensureContractInitialized()
        const feeInWei = ethers.parseUnits(fee.toString(), this.baseTokenDecimals)
        return await this.contract!.setAverageSystemActionFee(feeInWei)
    }

    async setGrantRole(address: string, role: string) {
        this.ensureContractInitialized()
        if (!ethers.isAddress(address)) throw new Error("Invalid address")
        return await this.contract!.grantRole(role, address)
    }

    //------------------------------------------------------------------------------------
    // --- ------------------------ Read (Check) Functions -----------------------------------
    //------------------------------------------------------------------------------------

    async getProtocolFee(): Promise<number> {
        this.ensureContractInitialized()
        const fee = await this.contract!.protocolFee()
        return Number(fee) / 100 // Convert basis points to percentage
    }

    async getReferralFee(): Promise<number> {
        this.ensureContractInitialized()
        const fee = await this.contract!.referralFee()
        return Number(fee) / 100 // Convert basis points to percentage
    }

    async getRouter(): Promise<string> {
        this.ensureContractInitialized()
        return await this.contract!.router()
    }

    async getCrossChainRouter(): Promise<string> {
        this.ensureContractInitialized()
        return await this.contract!.crossChainRouter()
    }

    async getSignerController(): Promise<string> {
        this.ensureContractInitialized()
        return await this.contract!.signer()
    }

    async getHotWallet(): Promise<string> {
        this.ensureContractInitialized()
        return await this.contract!.hotWallet()
    }

    async getAverageSystemActionFee(): Promise<number> {
        this.ensureContractInitialized()
        const fee = await this.contract!.averageSystemActionFee()
        return Number(ethers.formatUnits(fee, this.baseTokenDecimals))
    }

    async getEnableReferralSignature(): Promise<boolean> {
        this.ensureContractInitialized()
        return await this.contract!.isEnableReferralSignature()
    }

    async getMaxPercentLiquidityStrategyToken(tokenAddress: string): Promise<number> {
        this.ensureContractInitialized()
        if (!ethers.isAddress(tokenAddress)) throw new Error("Invalid token address")
        const percent = await this.contract!.maxPercentLiquidityStrategyToken(tokenAddress)
        return Number(percent) / 100 // Convert basis points to percentage
    }

    async getMaxDepositValueToken(tokenAddress: string): Promise<number> {
        this.ensureContractInitialized()
        if (!ethers.isAddress(tokenAddress)) throw new Error("Invalid token address")
        const value = await this.contract!.maxDepositValueToken(tokenAddress)
        return Number(ethers.formatUnits(value, this.baseTokenDecimals))
    }

    async getSupportedTokenInternalInfor(token: string): Promise<TokenInfo> {
        this.ensureContractInitialized()
        if (!ethers.isAddress(token)) throw new Error("Invalid token address")
        return await this.contract!.getSupportedTokenInternalInfor(token)
    }

    async isStrategyInternalActive(strategy: string): Promise<boolean> {
        this.ensureContractInitialized()
        if (!ethers.isAddress(strategy)) throw new Error("Invalid strategy address")
        return await this.contract!.isStrategyInternalActive(strategy)
    }

    async isStrategyExternalActive(strategy: string): Promise<boolean> {
        this.ensureContractInitialized()
        if (!ethers.isAddress(strategy)) throw new Error("Invalid strategy address")
        return await this.contract!.isStrategyExternalActive(strategy)
    }

    async isDexCrossChainInternalActive(dexCrossChain: string): Promise<boolean> {
        this.ensureContractInitialized()
        if (!ethers.isAddress(dexCrossChain)) throw new Error("Invalid dex cross-chain address")
        return await this.contract!.isDexCrossChainInternalActive(dexCrossChain)
    }

    async isDexCrossChainExternalActive(dexCrossChain: string): Promise<boolean> {
        this.ensureContractInitialized()
        if (!ethers.isAddress(dexCrossChain)) throw new Error("Invalid dex cross-chain address")
        return await this.contract!.isDexCrossChainExternalActive(dexCrossChain)
    }

    async isTokenSupportInternalActive(token: string): Promise<boolean> {
        this.ensureContractInitialized()
        if (!ethers.isAddress(token)) throw new Error("Invalid token address")
        return await this.contract!.isTokenSupportInternalActive(token)
    }

    async isTokenSupportExternalActive(token: string): Promise<boolean> {
        this.ensureContractInitialized()
        if (!ethers.isAddress(token)) throw new Error("Invalid token address")
        return await this.contract!.isTokenSupportExternalActive(token)
    }

    async isDexSwapInternalActive(dexSwap: string): Promise<boolean> {
        this.ensureContractInitialized()
        if (!ethers.isAddress(dexSwap)) throw new Error("Invalid dex swap address")
        return await this.contract!.isDexSwapInternalActive(dexSwap)
    }

    async isDexSwapExternalActive(dexSwap: string): Promise<boolean> {
        this.ensureContractInitialized()
        if (!ethers.isAddress(dexSwap)) throw new Error("Invalid dex swap address")
        return await this.contract!.isDexSwapExternalActive(dexSwap)
    }

    async isValidUnderlyingAssetStrategyExternal(strategy: string, underlyingAsset: string): Promise<boolean> {
        this.ensureContractInitialized()
        if (!ethers.isAddress(strategy) || !ethers.isAddress(underlyingAsset)) {
            throw new Error("Invalid strategy or underlying asset address")
        }
        return await this.contract!.isValidUnderlyingAssetStrategyExternal(strategy, underlyingAsset)
    }

    async isCrossChainSwapSameType(crossChainSender: string, crossChainReceiver: string): Promise<boolean> {
        this.ensureContractInitialized()
        if (!ethers.isAddress(crossChainSender) || !ethers.isAddress(crossChainReceiver)) {
            throw new Error("Invalid cross-chain sender or receiver address")
        }
        return await this.contract!.isCrossChainSwapSameType(crossChainSender, crossChainReceiver)
    }
}