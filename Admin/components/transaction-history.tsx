"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Pagination } from "@/components/pagination" // Added pagination import

// Mock transaction data - expanded for pagination demo
const generateMockTransactions = () => {
  const types = ["deposit", "withdraw", "swap", "rebalance", "crosschain"]
  const statuses = ["completed", "pending", "failed"]
  const functions = [
    "depositFund",
    "withdrawFundSameChain",
    "swapToken",
    "rebalanceFundSameChain",
    "depositFundToStrategyCrossChainFromOperator",
    "withdrawFundCrossChain",
  ]
  const contracts = ["MoneyFiRouter", "MoneyFiUniSwap", "MoneyFiCrossChainRouter"]
  const pools = ["USDC-ETH", "DAI-USDT", "WBTC-ETH", "USDT-USDC", "ETH-WBTC", "Cross-Chain Bridge"]

  const transactions = []
  for (let i = 1; i <= 500; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const status = Math.random() > 0.85 ? (Math.random() > 0.5 ? "pending" : "failed") : "completed"

    transactions.push({
      id: i.toString(),
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      type,
      function: functions[Math.floor(Math.random() * functions.length)],
      contract: contracts[Math.floor(Math.random() * contracts.length)],
      user: Math.random() > 0.1 ? `0x${Math.random().toString(16).substr(2, 40)}` : "System",
      amount: `${(Math.random() * 50000).toFixed(2)} ${["USDC", "DAI", "ETH", "USDT", "WBTC"][Math.floor(Math.random() * 5)]}`,
      pool: pools[Math.floor(Math.random() * pools.length)],
      status,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .replace("T", " ")
        .substr(0, 19),
      blockNumber: 19425000 + Math.floor(Math.random() * 1000),
      gasUsed: `${Math.floor(Math.random() * 300000 + 21000).toLocaleString()}`,
      gasPrice: `${(Math.random() * 50 + 10).toFixed(1)} gwei`,
      gasFee: `${(Math.random() * 0.02).toFixed(5)} ETH`,
      logs: ["Transfer", "Deposit", "Withdraw", "Swap", "PoolUpdate", "FeeCollection"].slice(
        0,
        Math.floor(Math.random() * 4) + 1,
      ),
      error:
        status === "failed"
          ? ["Insufficient liquidity", "Gas limit exceeded", "Slippage too high", "Contract paused"][
              Math.floor(Math.random() * 4)
            ]
          : null,
    })
  }
  return transactions
}

const mockTransactions = generateMockTransactions()

// Mock system events
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
  const [transactions, setTransactions] = useState(mockTransactions)
  const [systemEvents, setSystemEvents] = useState([
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
  ])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.function.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter
    const matchesType = typeFilter === "all" || tx.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const totalPages = Math.ceil(filteredTransactions.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize)

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />
      case "withdraw":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case "swap":
        return <RefreshCw className="h-4 w-4 text-blue-500" />
      case "rebalance":
        return <TrendingUp className="h-4 w-4 text-purple-500" />
      case "crosschain":
        return <Activity className="h-4 w-4 text-orange-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
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
            {transactions.length} Total Transactions
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
            <div className="text-2xl font-bold">{transactions.length}</div>
            <div className="text-xs text-green-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12% from yesterday
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.filter((tx) => tx.status === "completed").length}</div>
            <div className="text-xs text-muted-foreground">
              {((transactions.filter((tx) => tx.status === "completed").length / transactions.length) * 100).toFixed(1)}
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
            <div className="text-2xl font-bold">
              {transactions
                .slice(0, 100)
                .reduce((sum, tx) => sum + Number.parseFloat(tx.gasFee.split(" ")[0]), 0)
                .toFixed(4)}
            </div>
            <div className="text-xs text-muted-foreground">Total gas fees (sample)</div>
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
                      placeholder="Search by hash, user, or function..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setCurrentPage(1) // Reset to first page when searching
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value)
                    setCurrentPage(1) // Reset to first page when filtering
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
                    setCurrentPage(1) // Reset to first page when filtering
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdraw">Withdraw</SelectItem>
                    <SelectItem value="swap">Swap</SelectItem>
                    <SelectItem value="rebalance">Rebalance</SelectItem>
                    <SelectItem value="crosschain">Cross Chain</SelectItem>
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
                      <TableHead>Function</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(tx.type)}
                            <span className="capitalize">{tx.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                        </TableCell>
                        <TableCell className="font-medium">{tx.function}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {tx.user === "System" ? "System" : `${tx.user.slice(0, 6)}...${tx.user.slice(-4)}`}
                        </TableCell>
                        <TableCell className="font-medium">{tx.amount}</TableCell>
                        <TableCell>{getStatusBadge(tx.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{tx.timestamp}</TableCell>
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
                                  <DialogDescription>Complete information for transaction {tx.hash}</DialogDescription>
                                </DialogHeader>
                                {selectedTransaction && (
                                  <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="text-sm font-medium">Transaction Hash</Label>
                                        <p className="font-mono text-sm break-all">{selectedTransaction.hash}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Type & Function</Label>
                                        <div className="flex items-center gap-2">
                                          {getTransactionIcon(selectedTransaction.type)}
                                          <span className="capitalize">{selectedTransaction.type}</span>
                                          <Badge variant="outline">{selectedTransaction.function}</Badge>
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Contract</Label>
                                        <p className="font-medium">{selectedTransaction.contract}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">User</Label>
                                        <p className="font-mono text-sm">{selectedTransaction.user}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Amount</Label>
                                        <p className="font-medium">{selectedTransaction.amount}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Pool</Label>
                                        <p className="font-medium">{selectedTransaction.pool}</p>
                                      </div>
                                    </div>
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="text-sm font-medium">Status</Label>
                                        <div>{getStatusBadge(selectedTransaction.status)}</div>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Block Number</Label>
                                        <p className="font-mono">{selectedTransaction.blockNumber}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Gas Used</Label>
                                        <p className="font-mono">{selectedTransaction.gasUsed}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Gas Price</Label>
                                        <p className="font-mono">{selectedTransaction.gasPrice}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Gas Fee</Label>
                                        <p className="font-mono">{selectedTransaction.gasFee}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Timestamp</Label>
                                        <p>{selectedTransaction.timestamp}</p>
                                      </div>
                                      {selectedTransaction.error && (
                                        <div>
                                          <Label className="text-sm font-medium">Error</Label>
                                          <p className="text-red-500">{selectedTransaction.error}</p>
                                        </div>
                                      )}
                                      <div>
                                        <Label className="text-sm font-medium">Event Logs</Label>
                                        <div className="flex flex-wrap gap-1">
                                          {selectedTransaction.logs.map((log: string, index: number) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                              {log}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={filteredTransactions.length}
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
                    <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      {getTransactionIcon(tx.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">{tx.type}</span>
                          {getStatusBadge(tx.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{tx.amount}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">{tx.timestamp.split(" ")[1]}</div>
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
