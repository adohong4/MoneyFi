import { type NextRequest, NextResponse } from "next/server"
import { api } from "@/lib/api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    switch (type) {
      case "deposit":
        // Handle deposit webhook
        const { userAddress, amount, txHash, referrer } = data

        // Record the deposit
        await api.recordDeposit(userAddress, amount, txHash)

        // Process referral if exists
        if (referrer) {
          await api.processReferral(userAddress, referrer, amount)
        }

        return NextResponse.json({ success: true, message: "Deposit processed" })

      case "referral":
        // Handle referral signup
        const { newUser, referrerCode } = data
        await api.saveUserAddress(newUser, referrerCode)

        return NextResponse.json({ success: true, message: "Referral processed" })

      default:
        return NextResponse.json({ error: "Unknown webhook type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "Webhook endpoint is active" })
}
