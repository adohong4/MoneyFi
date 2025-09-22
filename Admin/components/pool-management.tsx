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
import { Progress } from "@/components/ui/progress"
import {
  Waves,
  Plus,
  Settings,
  Eye,
  Pause,
  Play,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Mock pool data
const mockPools = [
  {
    id: "1",
    name: "USDC-ETH",
    address: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
    token0: { symbol: "USDC", address: "0xa0b86a33e6776e681e06935e2f20cbf77c9d6e2e", decimals: 6 },
    token1: { symbol: "ETH", address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", decimals: 18 },
    tvl: 2450000,
    volume24h: 125000,
    fees24h: 375,
    apy: 12.5,
    utilization: 78,
    totalUsers: 1247,
    status: "active",
    strategy: "UniswapV3",
    slippage: 0.5,
    minSwapAmount: 100,
    maxDepositValue: 1000000,
    createdAt: "2024-01-15",
    lastRebalance: "2024-03-15 10:30:00",
  },
  {
    id: "2",
    name: "DAI-USDT",
    address: "0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c",
    token0: { symbol: "DAI", address: "0x6b175474e89094c44da98b954eedeac495271d0f", decimals: 18 },
    token1: { symbol: "USDT", address: "0xdac17f958d2ee523a2206206994597c13d831ec7", decimals: 6 },
    tvl: 1850000,
    volume24h: 89000,
    fees24h: 267,
    apy: 8.9,
    utilization: 65,
    totalUsers: 892,
    status: "active",
    strategy: "UniswapV2",
    slippage: 0.3,
    minSwapAmount: 50,
    maxDepositValue: 500000,
    createdAt: "2024-02-01",
    lastRebalance: "2024-03-15 08:15:00",
  },
  {
    id: "3",
    name: "WBTC-ETH",
    address: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d",
    token0: { symbol: "WBTC", address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", decimals: 8 },
    token1: { symbol: "ETH", address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", decimals: 18 },
    tvl: 3200000,
    volume24h: 180000,
    fees24h: 540,
    apy: 15.2,
    utilization: 85,
    totalUsers: 567,
    status: "active",
    strategy: "UniswapV3",
    slippage: 1.0,
    minSwapAmount: 1000,
    maxDepositValue: 2000000,
    createdAt: "2023-12-10",
    lastRebalance: "2024-03-15 12:45:00",
  },
  {
    id: "4",
    name: "USDC-USDT",
    address: "0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e",
    token0: { symbol: "USDC", address: "0xa0b86a33e6776e681e06935e2f20cbf77c9d6e2e", decimals: 6 },
    token1: { symbol: "USDT", address: "0xdac17f958d2ee523a2206206994597c13d831ec7", decimals: 6 },
    tvl: 950000,
    volume24h: 45000,
    fees24h: 135,
    apy: 5.8,
    utilization: 45,
    totalUsers: 324,
    status: "paused",
    strategy: "Curve",
    slippage: 0.1,
    minSwapAmount: 10,
    maxDepositValue: 100000,
    createdAt: "2024-03-01",
    lastRebalance: "2024-03-14 16:20:00",
  },
  {
    id: "5",
    name: "ETH-MATIC",
    address: "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f",
    token0: { symbol: "ETH", address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", decimals: 18 },
    token1: { symbol: "MATIC", address: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0", decimals: 18 },
    tvl: 1200000,
    volume24h: 67000,
    fees24h: 201,
    apy: 18.7,
    utilization: 92,
    totalUsers: 445,
    status: "warning",
    strategy: "UniswapV3",
    slippage: 2.0,
    minSwapAmount: 500,
    maxDepositValue: 750000,
    createdAt: "2024-01-20",
    lastRebalance: "2024-03-15 14:10:00",
  },
]

export function PoolManagement() {
  const { toast } = useToast()
  const [pools, setPools] = useState(mockPools)
  const [selectedPool, setSelectedPool] = useState<any>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [newPool, setNewPool] = useState({
    name: "",
    token0: "",
    token1: "",
    strategy: "",
    slippage: "",
    minSwapAmount: "",
    maxDepositValue: "",
  })

  const handleCreatePool = () => {
    if (!newPool.name || !newPool.token0 || !newPool.token1 || !newPool.strategy) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const pool = {
      id: String(pools.length + 1),
      name: newPool.name,
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      token0: {
        symbol: newPool.token0.split("-")[0],
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        decimals: 18,
      },
      token1: {
        symbol: newPool.token0.split("-")[1] || newPool.token1,
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        decimals: 18,
      },
      tvl: 0,
      volume24h: 0,
      fees24h: 0,
      apy: 0,
      utilization: 0,
      totalUsers: 0,
      status: "active",
      strategy: newPool.strategy,
      slippage: Number.parseFloat(newPool.slippage) || 0.5,
      minSwapAmount: Number.parseFloat(newPool.minSwapAmount) || 100,
      maxDepositValue: Number.parseFloat(newPool.maxDepositValue) || 1000000,
      createdAt: new Date().toISOString().split("T")[0],
      lastRebalance: "Never",
    }

    setPools([...pools, pool])
    setNewPool({ name: "", token0: "", token1: "", strategy: "", slippage: "", minSwapAmount: "", maxDepositValue: "" })
    setShowCreateDialog(false)

    toast({
      title: "Pool Created",
      description: `${newPool.name} pool has been created successfully.`,
    })
  }

  const handlePoolAction = (poolId: string, action: string) => {
    setPools(
      pools.map((pool) =>
        pool.id === poolId
          ? {
              ...pool,
              status: action === "pause" ? "paused" : action === "activate" ? "active" : pool.status,
            }
          : pool,
      ),
    )

    toast({
      title: "Pool Updated",
      description: `Pool has been ${action}d successfully.`,
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
      case "paused":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Paused</Badge>
      case "warning":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Warning</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return "text-red-500"
    if (utilization >= 70) return "text-yellow-500"
    return "text-green-500"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const totalTVL = pools.reduce((sum, pool) => sum + pool.tvl, 0)
  const totalVolume = pools.reduce((sum, pool) => sum + pool.volume24h, 0)
  const totalFees = pools.reduce((sum, pool) => sum + pool.fees24h, 0)
  const avgAPY = pools.reduce((sum, pool) => sum + pool.apy, 0) / pools.length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Pool Management</h1>
          <p className="text-muted-foreground">Manage liquidity pools and monitor performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Waves className="h-3 w-3" />
            {pools.length} Active Pools
          </Badge>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Pool
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Pool</DialogTitle>
                <DialogDescription>Add a new liquidity pool to the protocol</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="poolName">Pool Name *</Label>
                  <Input
                    id="poolName"
                    placeholder="e.g., USDC-ETH"
                    value={newPool.name}
                    onChange={(e) => setNewPool({ ...newPool, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="token0">Token 0 *</Label>
                    <Input
                      id="token0"
                      placeholder="e.g., USDC"
                      value={newPool.token0}
                      onChange={(e) => setNewPool({ ...newPool, token0: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="token1">Token 1 *</Label>
                    <Input
                      id="token1"
                      placeholder="e.g., ETH"
                      value={newPool.token1}
                      onChange={(e) => setNewPool({ ...newPool, token1: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="strategy">Strategy *</Label>
                  <Select
                    value={newPool.strategy}
                    onValueChange={(value) => setNewPool({ ...newPool, strategy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UniswapV3">Uniswap V3</SelectItem>
                      <SelectItem value="UniswapV2">Uniswap V2</SelectItem>
                      <SelectItem value="Curve">Curve</SelectItem>
                      <SelectItem value="Balancer">Balancer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slippage">Slippage (%)</Label>
                    <Input
                      id="slippage"
                      type="number"
                      placeholder="0.5"
                      step="0.1"
                      value={newPool.slippage}
                      onChange={(e) => setNewPool({ ...newPool, slippage: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minSwap">Min Swap ($)</Label>
                    <Input
                      id="minSwap"
                      type="number"
                      placeholder="100"
                      value={newPool.minSwapAmount}
                      onChange={(e) => setNewPool({ ...newPool, minSwapAmount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDeposit">Max Deposit ($)</Label>
                    <Input
                      id="maxDeposit"
                      type="number"
                      placeholder="1000000"
                      value={newPool.maxDepositValue}
                      onChange={(e) => setNewPool({ ...newPool, maxDepositValue: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePool}>Create Pool</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total TVL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalTVL)}</div>
            <div className="text-xs text-green-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +8.2% from yesterday
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">24h Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalVolume)}</div>
            <div className="text-xs text-green-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12.5% from yesterday
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">24h Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalFees)}</div>
            <div className="text-xs text-red-500 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              -3.1% from yesterday
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average APY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAPY.toFixed(1)}%</div>
            <div className="text-xs text-green-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +1.2% from yesterday
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Pool Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Pool Settings</TabsTrigger>
        </TabsList>

        {/* Pool Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pool Directory</CardTitle>
              <CardDescription>Overview of all liquidity pools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pool</TableHead>
                      <TableHead>TVL</TableHead>
                      <TableHead>24h Volume</TableHead>
                      <TableHead>24h Fees</TableHead>
                      <TableHead>APY</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pools.map((pool) => (
                      <TableRow key={pool.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1">
                              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                                {pool.token0.symbol[0]}
                              </div>
                              <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                {pool.token1.symbol[0]}
                              </div>
                            </div>
                            <div>
                              <p className="font-medium">{pool.name}</p>
                              <p className="text-xs text-muted-foreground">{pool.strategy}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(pool.tvl)}</TableCell>
                        <TableCell>{formatCurrency(pool.volume24h)}</TableCell>
                        <TableCell>{formatCurrency(pool.fees24h)}</TableCell>
                        <TableCell className="font-medium">{pool.apy.toFixed(1)}%</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={pool.utilization} className="w-16" />
                            <span className={`text-sm font-medium ${getUtilizationColor(pool.utilization)}`}>
                              {pool.utilization}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{pool.totalUsers.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(pool.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedPool(pool)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>Pool Details - {selectedPool?.name}</DialogTitle>
                                  <DialogDescription>Detailed information and metrics for this pool</DialogDescription>
                                </DialogHeader>
                                {selectedPool && (
                                  <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="text-sm font-medium">Pool Address</Label>
                                        <p className="font-mono text-sm">{selectedPool.address}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Token Pair</Label>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline">{selectedPool.token0.symbol}</Badge>
                                          <span>/</span>
                                          <Badge variant="outline">{selectedPool.token1.symbol}</Badge>
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Strategy</Label>
                                        <p className="font-medium">{selectedPool.strategy}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Total Value Locked</Label>
                                        <p className="text-2xl font-bold">{formatCurrency(selectedPool.tvl)}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">24h Volume</Label>
                                        <p className="text-xl font-semibold">
                                          {formatCurrency(selectedPool.volume24h)}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">24h Fees</Label>
                                        <p className="text-xl font-semibold">{formatCurrency(selectedPool.fees24h)}</p>
                                      </div>
                                    </div>
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="text-sm font-medium">APY</Label>
                                        <p className="text-2xl font-bold text-green-500">
                                          {selectedPool.apy.toFixed(1)}%
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Utilization</Label>
                                        <div className="flex items-center gap-2">
                                          <Progress value={selectedPool.utilization} className="flex-1" />
                                          <span
                                            className={`font-medium ${getUtilizationColor(selectedPool.utilization)}`}
                                          >
                                            {selectedPool.utilization}%
                                          </span>
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Total Users</Label>
                                        <p className="text-xl font-semibold">
                                          {selectedPool.totalUsers.toLocaleString()}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Status</Label>
                                        <div>{getStatusBadge(selectedPool.status)}</div>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Created</Label>
                                        <p>{selectedPool.createdAt}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Last Rebalance</Label>
                                        <p>{selectedPool.lastRebalance}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPool(pool)
                                    setShowConfigDialog(true)
                                  }}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Pool Configuration - {selectedPool?.name}</DialogTitle>
                                  <DialogDescription>Adjust pool parameters and settings</DialogDescription>
                                </DialogHeader>
                                {selectedPool && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="configSlippage">Slippage Tolerance (%)</Label>
                                      <Input
                                        id="configSlippage"
                                        type="number"
                                        defaultValue={selectedPool.slippage}
                                        step="0.1"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="configMinSwap">Minimum Swap Amount ($)</Label>
                                      <Input
                                        id="configMinSwap"
                                        type="number"
                                        defaultValue={selectedPool.minSwapAmount}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="configMaxDeposit">Maximum Deposit Value ($)</Label>
                                      <Input
                                        id="configMaxDeposit"
                                        type="number"
                                        defaultValue={selectedPool.maxDepositValue}
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          setShowConfigDialog(false)
                                          toast({
                                            title: "Pool Updated",
                                            description: "Pool configuration has been updated successfully.",
                                          })
                                        }}
                                      >
                                        Save Changes
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            {pool.status === "active" ? (
                              <Button variant="ghost" size="sm" onClick={() => handlePoolAction(pool.id, "pause")}>
                                <Pause className="h-4 w-4 text-yellow-500" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => handlePoolAction(pool.id, "activate")}>
                                <Play className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Pools</CardTitle>
                <CardDescription>Pools ranked by APY</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pools
                    .sort((a, b) => b.apy - a.apy)
                    .slice(0, 5)
                    .map((pool, index) => (
                      <div key={pool.id} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{pool.name}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(pool.tvl)} TVL</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-500">{pool.apy.toFixed(1)}%</p>
                          <p className="text-sm text-muted-foreground">APY</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pool Health Status</CardTitle>
                <CardDescription>Current status of all pools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Healthy Pools</span>
                    </div>
                    <span className="font-bold">{pools.filter((p) => p.status === "active").length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-yellow-200 bg-yellow-50/50">
                    <div className="flex items-center gap-2">
                      <Pause className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">Paused Pools</span>
                    </div>
                    <span className="font-bold">{pools.filter((p) => p.status === "paused").length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50/50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Warning Pools</span>
                    </div>
                    <span className="font-bold">{pools.filter((p) => p.status === "warning").length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Pool Settings</CardTitle>
              <CardDescription>Configure global parameters for all pools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="globalSlippage">Default Slippage Tolerance (%)</Label>
                  <Input id="globalSlippage" type="number" defaultValue="0.5" step="0.1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="globalMinSwap">Default Minimum Swap ($)</Label>
                  <Input id="globalMinSwap" type="number" defaultValue="100" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rebalanceThreshold">Rebalance Threshold (%)</Label>
                  <Input id="rebalanceThreshold" type="number" defaultValue="5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUtilization">Maximum Utilization (%)</Label>
                  <Input id="maxUtilization" type="number" defaultValue="95" />
                </div>
              </div>
              <Button className="w-full">Save Global Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
