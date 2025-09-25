import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { PoolData } from "@/lib/api/PoolAPI";

interface StatsCardsProps {
    pools: PoolData[];
    tvlData: { [key: string]: number };
    formatCurrency: (amount: number) => string;
}

export function StatsCards({ pools, tvlData, formatCurrency }: StatsCardsProps) {
    const totalTVL = Object.values(tvlData).reduce((sum, tvl) => sum + tvl, 0);
    const totalPools = pools.length;
    const activePools = pools.filter((pool) => pool.status === "active").length;
    const averageSlippage =
        pools.length > 0
            ? pools.reduce((sum, pool) => sum + pool.slippageWhenSwapAsset, 0) / pools.length
            : 0;
    const totalFees =
        pools.length > 0
            ? pools.reduce((sum, pool) => sum + (pool.feeWhenSwapAsset || 0), 0)
            : 0;

    return (
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
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Pools</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalPools}</div>
                    <div className="text-xs text-muted-foreground">Total number of pools</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Pools</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activePools}</div>
                    <div className="text-xs text-muted-foreground">Pools currently active</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Average Slippage</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{averageSlippage.toFixed(2)}%</div>
                    <div className="text-xs text-muted-foreground">Average slippage across pools</div>
                </CardContent>
            </Card>
        </div>
    );
}