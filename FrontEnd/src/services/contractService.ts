import { ethers } from "ethers"
import { CONTRACT_ADDRESSES } from "@/src/config/contracts"
import MoneyFiRouterJSON from "@/src/contracts/MoneyFiRouter.json"
import MoneyFiFundFiJSON from "@/src/contracts/MoneyFiVault.json"
import LPToken from "@/src/contracts/LPToken.json"

const MoneyFiRouterABI = MoneyFiRouterJSON.abi
const MoneyFiFundVaultABI = MoneyFiFundFiJSON.abi
const LPTokenABI = LPToken.abi

export class ContractService {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.Signer | null = null

  constructor(provider?: ethers.BrowserProvider) {
    this.provider = provider || null
  }

  async getSigner() {
    if (!this.provider) {
      if (typeof window !== "undefined" && window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum)
      } else {
        throw new Error("No ethereum provider found. Please install MetaMask.")
      }
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

  async getUSDCContract() {
    const signer = await this.getSigner()
    return new ethers.Contract(CONTRACT_ADDRESSES.USDC, LPTokenABI, signer)
  }

  async getMoneyFiRouterContract() {
    const signer = await this.getSigner()
    return new ethers.Contract(CONTRACT_ADDRESSES.MoneyFiRouter, MoneyFiRouterABI, signer)
  }

  async getMoneyFiFundVaultContract() {
    const signer = await this.getSigner()
    return new ethers.Contract(CONTRACT_ADDRESSES.MoneyFiFundVault, MoneyFiFundVaultABI, signer)
  }

  async getUSDCBalance(address: string): Promise<string> {
    try {
      const usdcContract = await this.getUSDCContract()
      const balance = await usdcContract.balanceOf(address)
      return ethers.formatUnits(balance, 6) // USDC có 6 decimals
    } catch (error) {
      console.error("Error getting USDC balance:", error)
      return "0"
    }
  }

  async approveUSDC(amount: string): Promise<ethers.TransactionResponse> {
    const usdcContract = await this.getUSDCContract()
    const amountWei = ethers.parseUnits(amount, 6)
    return await usdcContract.approve(CONTRACT_ADDRESSES.MoneyFiRouter, amountWei)
  }

  async depositFund(amount: string): Promise<ethers.TransactionResponse> {
    const routerContract = await this.getMoneyFiRouterContract()
    const amountWei = ethers.parseUnits(amount, 6)
    console.log("[v0] Depositing amount in wei:", amountWei);

    const depositParam = {
      tokenAddress: CONTRACT_ADDRESSES.USDC,
      amount: amountWei,
    }

    return await routerContract.depositFund(depositParam)
  }

  async getUSDCAllowance(ownerAddress: string): Promise<string> {
    try {
      const usdcContract = await this.getUSDCContract()
      const allowance = await usdcContract.allowance(ownerAddress, CONTRACT_ADDRESSES.MoneyFiRouter)
      return ethers.formatUnits(allowance, 6)
    } catch (error) {
      console.error("Error getting USDC allowance:", error)
      return "0"
    }
  }

  async getUniLinkPoolBalance(userAddress: string): Promise<number> {
    try {
      // Mock implementation - cần thay thế bằng contract calls thực tế
      // Gọi uniLinkStrategy.balanceOf(userAddress) và convertToAssets()
      console.log(`[v0] Getting UNI/LINK pool balance for ${userAddress}`)

      // Giả lập giá trị từ file main.ts
      const mockShares = 0.5 // shares
      const mockUniAssets = 0.1 // UNI assets
      const uniPrice = 416245 // UNI price in USDC

      return mockUniAssets * uniPrice
    } catch (error) {
      console.error("Error getting UNI/LINK pool balance:", error)
      return 0
    }
  }

  async getUsdcArbPoolBalance(userAddress: string): Promise<number> {
    try {
      // Mock implementation - cần thay thế bằng contract calls thực tế
      // Gọi usdcArbStrategy.balanceOf(userAddress) và convertToAssets()
      console.log(`[v0] Getting USDC/ARB pool balance for ${userAddress}`)

      // Giả lập giá trị từ file main.ts
      const mockShares = 0.3 // shares
      const mockUsdcAssets = 150.5 // USDC assets

      return mockUsdcAssets
    } catch (error) {
      console.error("Error getting USDC/ARB pool balance:", error)
      return 0
    }
  }

  async getFundVaultBalance(userAddress: string): Promise<number> {
    try {
      // Mock implementation - cần thay thế bằng contract calls thực tế
      // Gọi fundVault.getUserDepositInfor(usdcAddress, userAddress)
      console.log(`[v0] Getting FundVault balance for ${userAddress}`)

      // Giả lập giá trị từ file main.ts
      const mockCurrentDepositAmount = 500.25 // USDC

      return mockCurrentDepositAmount
    } catch (error) {
      console.error("Error getting FundVault balance:", error)
      return 0
    }
  }

  async depositUSDC(amount: number, userAddress: string): Promise<void> {
    try {
      console.log(`[v0] Depositing ${amount} USDC for ${userAddress}`)

      // 2. Deposit to fund
      const depositTx = await this.depositFund(amount.toString()) // truyền "9.55"
      await depositTx.wait()

      console.log(`[v0] Deposit successful`)
    } catch (error) {
      console.error("Error depositing USDC:", error)
      console.log(`[v0] Deposit failed: ${error}`)
      throw error
    }
  }

  async withdrawUSDC(amount: number, userAddress: string): Promise<void> {
    try {
      console.log(`[v0] Withdrawing ${amount} USDC for ${userAddress}`)

      // Mock implementation - cần thay thế bằng contract calls thực tế
      // Gọi các hàm withdraw từ strategies và fund vault

      console.log(`[v0] Withdraw successful`)
    } catch (error) {
      console.error("Error withdrawing USDC:", error)
      throw error
    }
  }

  async getUserDepositInfo(userAddress: string): Promise<{
    originalDepositAmount: number
    currentDepositAmount: number
  }> {
    try {
      // Mock implementation - cần thay thế bằng contract calls thực tế
      // Gọi fundVault.getUserDepositInfor(usdcAddress, userAddress)
      console.log(`[v0] Getting user deposit info for ${userAddress}`)

      // Giả lập giá trị từ file main.ts
      const mockOriginalDepositAmount = 1000.0 // USDC gốc đã deposit
      const mockCurrentDepositAmount = 1150.25 // USDC hiện tại có thể rút

      const fundVaultContract = await this.getMoneyFiFundVaultContract()

      const userDepositInfo = await fundVaultContract.getUserDepositInfor(CONTRACT_ADDRESSES.USDC, userAddress)

      console.log("User deposit info from contract:", userDepositInfo.originalDepositAmount)

      return {
        originalDepositAmount: Number(ethers.formatUnits(userDepositInfo.originalDepositAmount, 6)),
        currentDepositAmount: mockCurrentDepositAmount,
      }
    } catch (error) {
      console.error("Error getting user deposit info:", error)
      return {
        originalDepositAmount: 0,
        currentDepositAmount: 0,
      }
    }
  }
}
