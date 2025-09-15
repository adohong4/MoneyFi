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
}

export const apiService = new ApiService()
