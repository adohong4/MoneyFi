import { ADMIN_API_ENDPOINTS, URL } from "@/config/constanst";

export interface AdminInput {
    userAddress: string;
    role: string;
}

export interface AdminData {
    _id: string;
    userAddress: string;
    role: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export class AdminAPI {
    private baseUrl: string;

    constructor() {
        this.baseUrl = URL;
    }

    async createAdmin(AdminInput: AdminInput): Promise<{ metadata: AdminData[] }> {
        const response = await fetch(`${this.baseUrl}${ADMIN_API_ENDPOINTS.adminCreate}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(AdminInput),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    }

    async GetAllAdmin(): Promise<AdminData[]> {
        try {
            const response = await fetch(`${this.baseUrl}${ADMIN_API_ENDPOINTS.adminGet}`, {
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

    async AdminStatus(id: string, status: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}${ADMIN_API_ENDPOINTS.adminPut}/${encodeURIComponent(id)}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    }
}