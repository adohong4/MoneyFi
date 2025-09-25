"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TransactionAPI, TransactionData, Transaction } from "@/services/apis/transaction.api"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/transactions/Header"
import { StatsCards } from "@/components/transactions/StatsCards"
import { TransactionTable } from "@/components/transactions/TransactionTable"
import { SystemEvents } from "@/components/transactions/SystemEvent"
import { LiveTransactionFeed } from "@/components/transactions/LiveTransactionFeed"
import { SystemAlerts } from "@/components/transactions/SystemAlerts"

// Mock system events (giữ nguyên)
const mockSystemEvents = [
    {
        id: "1",
        type: "config_change",
        title: "Protocol Fee Updated",
        description: "Protocol fee changed from 0.25% to 0.30%",
        admin: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
        timestamp: "2024-03-15 14:35:00",
        severity: "medium",
    },
    {
        id: "2",
        type: "emergency",
        title: "Emergency Stop Activated",
        description: "Emergency stop triggered for MoneyFiRouter due to suspicious activity",
        admin: "0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1",
        timestamp: "2024-03-15 13:45:22",
        severity: "high",
    },
    {
        id: "3",
        type: "pool_update",
        title: "New Pool Added",
        description: "WBTC-ETH pool has been added to the protocol",
        admin: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
        timestamp: "2024-03-15 12:20:10",
        severity: "low",
    },
    {
        id: "4",
        type: "user_action",
        title: "Large Withdrawal Detected",
        description: "User withdrew $500,000 worth of assets",
        admin: "System",
        timestamp: "2024-03-15 11:15:33",
        severity: "medium",
    },
]

export function TransactionHistory() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [systemEvents] = useState(mockSystemEvents)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [typeFilter, setTypeFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [totalTransactions, setTotalTransactions] = useState(0)

    const transactionApi = new TransactionAPI()

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true)
            try {
                const params: { page?: number; limit?: number; query?: string; status?: string; type?: string } = {
                    page: currentPage,
                    limit: pageSize,
                }
                let transactionInfo: TransactionData
                if (searchTerm || statusFilter !== "all" || typeFilter !== "all") {
                    transactionInfo = await transactionApi.searchTransactions({
                        query: searchTerm || undefined,
                        status: statusFilter !== "all" ? statusFilter : undefined,
                        type: typeFilter !== "all" ? typeFilter : undefined,
                    })
                } else {
                    transactionInfo = await transactionApi.getTransactions(params)
                }
                setTransactions(transactionInfo.metadata.transactions)
                setTotalPages(transactionInfo.metadata.totalPages)
                setTotalTransactions(transactionInfo.metadata.totalTransactions)
            } catch (error) {
                console.error("Error fetching transactions:", error)
                toast({
                    title: "Error",
                    description: "Failed to fetch transactions. Please try again.",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchTransactions()
    }, [currentPage, pageSize, searchTerm, statusFilter, typeFilter])

    return (
        <div className="p-6 space-y-6">
            <Header totalTransactions={totalTransactions} />
            <StatsCards transactions={transactions} totalTransactions={totalTransactions} />
            <Tabs defaultValue="transactions" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="transactions">Transaction History</TabsTrigger>
                    <TabsTrigger value="events">System Events</TabsTrigger>
                    <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
                </TabsList>
                <TabsContent value="transactions" className="space-y-6">
                    <TransactionTable
                        transactions={transactions}
                        loading={loading}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        typeFilter={typeFilter}
                        setTypeFilter={setTypeFilter}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        pageSize={pageSize}
                        setPageSize={setPageSize}
                        totalPages={totalPages}
                        totalTransactions={totalTransactions}
                    />
                </TabsContent>
                <TabsContent value="events" className="space-y-6">
                    <SystemEvents events={systemEvents} />
                </TabsContent>
                <TabsContent value="monitoring" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <LiveTransactionFeed transactions={transactions} />
                        <SystemAlerts />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}