import { Dispatch, SetStateAction } from "react"; // Thêm import này
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Pause, Play, Settings } from "lucide-react";
import { PoolData } from "@/lib/api/PoolAPI"; // Sử dụng import từ lib/api/PoolAPI
import { PoolDetailsDialog } from "./PoolDetailsDialog";
import { PoolConfigDialog } from "./PoolConfigDialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ControllerContract } from "@/services/contracts/controllerContract";
import { PoolAPI } from "@/services/apis/pools.api";

interface PoolTableProps {
    pools: PoolData[];
    setPools: Dispatch<SetStateAction<PoolData[]>>; // Sửa kiểu của setPools
    tvlData: { [key: string]: number };
    formatCurrency: (amount: number) => string;
}

export function PoolTable({ pools, setPools, tvlData, formatCurrency }: PoolTableProps) {
    const { toast } = useToast();
    const [selectedPool, setSelectedPool] = useState<PoolData | null>(null);
    const [showConfigDialog, setShowConfigDialog] = useState(false);
    const poolAPI = new PoolAPI();
    const controllerContract = new ControllerContract();

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
            case "paused":
                return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Paused</Badge>;
            case "warning":
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Warning</Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    const handlePoolAction = async (poolId: string, action: string) => {
        try {
            const pool = pools.find((p) => p._id === poolId);
            if (!pool) {
                toast({ title: "Error", description: "Pool not found.", variant: "destructive" });
                return;
            }

            // Cập nhật Strategy thông qua ControllerContract
            const strategy = {
                name: pool.name,
                chainId: pool.chainId,
                isActive: action === "active",
            };
            const tx = await controllerContract.setStrategyInternal(pool.strategyAddress, strategy);
            await tx.wait(); // Chờ transaction thành công

            // Gọi API để cập nhật trạng thái pool
            await poolAPI.PoolStatus(poolId, action);

            // Cập nhật state pools
            setPools(pools.map((p) => (p._id === poolId ? { ...p, status: action } : p)));
            toast({ title: "Pool Updated", description: `Pool has been ${action}d successfully.` });
        } catch (error: any) {
            console.error("Failed to update pool status:", error);
            toast({
                title: "Error",
                description: `Failed to ${action} pool: ${error.message}`,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Pool</TableHead>
                        <TableHead>Strategy Address</TableHead>
                        <TableHead>Chain ID</TableHead>
                        <TableHead>Slippage (%)</TableHead>
                        <TableHead>Min Swap</TableHead>
                        <TableHead>TVL</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated At</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pools.map((pool) => (
                        <TableRow key={pool._id}>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-1">
                                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                                            {pool.name.split("/")[0][0]}
                                        </div>
                                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                            {pool.name.split("/")[1][0]}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-medium">{pool.name}</p>
                                        <p className="text-xs text-muted-foreground">UniswapV2</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                                {pool.strategyAddress.slice(0, 10)}...{pool.strategyAddress.slice(-8)}
                            </TableCell>
                            <TableCell>{pool.chainId}</TableCell>
                            <TableCell>{pool.slippageWhenSwapAsset.toFixed(2)}%</TableCell>
                            <TableCell>{pool.minimumSwapAmount}</TableCell>
                            <TableCell className="font-medium">
                                {tvlData[pool._id] !== undefined ? formatCurrency(tvlData[pool._id]) : "Loading..."}
                            </TableCell>
                            <TableCell>{getStatusBadge(pool.status)}</TableCell>
                            <TableCell>{new Date(pool.updatedAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedPool(pool)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <PoolDetailsDialog
                                            pool={selectedPool}
                                            tvl={selectedPool ? tvlData[selectedPool._id] : undefined}
                                            formatCurrency={formatCurrency}
                                            getStatusBadge={getStatusBadge}
                                        />
                                    </Dialog>
                                    <Dialog open={showConfigDialog && selectedPool?._id === pool._id} onOpenChange={setShowConfigDialog}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm" onClick={() => { setSelectedPool(pool); setShowConfigDialog(true); }}>
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <PoolConfigDialog pool={selectedPool} onSave={() => {
                                            setShowConfigDialog(false);
                                            toast({ title: "Pool Updated", description: "Pool configuration has been updated successfully." });
                                        }} />
                                    </Dialog>
                                    {pool.status === "active" ? (
                                        <Button variant="ghost" size="sm" onClick={() => handlePoolAction(pool._id, "paused")}>
                                            <Pause className="h-4 w-4 text-yellow-500" />
                                        </Button>
                                    ) : (
                                        <Button variant="ghost" size="sm" onClick={() => handlePoolAction(pool._id, "active")}>
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
    );
}