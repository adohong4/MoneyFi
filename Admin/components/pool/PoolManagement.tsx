"use client";

import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { ethers } from "ethers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Waves, Plus, CheckCircle, Pause, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PoolData } from "@/lib/api/PoolAPI";
import { PoolAPI } from "@/services/apis/pools.api";
import { PoolTable } from "./PoolTable";
import { CreatePoolDialog } from "./CreatePoolDialog";
import { PoolContract } from "@/services/contracts/poolContract";
import { StatsCards } from "./StatsCards";

export function PoolManagement() {
    const { toast } = useToast();
    const [pools, setPools] = useState<PoolData[]>([]);
    const [tvlData, setTvlData] = useState<{ [key: string]: number }>({});
    const [newPool, setNewPool] = useState({
        name: "",
        tokenBase: "",
        tokenQuote: "",
        pairAddress: "",
        chainId: "",
        slippage: "",
        minSwapAmount: "",
        strategyAddress: "",
    });
    const poolAPI = new PoolAPI();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    useEffect(() => {
        const fetchPoolsAndTVLs = async () => {
            try {
                const data = await poolAPI.GetPool();
                setPools(data);

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

    const handleCreatePool = async () => {
        if (!newPool.name || !newPool.tokenBase || !newPool.tokenQuote || !newPool.pairAddress || !newPool.chainId) {
            toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
            return;
        }

        try {
            const poolInput: PoolData = {
                _id: "",
                name: newPool.name,
                strategyAddress: newPool.strategyAddress,
                baseToken: newPool.tokenBase,
                quoteToken: newPool.tokenQuote,
                pairAddress: newPool.pairAddress,
                chainId: Number.parseInt(newPool.chainId) || 11155111,
                slippageWhenSwapAsset: Number.parseFloat(newPool.slippage) || 0.5,
                minimumSwapAmount: Number.parseFloat(newPool.minSwapAmount) || 100,
                status: "active",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                feeWhenSwapAsset: 0,
            };

            const response = await poolAPI.AddPool(poolInput);
            const newPoolData = response.metadata;
            console.log("New pool data from API:", newPoolData); // Debug response

            setPools([...pools]);
            setNewPool({
                name: "",
                strategyAddress: "",
                tokenBase: "",
                tokenQuote: "",
                pairAddress: "",
                chainId: "",
                slippage: "",
                minSwapAmount: "",
            });
            toast({ title: "Pool Created", description: `${newPool.name} pool has been created successfully.` });
        } catch (error) {
            console.error("Failed to create pool:", error);
            toast({ title: "Error", description: "Failed to create pool.", variant: "destructive" });
        }
    };

    return (
        <div className="p-6 space-y-6">
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
                        <CreatePoolDialog
                            setNewPool={setNewPool}
                            newPool={newPool}
                            handleCreatePool={handleCreatePool}
                        />
                    </Dialog>
                </div>
            </div>

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
                                setPools={setPools}
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