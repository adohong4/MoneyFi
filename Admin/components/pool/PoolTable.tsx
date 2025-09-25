import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Pause, Play, Settings } from "lucide-react";
import { PoolData } from "@/lib/api/PoolAPI";
import { PoolDetailsDialog } from "./PoolDetailsDialog";
import { PoolConfigDialog } from "./PoolConfigDialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface PoolTableProps {
    pools: PoolData[];
    tvlData: { [key: string]: number }; // Thêm prop tvlData
    onPoolAction: (poolId: string, action: string) => void;
    formatCurrency: (amount: number) => string; // Thêm prop formatCurrency
}

export function PoolTable({ pools, tvlData, onPoolAction, formatCurrency }: PoolTableProps) {
    const { toast } = useToast();
    const [selectedPool, setSelectedPool] = useState<PoolData | null>(null);
    const [showConfigDialog, setShowConfigDialog] = useState(false);

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
                            <TableCell className="font-mono text-sm">{pool.strategyAddress}</TableCell>
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
                                        <PoolDetailsDialog pool={selectedPool} formatCurrency={formatCurrency} getStatusBadge={getStatusBadge} />
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
                                        <Button variant="ghost" size="sm" onClick={() => onPoolAction(pool._id, "pause")}>
                                            <Pause className="h-4 w-4 text-yellow-500" />
                                        </Button>
                                    ) : (
                                        <Button variant="ghost" size="sm" onClick={() => onPoolAction(pool._id, "activate")}>
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