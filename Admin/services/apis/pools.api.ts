import { POOL_API_ENDPOINTS, URL } from "@/config/constanst";

export interface PoolInput {
    name: string;
    strategyAddress: string;
    baseToken: string;
    quoteToken: string;
    pairAddress: string;
    chainId: number;
    slippageWhenSwapAsset: number;
    minimumSwapAmount: number;
    status: string;
}

export interface PoolData {
    _id: string;
    name: string;
    strategyAddress: string;
    quoteToken: string;
    baseToken: string;
    pairAddress: string;
    chainId: number;
    slippageWhenSwapAsset: number;
    minimumSwapAmount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    feeWhenSwapAsset: number;
    tvl?: number;
}

export class PoolAPI {
    private baseUrl: string;

    constructor() {
        this.baseUrl = URL;
    }

    async AddPool(PoolInput: PoolInput): Promise<{ metadata: PoolData[] }> {
        const response = await fetch(`${this.baseUrl}${POOL_API_ENDPOINTS.poolAdd}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(PoolInput),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    }

    async GetPool(): Promise<PoolData[]> {
        try {
            const response = await fetch(`${this.baseUrl}${POOL_API_ENDPOINTS.poolGet}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            return data.metadata;
        } catch (error) {
            console.error("Failed to fetch pools:", error);
            throw error;
        }
    }

    async PoolStatus(id: string, status: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}${POOL_API_ENDPOINTS.poolUpdate}/${encodeURIComponent(id)}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    }

    async UpdatePool(id: string, PoolInput: Partial<PoolInput>): Promise<PoolData> {
        const response = await fetch(`${this.baseUrl}${POOL_API_ENDPOINTS.poolUpdate}/${encodeURIComponent(id)}`, {
            method: "POST", // Sửa thành PUT để đúng chuẩn REST
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(PoolInput),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data.metadata[0];
    }
}