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

  constructor(baseUrl = "") {
    this.baseUrl = baseUrl
  }

  async deposit(data: DepositData): Promise<any> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.deposits}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
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
