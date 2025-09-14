export interface UserData {
  address: string
  referrer?: string
  joinedAt: string
  totalDeposited: number
  totalWithdrawn: number
  referralEarnings: number
  referredUsers: number
}

export interface DepositRecord {
  id: string
  userAddress: string
  amount: number
  txHash: string
  timestamp: string
  status: "pending" | "completed" | "failed"
}

export interface RankingData {
  rank: number
  address: string
  totalDeposited: number
  totalEarnings: number
  apr: number
}

// Mock API functions - replace with real backend calls later
export const api = {
  // Save user address when wallet connects
  async saveUserAddress(address: string, referrer?: string): Promise<UserData> {
    console.log(`[API] Saving user address: ${address}, referrer: ${referrer}`)

    // Mock response
    return {
      address,
      referrer,
      joinedAt: new Date().toISOString(),
      totalDeposited: 0,
      totalWithdrawn: 0,
      referralEarnings: 0,
      referredUsers: 0,
    }
  },

  // Record deposit transaction
  async recordDeposit(userAddress: string, amount: number, txHash: string): Promise<DepositRecord> {
    console.log(`[API] Recording deposit: ${userAddress}, amount: ${amount}, tx: ${txHash}`)

    // Mock response
    return {
      id: `deposit_${Date.now()}`,
      userAddress,
      amount,
      txHash,
      timestamp: new Date().toISOString(),
      status: "completed",
    }
  },

  // Get user ranking data
  async getUserRanking(address: string): Promise<{ rank: number; total: number }> {
    console.log(`[API] Getting ranking for: ${address}`)

    // Mock response
    return {
      rank: Math.floor(Math.random() * 1000) + 1,
      total: 5000,
    }
  },

  // Get ranking leaderboard with pagination
  async getRankingLeaderboard(
    page = 1,
    limit = 20,
  ): Promise<{
    data: RankingData[]
    total: number
    page: number
    totalPages: number
  }> {
    console.log(`[API] Getting leaderboard: page ${page}, limit ${limit}`)

    // Mock data
    const mockData: RankingData[] = Array.from({ length: limit }, (_, i) => ({
      rank: (page - 1) * limit + i + 1,
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      totalDeposited: Math.floor(Math.random() * 100000) + 1000,
      totalEarnings: Math.floor(Math.random() * 10000) + 100,
      apr: Math.floor(Math.random() * 20) + 5,
    }))

    return {
      data: mockData,
      total: 5000,
      page,
      totalPages: Math.ceil(5000 / limit),
    }
  },

  // Process referral when user deposits
  async processReferral(userAddress: string, referrerAddress: string, depositAmount: number): Promise<void> {
    console.log(`[API] Processing referral: ${userAddress} -> ${referrerAddress}, amount: ${depositAmount}`)

    // Mock processing - calculate 2% referral bonus
    const referralBonus = depositAmount * 0.02
    console.log(`[API] Referral bonus: ${referralBonus}`)
  },
}
