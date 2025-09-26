export interface PoolData {
    _id: string;
    name: string;
    strategyAddress: string;
    quoteToken: string;
    baseToken: string;
    chainId: number;
    slippageWhenSwapAsset: number;
    minimumSwapAmount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    feeWhenSwapAsset?: number;
    tvl?: number;
    volume24h?: number;
    fees24h?: number;
    apy?: number;
    utilization?: number;
    totalUsers?: number;
    lastRebalance?: string;
    pairAddress: string;
}