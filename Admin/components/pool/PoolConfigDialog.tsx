import { useState } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PoolData } from "@/lib/api/PoolAPI";
import { PoolContract } from "@/services/contracts/poolContract";
import { PoolAPI } from "@/services/apis/pools.api";
import { useWeb3 } from "@/components/web3-provider";

interface PoolConfigDialogProps {
    pool: PoolData | null;
    onSave: () => void;
}

export function PoolConfigDialog({ pool, onSave }: PoolConfigDialogProps) {
    const { toast } = useToast();
    const { isConnected, switchNetwork } = useWeb3();
    const [slippage, setSlippage] = useState(pool?.slippageWhenSwapAsset.toString() || "");
    const [minSwapAmount, setMinSwapAmount] = useState(pool?.minimumSwapAmount.toString() || "");
    const [isLoadingSlippage, setIsLoadingSlippage] = useState(false);
    const [isLoadingMinSwap, setIsLoadingMinSwap] = useState(false);
    const poolAPI = new PoolAPI();

    // Xử lý lưu slippage
    const handleSaveSlippage = async () => {
        if (!pool) return;
        if (!isConnected) {
            toast({ title: "Error", description: "Please connect your wallet.", variant: "destructive" });
            return;
        }

        if (!slippage || Number.parseFloat(slippage) === pool.slippageWhenSwapAsset) {
            toast({ title: "Info", description: "No changes to slippage.", variant: "default" });
            return;
        }

        if (Number.parseFloat(slippage) < 0 || Number.parseFloat(slippage) > 100) {
            toast({ title: "Error", description: "Slippage must be between 0 and 100%.", variant: "destructive" });
            return;
        }

        setIsLoadingSlippage(true);
        try {
            // Chuyển mạng sang Sepolia
            await switchNetwork(11155111);

            const poolContract = new PoolContract();
            await poolContract.getStrategyContract({ poolAddress: pool.strategyAddress, useSigner: true });

            // Gọi setSlippageWhenSwapAsset
            console.log("Calling setSlippageWhenSwapAsset with:", slippage);
            const tx = await poolContract.setSlippageWhenSwapAsset(Number.parseFloat(slippage));
            await tx.wait();
            console.log("Transaction hash:", tx.hash);

            // Cập nhật API
            await poolAPI.UpdatePool(pool._id, {
                ...pool,
                slippageWhenSwapAsset: Number.parseFloat(slippage),
            });

            toast({ title: "Success", description: `Slippage updated to ${slippage}% for ${pool.name}.` });
            onSave();
        } catch (error: any) {
            console.error("Failed to update slippage:", error);
            if (error.message.includes("Wrong network")) {
                toast({
                    title: "Wrong Network",
                    description: "Please switch to Sepolia Test Network in MetaMask.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: `Failed to update slippage: ${error.message}`,
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoadingSlippage(false);
        }
    };

    // Xử lý lưu minimumSwapAmount
    const handleSaveMinSwapAmount = async () => {
        if (!pool) return;
        if (!isConnected) {
            toast({ title: "Error", description: "Please connect your wallet.", variant: "destructive" });
            return;
        }

        if (!minSwapAmount || Number.parseFloat(minSwapAmount) === pool.minimumSwapAmount) {
            toast({ title: "Info", description: "No changes to minimum swap amount.", variant: "default" });
            return;
        }

        if (Number.parseFloat(minSwapAmount) <= 0) {
            toast({ title: "Error", description: "Minimum swap amount must be greater than 0.", variant: "destructive" });
            return;
        }

        setIsLoadingMinSwap(true);
        try {
            // Chuyển mạng sang Sepolia
            await switchNetwork(11155111);

            const poolContract = new PoolContract();
            await poolContract.getStrategyContract({ poolAddress: pool.strategyAddress, useSigner: true });

            // Gọi setMinimumSwapAmount
            console.log("Calling setMinimumSwapAmount with:", minSwapAmount);
            const tx = await poolContract.setMinimumSwapAmount(Number.parseFloat(minSwapAmount));
            await tx.wait();
            console.log("Transaction hash:", tx.hash);

            // Cập nhật API
            await poolAPI.UpdatePool(pool._id, {
                ...pool,
                minimumSwapAmount: Number.parseFloat(minSwapAmount),
            });

            toast({ title: "Success", description: `Minimum swap amount updated to ${minSwapAmount} for ${pool.name}.` });
            onSave();
        } catch (error: any) {
            console.error("Failed to update minimum swap amount:", error);
            if (error.message.includes("Wrong network")) {
                toast({
                    title: "Wrong Network",
                    description: "Please switch to Sepolia Test Network in MetaMask.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: `Failed to update minimum swap amount: ${error.message}`,
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoadingMinSwap(false);
        }
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Configure Pool: {pool?.name}</DialogTitle>
                <DialogDescription>Adjust settings for the {pool?.name} liquidity pool</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="slippage">Slippage (%)</Label>
                        <Input
                            id="slippage"
                            type="number"
                            placeholder="0.5"
                            step="0.1"
                            value={slippage}
                            onChange={(e) => setSlippage(e.target.value)}
                            disabled={isLoadingSlippage || isLoadingMinSwap}
                        />
                    </div>
                    <Button
                        onClick={handleSaveSlippage}
                        disabled={isLoadingSlippage || isLoadingMinSwap || !slippage}
                        className="w-32"
                    >
                        {isLoadingSlippage ? "Saving..." : "Save Slippage"}
                    </Button>
                </div>
                <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="minSwap">Minimum Swap Amount</Label>
                        <Input
                            id="minSwap"
                            type="number"
                            placeholder="100"
                            value={minSwapAmount}
                            onChange={(e) => setMinSwapAmount(e.target.value)}
                            disabled={isLoadingSlippage || isLoadingMinSwap}
                        />
                    </div>
                    <Button
                        onClick={handleSaveMinSwapAmount}
                        disabled={isLoadingSlippage || isLoadingMinSwap || !minSwapAmount}
                        className="w-32"
                    >
                        {isLoadingMinSwap ? "Saving..." : "Save Min Swap"}
                    </Button>
                </div>
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        onClick={onSave}
                        disabled={isLoadingSlippage || isLoadingMinSwap}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </DialogContent>
    );
}