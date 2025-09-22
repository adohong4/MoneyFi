"use client"

export const loadContractABI = async (contractName: string) => {
  switch (contractName) {
    case "DefaultAccessControlEnumerable":
      return (await import("@/contracts/DefaultAccessControlEnumerable.json")).default
    case "MoneyFiReferral":
      return (await import("@/contracts/MoneyFiReferral.json")).default
    case "MoneyFiFundVault":
      return (await import("@/contracts/MoneyFiFundVault.json")).default
    default:
      throw new Error(`Unknown contract: ${contractName}`)
  }
}

export const loadWeb3Utils = async () => {
  const [{ ethers }, { SUPPORTED_CHAINS }] = await Promise.all([import("ethers"), import("@/lib/web3/config")])

  return { ethers, SUPPORTED_CHAINS }
}

export class OptimizedContractService {
  private static instance: OptimizedContractService
  private contractCache = new Map()

  static getInstance() {
    if (!OptimizedContractService.instance) {
      OptimizedContractService.instance = new OptimizedContractService()
    }
    return OptimizedContractService.instance
  }

  async getContract(contractName: string, address: string, signer: any) {
    const cacheKey = `${contractName}-${address}`

    if (this.contractCache.has(cacheKey)) {
      return this.contractCache.get(cacheKey)
    }

    const [abi, { ethers }] = await Promise.all([loadContractABI(contractName), loadWeb3Utils()])

    const contract = new ethers.Contract(address, abi, signer)
    this.contractCache.set(cacheKey, contract)

    return contract
  }
}
