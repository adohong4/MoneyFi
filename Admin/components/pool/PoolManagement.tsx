"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Waves, Plus, TrendingUp, CheckCircle, Pause, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PoolAPI, PoolData } from "@/services/apis/pools.api";
import { PoolContract } from "@/services/contracts/poolContract";
import { StatsCards } from "./StatsCards"; // Import StatsCards
import { PoolTable } from "./PoolTable";
import { ethers } from "ethers";

export function PoolManagement() {
    const { toast } = useToast();
    const [pools, setPools] = useState<PoolData[]>([]);
    const [tvlData, setTvlData] = useState<{ [key: string]: number }>({});
    const [newPool, setNewPool] = useState({
        name: "",
        token0: "",
        token1: "",
        pairAddress: "",
        strategy: "",
        slippage: "",
        minSwapAmount: "",
    });
    const poolAPI = new PoolAPI();

    // Hàm format tiền tệ
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Lấy danh sách pool và TVL từ API
    useEffect(() => {
        const fetchPoolsAndTVLs = async () => {
            try {
                // Lấy danh sách pool
                const data = await poolAPI.GetPool();
                setPools(data);

                // Fetch TVL cho từng pool
                const tvls: { [key: string]: number } = {};
                const poolContract = new PoolContract();
                for (const pool of data) {
                    try {
                        if (!pool.strategyAddress || !ethers.isAddress(pool.strategyAddress)) {
                            console.error(`Invalid strategyAddress for pool ${pool.name}: ${pool.strategyAddress}`);
                            tvls[pool._id] = 0;
                            continue;
                        }
                        console.log(`Fetching TVL for pool ${pool.name} with strategyAddress: ${pool.strategyAddress}`);
                        await poolContract.getStrategyContract({ poolAddress: pool.strategyAddress });
                        const tvl = await poolContract.getTVLPool();
                        console.log(`TVL for ${pool.name}: ${tvl}`);
                        tvls[pool._id] = tvl;
                    } catch (error: any) {
                        console.error(`Failed to fetch TVL for pool ${pool.name}:`, error);
                        tvls[pool._id] = 0;
                        if (error.message.includes("Wrong network")) {
                            toast({
                                title: "Wrong Network",
                                description: "Please switch to Sepolia Test Network in MetaMask.",
                                variant: "destructive",
                            });
                        } else {
                            toast({
                                title: "Error",
                                description: `Failed to fetch TVL for ${pool.name}`,
                                variant: "destructive",
                            });
                        }
                    }
                }
                console.log("Final tvlData:", tvls);
                setTvlData(tvls);
            } catch (error) {
                toast({ title: "Error", description: "Failed to fetch pools.", variant: "destructive" });
            }
        };
        fetchPoolsAndTVLs();
    }, [toast]);

    // Xử lý tạo pool mới
    const handleCreatePool = async () => {
        if (!newPool.name || !newPool.token0 || !newPool.token1 || !newPool.pairAddress || !newPool.strategy) {
            toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
            return;
        }

        try {
            const poolInput: PoolData = {
                _id: "",
                name: newPool.name,
                strategyAddress: `0x${Math.random().toString(16).substr(2, 40)}`, // Placeholder - cần sửa
                baseToken: newPool.token0,
                quoteToken: newPool.token1,
                pairAddress: newPool.pairAddress,
                chainId: 11155111,
                slippageWhenSwapAsset: Number.parseFloat(newPool.slippage) || 0.5,
                minimumSwapAmount: Number.parseFloat(newPool.minSwapAmount) || 100,
                status: "active",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                feeWhenSwapAsset: 0,
            };

            const response = await poolAPI.AddPool(poolInput);
            setPools([...pools, response.metadata[0]]);
            setNewPool({ name: "", token0: "", token1: "", pairAddress: "", strategy: "", slippage: "", minSwapAmount: "" });
            toast({ title: "Pool Created", description: `${newPool.name} pool has been created successfully.` });
        } catch (error) {
            toast({ title: "Error", description: "Failed to create pool.", variant: "destructive" });
        }
    };

    // Xử lý action pause/activate
    const handlePoolAction = async (poolId: string, action: string) => {
        try {
            await poolAPI.PoolStatus(poolId, action);
            setPools(pools.map((pool) => (pool._id === poolId ? { ...pool, status: action } : pool)));
            toast({ title: "Pool Updated", description: `Pool has been ${action}d successfully.` });
        } catch (error) {
            toast({ title: "Error", description: `Failed to ${action} pool.`, variant: "destructive" });
        }
    };

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
                    <Dialog>
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
                                            placeholder="e.g., USDC address"
                                            value={newPool.token0}
                                            onChange={(e) => setNewPool({ ...newPool, token0: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="token1">Token 1 *</Label>
                                        <Input
                                            id="token1"
                                            placeholder="e.g., ETH address"
                                            value={newPool.token1}
                                            onChange={(e) => setNewPool({ ...newPool, token1: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pairAddress">Pair Address *</Label>
                                    <Input
                                        id="pairAddress"
                                        placeholder="e.g., Uniswap pair address"
                                        value={newPool.pairAddress}
                                        onChange={(e) => setNewPool({ ...newPool, pairAddress: e.target.value })}
                                    />
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
                                            <SelectItem value="UniswapV2">Uniswap V2</SelectItem>
                                            <SelectItem value="UniswapV3">Uniswap V3</SelectItem>
                                            <SelectItem value="Curve">Curve</SelectItem>
                                            <SelectItem value="Balancer">Balancer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
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
                                        <Label htmlFor="minSwap">Min Swap</Label>
                                        <Input
                                            id="minSwap"
                                            type="number"
                                            placeholder="100"
                                            value={newPool.minSwapAmount}
                                            onChange={(e) => setNewPool({ ...newPool, minSwapAmount: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setNewPool({ name: "", token0: "", token1: "", pairAddress: "", strategy: "", slippage: "", minSwapAmount: "" })}>
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
            <StatsCards pools={pools} tvlData={tvlData} formatCurrency={formatCurrency} />

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Pool Overview</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="settings">Pool Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pool Directory</CardTitle>
                            <CardDescription>Overview of all liquidity pools</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PoolTable
                                pools={pools}
                                onPoolAction={handlePoolAction}
                                tvlData={tvlData}
                                formatCurrency={formatCurrency}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                    <Label htmlFor="globalMinSwap">Default Minimum Swap</Label>
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
    );
}