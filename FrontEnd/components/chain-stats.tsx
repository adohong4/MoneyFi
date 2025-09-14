"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface ChainStat {
  name: string
  symbol: string
  totalDeposits: string
  apr: number
  users: number
  percentage: number
}

const mockChainStats: ChainStat[] = [
  { name: "Ethereum", symbol: "ETH", totalDeposits: "2,450,000", apr: 8.5, users: 1250, percentage: 35 },
  { name: "Arbitrum", symbol: "ARB", totalDeposits: "1,890,000", apr: 12.2, users: 980, percentage: 27 },
  { name: "Base", symbol: "BASE", totalDeposits: "1,200,000", apr: 10.8, users: 750, percentage: 17 },
  { name: "BNB Chain", symbol: "BNB", totalDeposits: "980,000", apr: 9.5, users: 620, percentage: 14 },
  { name: "Core", symbol: "CORE", totalDeposits: "480,000", apr: 15.2, users: 320, percentage: 7 },
]

export function ChainStats() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chain Statistics</CardTitle>
        <CardDescription>Deposits and performance across all supported chains</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {mockChainStats.map((chain) => (
            <div key={chain.symbol} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{chain.symbol}</Badge>
                  <span className="font-medium">{chain.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">${chain.totalDeposits}</div>
                  <div className="text-sm text-muted-foreground">{chain.users} users</div>
                </div>
              </div>
              <Progress value={chain.percentage} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{chain.percentage}% of total deposits</span>
                <span className="text-green-600 font-medium">{chain.apr}% APR</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
