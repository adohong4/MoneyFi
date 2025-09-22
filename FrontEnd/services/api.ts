import { API_ENDPOINTS } from "@/config/constants"

export interface DepositData {
  amount: string
  token: string
  chain: string
  userAddress: string
}

export interface StatsData {
  totalDeposits: string
  totalUsers: number
  avgAPR: number
  totalVolume: string
}

export interface PoolBalance {
  poolName: string
  strategyAddress: string
  amountDeposited: string
  shares: string
  assets: string
  poolValueInUSDC: string
  reserves: {
    base: string
    quote: string
  }
  lpBalance: string
  txHash: string
  timestamp: string
}

export interface UserBalance {
  totalUserBalance: string
  currentUserFundVault: string
  originalUserFundVault: string
  totalDepositedToPools: string
  poolBalances: PoolBalance[]
}

export class ApiService {
  private baseUrl: string

  constructor(baseUrl = "http://localhost:4001/v1/api") {
    this.baseUrl = baseUrl
  }

  async connectWallet(userAddress: string, invitationCode: string): Promise<any> {
    console.log("address: ", userAddress)
    console.log("invitationCode: ", invitationCode)
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.connectWallet}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userAddress, invitationCode }),
    })
    return response.json()
  }

  async deposit(userAddress: string, amount: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.deposits}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userAddress, amount }),
    })
    return response.json()
  }

  async getStats(): Promise<StatsData> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.stats}`)
    return response.json()
  }

  async getLeaderboard(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.leaderboard}`)
    return response.json()
  }

  async getUserBalance(userAddress: string): Promise<UserBalance> {
    const response = await fetch(
      `${this.baseUrl}${API_ENDPOINTS.userBalance}/${encodeURIComponent(userAddress)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      totalUserBalance: data.metadata.totalBalance,
      currentUserFundVault: data.metadata.fundVault.currentDeposit,
      originalUserFundVault: data.metadata.fundVault.originalDeposit,
      totalDepositedToPools: data.metadata.totalDepositedToPools,
      poolBalances: data.metadata.poolBalances.map((pool: any) => ({
        poolName: pool.poolName,
        strategyAddress: pool.strategyAddress,
        amountDeposited: pool.amountDeposited,
        shares: pool.shares,
        assets: pool.assets,
        poolValueInUSDC: pool.poolValueInUSDC,
        reserves: {
          base: pool.reserves.base,
          quote: pool.reserves.quote,
        },
        lpBalance: pool.lpBalance,
        txHash: pool.txHash,
        timestamp: pool.timestamp,
      })),
    }
  }
}

export const apiService = new ApiService()