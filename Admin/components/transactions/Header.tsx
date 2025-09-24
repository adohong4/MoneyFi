import { Badge } from "@/components/ui/badge"
import { History } from "lucide-react"

export function Header({ totalTransactions }: { totalTransactions: number }) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-balance">Transaction History & Monitoring</h1>
                <p className="text-muted-foreground">Monitor all protocol transactions and system events</p>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                    <History className="h-3 w-3" />
                    {totalTransactions} Total Transactions
                </Badge>
            </div>
        </div>
    )
}