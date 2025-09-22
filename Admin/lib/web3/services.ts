import { ethers } from "ethers"
import { getMoneyFiController, getMoneyFiFundVault, getERC20Contract } from "./contracts"
import { CONTRACT_ADDRESSES } from "./config"

export interface SystemConfig {
  protocolFee: bigint
  referralFee: bigint
  withdrawalFee: bigint
  isActive: boolean
}

export interface UserDepositInfo {
  originalDepositAmount: bigint
  currentDepositAmount: bigint
  durationDeposit: bigint
  updatedAt: bigint
}

export interface TokenInfo {
  name: string
  symbol: string
  decimals: number
  balance: bigint
  allowance: bigint
}

export class Web3Service {
  private provider: ethers.Provider
  private signer?: ethers.Signer

  constructor(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider
    this.signer = signer
  }

  // System Configuration
  async getSystemConfig(): Promise<SystemConfig> {
    const controller = getMoneyFiController(this.provider)
    const config = await controller.getSystemConfig()
    return {
      protocolFee: config.protocolFee,
      referralFee: config.referralFee,
      withdrawalFee: config.withdrawalFee,
      isActive: config.isActive,
    }
  }

  async setProtocolFee(fee: bigint): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error("Signer required")
    const controller = getMoneyFiController(this.signer)
    return await controller.setProtocolFee(fee)
  }

  async setReferralFee(fee: bigint): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error("Signer required")
    const controller = getMoneyFiController(this.signer)
    return await controller.setReferralFee(fee)
  }

  async setWithdrawalFee(fee: bigint): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error("Signer required")
    const controller = getMoneyFiController(this.signer)
    return await controller.setWithdrawalFee(fee)
  }

  async pauseSystem(): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error("Signer required")
    const controller = getMoneyFiController(this.signer)
    return await controller.pause()
  }

  async unpauseSystem(): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error("Signer required")
    const controller = getMoneyFiController(this.signer)
    return await controller.unpause()
  }

  // Fund Vault Operations
  async getUserDepositInfo(tokenAddress: string, userAddress: string): Promise<UserDepositInfo> {
    const vault = getMoneyFiFundVault(this.provider)
    const info = await vault.getUserDepositInfor(tokenAddress, userAddress)
    return {
      originalDepositAmount: info.originalDepositAmount,
      currentDepositAmount: info.currentDepositAmount,
      durationDeposit: info.durationDeposit,
      updatedAt: info.updatedAt,
    }
  }

  async depositFund(
    tokenAddress: string,
    receiver: string,
    amount: bigint,
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error("Signer required")
    const vault = getMoneyFiFundVault(this.signer)
    return await vault.depositFund(tokenAddress, receiver, amount)
  }

  async withdrawFund(
    userAddress: string,
    receiver: string,
    tokenAddress: string,
    amount: bigint,
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error("Signer required")
    const vault = getMoneyFiFundVault(this.signer)
    return await vault.withdrawUnDistributedFundToUser(userAddress, receiver, tokenAddress, amount)
  }

  // Fee Information
  async getProtocolFee(tokenAddress: string): Promise<bigint> {
    const vault = getMoneyFiFundVault(this.provider)
    return await vault.totalProtocolFee(tokenAddress)
  }

  async getReferralFee(tokenAddress: string): Promise<bigint> {
    const vault = getMoneyFiFundVault(this.provider)
    return await vault.referralFee(tokenAddress)
  }

  async getRebalanceFee(tokenAddress: string): Promise<bigint> {
    const vault = getMoneyFiFundVault(this.provider)
    return await vault.rebalanceFee(tokenAddress)
  }

  async getWithdrawFee(tokenAddress: string): Promise<bigint> {
    const vault = getMoneyFiFundVault(this.provider)
    return await vault.withdrawFee(tokenAddress)
  }

  // Token Operations
  async getTokenInfo(tokenAddress: string, userAddress: string): Promise<TokenInfo> {
    const token = getERC20Contract(tokenAddress, this.provider)
    const [name, symbol, decimals, balance, allowance] = await Promise.all([
      token.name(),
      token.symbol(),
      token.decimals(),
      token.balanceOf(userAddress),
      token.allowance(userAddress, CONTRACT_ADDRESSES.MONEYFI_FUND_VAULT),
    ])

    return {
      name,
      symbol,
      decimals,
      balance,
      allowance,
    }
  }

  async approveToken(
    tokenAddress: string,
    spender: string,
    amount: bigint,
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error("Signer required")
    const token = getERC20Contract(tokenAddress, this.signer)
    return await token.approve(spender, amount)
  }

  // Utility Functions
  async isAdmin(address: string): Promise<boolean> {
    const controller = getMoneyFiController(this.provider)
    return await controller.isAdmin(address)
  }

  async grantAdminRole(address: string): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error("Signer required")
    const controller = getMoneyFiController(this.signer)
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"))
    return await controller.grantRole(ADMIN_ROLE, address)
  }

  async revokeAdminRole(address: string): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error("Signer required")
    const controller = getMoneyFiController(this.signer)
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"))
    return await controller.revokeRole(ADMIN_ROLE, address)
  }
}
