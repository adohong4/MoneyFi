import { USER_API_ENDPOINTS, URL } from "@/config/constanst";

export interface UserData {
    _id: string;
    userAddress: string;
    invitationCode: string;
    isReferral: boolean;
    referralCode: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    balance: number;
    __v: number;
}

export interface ResponsePaginate {
    status: number;
    message: string;
    metadata: {
        users: UserData[];
        currentPage: number;
        totalPages: number;
        totalUser: number;
        limit: number;
    };
}

export class UserAPI {
    private baseUrl: string;

    constructor() {
        this.baseUrl = URL;
    }

    async GetAllUsers(params: {
        page?: number;
        limit?: number;
    } = {}): Promise<ResponsePaginate> {
        try {
            const query = new URLSearchParams();
            if (params.page) query.append("page", params.page.toString());
            if (params.limit) query.append("limit", params.limit.toString());

            const response = await fetch(
                `${this.baseUrl}${USER_API_ENDPOINTS.userGet}?${query.toString()}`,
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

            const data: ResponsePaginate = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching users:", error);
            throw error;
        }
    }

    async searchTransactions(params: {
        query?: string;
        status?: string;
        type?: string;
    }): Promise<ResponsePaginate> {
        try {
            const query = new URLSearchParams();
            if (params.query) query.append("query", params.query);
            if (params.status) query.append("status", params.status);
            if (params.type) query.append("type", params.type);

            const response = await fetch(
                `${this.baseUrl}${USER_API_ENDPOINTS.search}?${query.toString()}`,
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

            const data: ResponsePaginate = await response.json();
            return data;
        } catch (error) {
            console.error("Failed to search transactions:", error);
            throw error;
        }
    }
}