import { TRANSACTION_API_ENDPOINTS, URL } from "@/config/constanst";

export interface Transaction {
    _id: string;
    userAddress: string;
    poolName: string;
    strategyAddress: string;
    type: string;
    token: string;
    amountDeposit: string;
    txHash: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export interface TransactionData {
    status: number;
    message: string;
    metadata: {
        transactions: Transaction[];
        currentPage: number;
        totalPages: number;
        totalTransactions: number;
        limit: number;
    };
}

export class TransactionAPI {
    private baseUrl: string;

    constructor() {
        this.baseUrl = URL;
    }

    // Hàm để lấy danh sách giao dịch (GET)
    async getTransactions(params: {
        page?: number;
        limit?: number;
        userAddress?: string;
    } = {}): Promise<TransactionData> {
        try {
            // Tạo query string từ params
            const query = new URLSearchParams();
            if (params.page) query.append("page", params.page.toString());
            if (params.limit) query.append("limit", params.limit.toString());
            if (params.userAddress) query.append("userAddress", params.userAddress);

            const response = await fetch(
                `${this.baseUrl}${TRANSACTION_API_ENDPOINTS.transactionLog}?${query.toString()}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data: TransactionData = await response.json();
            return data;
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
            throw error;
        }
    }

    async searchTransactions(params: {
        query?: string
        status?: string
        type?: string
    }): Promise<TransactionData> {
        try {
            const query = new URLSearchParams()
            if (params.query) query.append("query", params.query)
            if (params.status) query.append("status", params.status)
            if (params.type) query.append("type", params.type)

            const response = await fetch(`${this.baseUrl}${TRANSACTION_API_ENDPOINTS.search}?${query.toString()}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const data: TransactionData = await response.json()
            return data
        } catch (error) {
            console.error("Failed to search transactions:", error)
            throw error
        }
    }
}