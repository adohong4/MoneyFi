import { useState } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PoolData } from "@/lib/api/PoolAPI";
import { PoolContract } from "@/services/contracts/poolContract";
import { PoolAPI } from "@/services/apis/pools.api";

interface PoolConfigDialogProps {
    pool: PoolData | null;
    onSave: () => void;
}

export function PoolConfigDialog({ pool, onSave }: PoolConfigDialogProps) {
    const [slippage, setSlippage] = useState(pool?.slippageWhenSwapAsset.toString() || "0.5");
    const [minSwap, setMinSwap] = useState(pool?.minimumSwapAmount.toString() || "100");
    const poolContract = new PoolContract();
    const poolAPI = new PoolAPI();

    const handleSetSlippage = async () => {
        if (!pool) return;
        try {
            await poolContract.getStrategyContract({ poolAddress: pool.strategyAddress });
            const tx = await poolContract.setSlippageWhenSwapAsset(Number.parseFloat(slippage));
            await tx.wait();
            await poolAPI.UpdatePool(pool._id, { slippageWhenSwapAsset: Number.parseFloat(slippage) });
            onSave();
        } catch (error) {
            console.error("Failed to set slippage:", error);
        }
    };

    const handleSetMinSwap = async () => {
        if (!pool) return;
        try {
            await poolContract.getStrategyContract({ poolAddress: pool.strategyAddress });
            const tx = await poolContract.setMinimumSwapAmount(Number.parseFloat(minSwap));
            await tx.wait();
            await poolAPI.UpdatePool(pool._id, { minimumSwapAmount: Number.parseFloat(minSwap) });
            onSave();
        } catch (error) {
            console.error("Failed to set minimum swap amount:", error);
        }
    };

    if (!pool) return null;

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Pool Configuration - {pool.name}</DialogTitle>
                <DialogDescription>Adjust pool parameters and settings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="configSlippage">Slippage Tolerance (%)</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            id="configSlippage"
                            type="number"
                            value={slippage}
                            step="0.1"
                            onChange={(e) => setSlippage(e.target.value)}
                        />
                        <Button onClick={handleSetSlippage}>Set Slippage</Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="configMinSwap">Minimum Swap Amount</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            id="configMinSwap"
                            type="number"
                            value={minSwap}
                            onChange={(e) => setMinSwap(e.target.value)}
                        />
                        <Button onClick={handleSetMinSwap}>Set Min Swap</Button>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button variant="outline" onClick={() => onSave()}>Close</Button>
                </div>
            </div>
        </DialogContent>
    );
}