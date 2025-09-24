import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Transaction } from "@/services/transaction.api"
import { TransactionFilters } from "./TransactionFilters"
import { TransactionRow } from "./TransactionRow"
import { Pagination } from "@/components/pagination"
import { Table, TableBody, TableHead, TableCell, TableHeader, TableRow } from "@/components/ui/table"

export function TransactionTable({
    transactions,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalTransactions,
}: {
    transactions: Transaction[]
    loading: boolean
    searchTerm: string
    setSearchTerm: (value: string) => void
    statusFilter: string
    setStatusFilter: (value: string) => void
    typeFilter: string
    setTypeFilter: (value: string) => void
    currentPage: number
    setCurrentPage: (page: number) => void
    pageSize: number
    setPageSize: (size: number) => void
    totalPages: number
    totalTransactions: number
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Complete history of all protocol transactions</CardDescription>
            </CardHeader>
            <CardContent>
                <TransactionFilters
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                    setCurrentPage={setCurrentPage}
                />
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Hash</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Pool</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center">
                                        Loading transactions...
                                    </TableCell>
                                </TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center">
                                        No transactions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => <TransactionRow key={tx._id} transaction={tx} />)
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalItems={totalTransactions}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(newPageSize) => {
                            setPageSize(newPageSize)
                            setCurrentPage(1)
                        }}
                    />
                </div>
            </CardContent>
        </Card>
    )
}