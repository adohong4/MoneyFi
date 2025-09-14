"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award } from "lucide-react"

interface LeaderboardUser {
  rank: number
  address: string
  totalDeposit: string
  apr: number
  chain: string
}

const mockLeaderboard: LeaderboardUser[] = [
  { rank: 1, address: "0x1234...5678", totalDeposit: "125,000", apr: 12.5, chain: "ETH" },
  { rank: 2, address: "0x2345...6789", totalDeposit: "98,500", apr: 11.8, chain: "ARB" },
  { rank: 3, address: "0x3456...7890", totalDeposit: "87,200", apr: 11.2, chain: "BASE" },
  { rank: 4, address: "0x4567...8901", totalDeposit: "76,800", apr: 10.9, chain: "BNB" },
  { rank: 5, address: "0x5678...9012", totalDeposit: "65,400", apr: 10.5, chain: "CORE" },
]

export function UserLeaderboard() {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return (
          <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
            #{rank}
          </span>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Depositors</CardTitle>
        <CardDescription>Leaderboard of users with highest USDC deposits</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockLeaderboard.map((user) => (
            <div key={user.rank} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
              <div className="flex items-center gap-3">
                {getRankIcon(user.rank)}
                <div>
                  <div className="font-medium">{user.address}</div>
                  <div className="text-sm text-muted-foreground">${user.totalDeposit} USDC</div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="mb-1">
                  {user.chain}
                </Badge>
                <div className="text-sm font-medium text-green-600">{user.apr}% APR</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
