import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PoolData } from "@/lib/api/PoolAPI";

interface PoolDetailsDialogProps {
    pool: PoolData | null;
    tvl?: number; // Thêm prop tvl
    formatCurrency: (amount: number) => string;
    getStatusBadge: (status: string) => JSX.Element;
}

export function PoolDetailsDialog({ pool, tvl, formatCurrency, getStatusBadge }: PoolDetailsDialogProps) {
    if (!pool) return null;

    return (
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Pool Details - {pool.name}</DialogTitle>
                <DialogDescription>Detailed information and metrics for this pool</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium">Pool ID</Label>
                        <p className="font-mono text-sm">{pool._id}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Pool Name</Label>
                        <p className="font-medium">{pool.name}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Strategy Address</Label>
                        <p className="font-mono text-sm">{pool.strategyAddress}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Base Token</Label>
                        <p className="font-mono text-sm">{pool.baseToken}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Quote Token</Label>
                        <p className="font-mono text-sm">{pool.quoteToken}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Pair Address</Label>
                        <p className="font-mono text-sm">{pool.pairAddress}</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium">Chain ID</Label>
                        <p>{pool.chainId}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Slippage Tolerance (%)</Label>
                        <p>{pool.slippageWhenSwapAsset.toFixed(2)}%</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Minimum Swap Amount</Label>
                        <p>{pool.minimumSwapAmount}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Total Value Locked</Label>
                        <p className="text-2xl font-bold">{tvl !== undefined ? formatCurrency(tvl) : "Loading..."}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div>{getStatusBadge(pool.status)}</div>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Created At</Label>
                        <p>{new Date(pool.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Updated At</Label>
                        <p>{new Date(pool.updatedAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        </DialogContent>
    );
}