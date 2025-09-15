import { API_ENDPOINTS, REFERRAL_API_ENDPOINTS } from "@/config/constants"

export interface ReferralRankData {

}

export interface UserInforData {
    userAddress: string,
    invitationCode: string
}

export class ReferralApiService {
    private baseUrl: string

    constructor(baseUrl = "http://localhost:4001/v1/api") {
        this.baseUrl = baseUrl
    }

    async getUserInfor(userAddress: string): Promise<UserInforData> {
        const response = await fetch(
            `${this.baseUrl}${API_ENDPOINTS.userInfor}/${encodeURIComponent(userAddress)}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        )

        if (!response.ok) {
            throw new Error(`Failed to fetch user info: ${response.statusText}`)
        }

        const data = await response.json()

        return {
            userAddress: data.metadata.userAddress,
            invitationCode: data.metadata.invitationCode,
        }
    }
    async getReferralRank(): Promise<ReferralRankData> {
        const response = await fetch(`${this.baseUrl}${REFERRAL_API_ENDPOINTS.referralRank}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        return response.json()
    }
}

export const refApiService = new ReferralApiService()