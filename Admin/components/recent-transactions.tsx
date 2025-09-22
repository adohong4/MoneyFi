"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, ArrowUpRight, ArrowDownLeft } from "lucide-react"

// Mock transaction data
const transactions = [
  {
    id: "0x1a2b3c...",
    type: "deposit",
    amount: "1,250.00 USDC",
    user: "0x4d5e6f...",
    pool: "USDC-ETH",
    status: "completed",
    timestamp: "2 minutes ago",
    gas: "0.0023 ETH",
  },
  {
    id: "0x2b3c4d...",
    type: "withdraw",
    amount: "850.50 DAI",
    user: "0x5e6f7a...",
    pool: "DAI-USDT",
    status: "pending",
    timestamp: "5 minutes ago",
    gas: "0.0019 ETH",
  },
  {
    id: "0x3c4d5e...",
    type: "swap",
    amount: "2,100.00 USDT",
    user: "0x6f7a8b...",
    pool: "USDT-USDC",
    status: "completed",
    timestamp: "8 minutes ago",
    gas: "0.0031 ETH",
  },
  {
    id: "0x4d5e6f...",
    type: "deposit",
    amount: "5,000.00 ETH",
    user: "0x7a8b9c...",
    pool: "ETH-WBTC",
    status: "failed",
    timestamp: "12 minutes ago",
    gas: "0.0045 ETH",
  },
  {
    id: "0x5e6f7a...",
    type: "rebalance",
    amount: "10,500.00 USDC",
    user: "System",
    pool: "Multi-Pool",
    status: "completed",
    timestamp: "15 minutes ago",
    gas: "0.0067 ETH",
  },
]

const getTransactionIcon = (type: string) => {
  switch (type) {
    case "deposit":
      return <ArrowDownLeft className="h-4 w-4 text-green-500" />
    case "withdraw":
      return <ArrowUpRight className="h-4 w-4 text-red-500" />
    default:
      return <ArrowUpRight className="h-4 w-4 text-blue-500" />
  }
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case "completed":
      return "default"
    case "pending":
      return "secondary"
    case "failed":
      return "destructive"
    default:
      return "default"
  }
}

export function RecentTransactions() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest protocol transactions and system operations</CardDescription>
        </div>
        <Button variant="outline" size="sm">
          View All
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {getTransactionIcon(tx.type)}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{tx.amount}</p>
                    <Badge variant="outline" className="text-xs">
                      {tx.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Pool: {tx.pool}</span>
                    <span>User: {tx.user}</span>
                    <span>Gas: {tx.gas}</span>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-1">
                <Badge variant={getStatusVariant(tx.status) as any}>{tx.status}</Badge>
                <p className="text-sm text-muted-foreground">{tx.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
