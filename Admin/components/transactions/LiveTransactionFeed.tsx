// components/TransactionHistory/LiveTransactionFeed.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Transaction } from "@/services/transaction.api"
import { Activity, ArrowDownLeft, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface LiveTransactionFeedProps {
    transactions: Transaction[]
}

export function LiveTransactionFeed({ transactions }: LiveTransactionFeedProps) {
    const getTransactionIcon = (type: string) => {
        if (type.includes("deposit")) return <ArrowDownLeft className="h-4 w-4 text-green-500" />
        if (type.includes("rebalance")) return <RefreshCw className="h-4 w-4 text-purple-500" />
        return <Activity className="h-4 w-4 text-gray-500" />
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>
            case "pending":
                return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>
            case "failed":
                return <Badge variant="destructive">Failed</Badge>
            default:
                return <Badge variant="secondary">Unknown</Badge>
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Live Transaction Feed
                </CardTitle>
                <CardDescription>Real-time transaction monitoring</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {transactions.slice(0, 5).map((tx) => (
                        <div key={tx._id} className="flex items-center gap-3 p-3 rounded-lg border">
                            {getTransactionIcon(tx.type)}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium capitalize">{tx.type}</span>
                                    {getStatusBadge(tx.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">{tx.amountDeposit}</p>
                            </div>
                            <div className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleTimeString()}</div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}