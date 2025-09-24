// components/TransactionHistory/TransactionRow.tsx
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Transaction } from "@/services/transaction.api"
import { ArrowDownLeft, RefreshCw, Activity, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TransactionDetailsDialog } from "./TransactionDialog"

interface TransactionRowProps {
    transaction: Transaction
}

export function TransactionRow({ transaction }: TransactionRowProps) {
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

    const getExplorerUrl = (txHash: string) => {
        return `https://sepolia.etherscan.io/tx/${txHash}`
    }

    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-2">
                    {getTransactionIcon(transaction.type)}
                    <span className="capitalize">{transaction.type}</span>
                </div>
            </TableCell>
            <TableCell className="font-mono text-sm">
                {transaction.txHash.slice(0, 10)}...{transaction.txHash.slice(-8)}
            </TableCell>
            <TableCell className="font-mono text-sm">
                {transaction.userAddress.slice(0, 6)}...{transaction.userAddress.slice(-4)}
            </TableCell>
            <TableCell className="font-medium">{transaction.poolName}</TableCell>
            <TableCell className="font-medium">{transaction.amountDeposit}</TableCell>
            <TableCell>{getStatusBadge(transaction.status)}</TableCell>
            <TableCell className="text-muted-foreground">{new Date(transaction.createdAt).toLocaleString()}</TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <TransactionDetailsDialog transaction={transaction} />
                    <Button variant="ghost" size="sm" asChild>
                        <a href={getExplorerUrl(transaction.txHash)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    )
}