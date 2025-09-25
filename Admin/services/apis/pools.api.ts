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
    tvl?: number; // Thêm để lưu TVL từ contract
}

export class PoolAPI {
    private baseUrl: string;

    constructor() {
        this.baseUrl = URL;
    }

    async AddPool(PoolInput: PoolInput): Promise<any> {
        const response = await fetch(`${this.baseUrl}${POOL_API_ENDPOINTS.poolAdd}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(PoolInput),
        });
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
            return data.metadata; // Trả về mảng PoolData
        } catch (error) {
            console.error("Failed to fetch pools:", error);
            throw error;
        }
    }

    async PoolStatus(id: string, status: string): Promise<any> {
        const response = await fetch(`${this.baseUrl}${POOL_API_ENDPOINTS.poolUpdate}/${encodeURIComponent(id)}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
        });
        return response.json();
    }

    async UpdatePool(id: string, PoolInput: Partial<PoolInput>): Promise<any> {
        const response = await fetch(`${this.baseUrl}${POOL_API_ENDPOINTS.poolUpdate}/${encodeURIComponent(id)}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(PoolInput), // Sửa lỗi: bỏ { PoolInput }
        });
        return response.json();
    }
}