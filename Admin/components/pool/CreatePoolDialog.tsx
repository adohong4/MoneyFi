"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PoolData, PoolAPI } from "@/services/apis/pools.api";
import { useToast } from "@/hooks/use-toast";

interface CreatePoolDialogProps {
    setNewPool: (pool: { name: string; strategyAddress: string; tokenBase: string; tokenQuote: string; pairAddress: string; chainId: string; slippage: string; minSwapAmount: string }) => void;
    newPool: { name: string; strategyAddress: string; tokenBase: string; tokenQuote: string; pairAddress: string; chainId: string; slippage: string; minSwapAmount: string };
    handleCreatePool: () => Promise<void>;
}

export function CreatePoolDialog({ setNewPool, newPool, handleCreatePool }: CreatePoolDialogProps) {
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create New Pool</DialogTitle>
                <DialogDescription>Add a new liquidity pool to the protocol</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="poolName">Pool Name *</Label>
                        <Input
                            id="poolName"
                            placeholder="e.g., USDC-ETH"
                            value={newPool.name}
                            onChange={(e) => setNewPool({ ...newPool, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="chainId">Chain ID *</Label>
                        <Input
                            id="chainId"
                            type="number"
                            placeholder="e.g., 11155111"
                            value={newPool.chainId}
                            onChange={(e) => setNewPool({ ...newPool, chainId: e.target.value })}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="strategyAddress">Strategy Address *</Label>
                    <Input
                        id="strategyAddress"
                        placeholder="e.g., USDC address"
                        value={newPool.strategyAddress}
                        onChange={(e) => setNewPool({ ...newPool, strategyAddress: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tokenBase">Token Base *</Label>
                    <Input
                        id="tokenBase"
                        placeholder="e.g., USDC address"
                        value={newPool.tokenBase}
                        onChange={(e) => setNewPool({ ...newPool, tokenBase: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tokenQuote">Token Quote *</Label>
                    <Input
                        id="tokenQuote"
                        placeholder="e.g., ETH address"
                        value={newPool.tokenQuote}
                        onChange={(e) => setNewPool({ ...newPool, tokenQuote: e.target.value })}
                    />
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
                    <Button
                        variant="outline"
                        onClick={() =>
                            setNewPool({
                                name: "",
                                strategyAddress: "",
                                tokenBase: "",
                                tokenQuote: "",
                                pairAddress: "",
                                chainId: "",
                                slippage: "",
                                minSwapAmount: "",
                            })
                        }
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleCreatePool}>Create Pool</Button>
                </div>
            </div>
        </DialogContent>
    );
}