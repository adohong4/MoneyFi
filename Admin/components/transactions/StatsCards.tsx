import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Transaction } from "@/services/transaction.api"

export function StatsCards({
    transactions,
    totalTransactions,
}: {
    transactions: Transaction[]
    totalTransactions: number
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalTransactions}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Successful</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{transactions.filter((tx) => tx.status === "completed").length}</div>
                    <div className="text-xs text-muted-foreground">
                        {totalTransactions > 0
                            ? ((transactions.filter((tx) => tx.status === "completed").length / totalTransactions) * 100).toFixed(1)
                            : 0}
                        % success rate
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{transactions.filter((tx) => tx.status === "failed").length}</div>
                    <div className="text-xs text-red-500">Requires attention</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Gas Used (ETH)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">N/A</div>
                    <div className="text-xs text-muted-foreground">Gas data not available</div>
                </CardContent>
            </Card>
        </div>
    )
}