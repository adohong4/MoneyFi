"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  History,
  Search,
  Eye,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/pagination"
import { TransactionAPI, TransactionData, Transaction } from "@/services/transaction.api"

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
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalTransactions, setTotalTransactions] = useState(0)

  // Khởi tạo TransactionAPI
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
          // Tìm kiếm với các bộ lọc
          transactionInfo = await transactionApi.searchTransactions({
            query: searchTerm || undefined,
            status: statusFilter !== "all" ? statusFilter : undefined,
            type: typeFilter !== "all" ? typeFilter : undefined,
          })
        } else {
          // Lấy danh sách giao dịch
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

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Medium</Badge>
      case "low":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Low</Badge>
      default:
        return <Badge variant="secondary">Info</Badge>
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "emergency":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "config_change":
        return <RefreshCw className="h-4 w-4 text-blue-500" />
      case "pool_update":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getExplorerUrl = (txHash: string) => {
    return `https://sepolia.etherscan.io/tx/${txHash}`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
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

      {/* Stats Cards */}
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
            <div className="text-2xl font-bold">
              {transactions.filter((tx) => tx.status === "completed").length}
            </div>
            <div className="text-xs text-muted-foreground">
              {totalTransactions > 0
                ? (
                  (transactions.filter((tx) => tx.status === "completed").length / totalTransactions) *
                  100
                ).toFixed(1)
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

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="events">System Events</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
        </TabsList>

        {/* Transaction History Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Complete history of all protocol transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by hash, user, or pool..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={typeFilter}
                  onValueChange={(value) => {
                    setTypeFilter(value)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="rebalance">Rebalance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transaction Table */}
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
                      transactions.map((tx) => (
                        <TableRow key={tx._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(tx.type)}
                              <span className="capitalize">{tx.type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {tx.userAddress.slice(0, 6)}...{tx.userAddress.slice(-4)}
                          </TableCell>
                          <TableCell className="font-medium">{tx.poolName}</TableCell>
                          <TableCell className="font-medium">{tx.amountDeposit}</TableCell>
                          <TableCell>{getStatusBadge(tx.status)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedTransaction(tx)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl">
                                  <DialogHeader>
                                    <DialogTitle>Transaction Details</DialogTitle>
                                    <DialogDescription>Complete information for transaction {tx.txHash}</DialogDescription>
                                  </DialogHeader>
                                  {selectedTransaction && (
                                    <div className="grid grid-cols-2 gap-6">
                                      <div className="space-y-4">
                                        <div>
                                          <Label className="text-sm font-medium">Transaction Hash</Label>
                                          <p className="font-mono text-sm break-all">{selectedTransaction.txHash}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Type</Label>
                                          <div className="flex items-center gap-2">
                                            {getTransactionIcon(selectedTransaction.type)}
                                            <span className="capitalize">{selectedTransaction.type}</span>
                                          </div>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Contract</Label>
                                          <p className="font-mono text-sm">{selectedTransaction.strategyAddress}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">User</Label>
                                          <p className="font-mono text-sm">{selectedTransaction.userAddress}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Pool</Label>
                                          <p className="font-medium">{selectedTransaction.poolName}</p>
                                        </div>
                                      </div>
                                      <div className="space-y-4">
                                        <div>
                                          <Label className="text-sm font-medium">Status</Label>
                                          <div>{getStatusBadge(selectedTransaction.status)}</div>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Amount</Label>
                                          <p className="font-medium">{selectedTransaction.amountDeposit}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Token</Label>
                                          <p className="font-mono text-sm">{selectedTransaction.token}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Timestamp</Label>
                                          <p>{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="sm" asChild>
                                <a href={getExplorerUrl(tx.txHash)} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
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
        </TabsContent>

        {/* System Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Events</CardTitle>
              <CardDescription>Important system events and administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className="mt-1">{getEventIcon(event.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{event.title}</h4>
                        {getSeverityBadge(event.severity)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Admin: {event.admin === "System" ? "System" : `${event.admin.slice(0, 6)}...`}</span>
                        <span>{event.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-time Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <div className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  System Alerts
                </CardTitle>
                <CardDescription>Active alerts and warnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-red-200 bg-red-50/50">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div className="flex-1">
                      <p className="font-medium text-red-700">High Gas Prices Detected</p>
                      <p className="text-sm text-red-600">Current gas price: 45.2 gwei</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-yellow-200 bg-yellow-50/50">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-700">Pending Transactions</p>
                      <p className="text-sm text-yellow-600">3 transactions pending for &gt;10 minutes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50/50">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium text-green-700">System Healthy</p>
                      <p className="text-sm text-green-600">All contracts operating normally</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}