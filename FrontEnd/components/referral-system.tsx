"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Copy, Share2, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAccount } from "wagmi"
import { api } from "@/lib/api"
import { refApiService } from "@/services/referral.api"

export function ReferralSystem() {
  const { address } = useAccount()
  const { toast } = useToast()
  const [referralCode, setReferralCode] = useState("")
  const [referralStats, setReferralStats] = useState({
    referrals: 0,
    earnings: 0,
  })
  const [loading, setLoading] = useState(false)

  // useEffect(() => {
  //   if (address) {
  //     // Generate referral code from address (first 6 chars + last 4 chars)
  //     const code = `${address.slice(2, 8).toUpperCase()}${address.slice(-4).toUpperCase()}`
  //     setReferralCode(code)
  //   }
  // }, [address])

  useEffect(() => {
    const fetchReferralStats = async () => {
      if (!address) return

      setLoading(true)
      try {
        const userInfo = await refApiService.getUserInfor(address)

        setReferralCode(userInfo.invitationCode)  // This also returns user data

        setReferralStats({
          referrals: 0,
          earnings: 0,
        })
      } catch (error) {
        console.error("Error fetching referral stats:", error)
        // Use mock data as fallback
        setReferralStats({
          referrals: 12,
          earnings: 2400,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchReferralStats()
  }, [address])

  const referralLink = `${window.location.origin}?ref=${referralCode}`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    })
  }

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join DeFi Platform",
        text: "Earn yield on your USDC deposits with this multi-chain DeFi platform",
        url: referralLink,
      })
    } else {
      copyToClipboard(referralLink)
    }
  }

  if (!address) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Referral Program
        </CardTitle>
        <CardDescription>Earn rewards by inviting friends to the platform</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="referral-code">Your Referral Code</Label>
          <div className="flex gap-2">
            <Input
              id="referral-code"
              value={referralCode}
              readOnly
              className="font-mono text-sm font-bold text-center"
            />
            <Button variant="outline" size="icon" onClick={() => copyToClipboard(referralCode)}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="referral-link">Your Referral Link</Label>
          <div className="flex gap-2">
            <Input id="referral-link" value={referralLink} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={() => copyToClipboard(referralLink)}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={shareReferral}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">{loading ? "..." : referralStats.referrals}</div>
            <div className="text-sm text-muted-foreground">Referrals</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-green-600">
              {loading ? "..." : `$${referralStats.earnings.toLocaleString()}`}
            </div>
            <div className="text-sm text-muted-foreground">Earned</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Referral Benefits</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                2%
              </Badge>
              Commission on referral deposits
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                0.5%
              </Badge>
              Bonus APR for you and your referral
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
          <strong>How it works:</strong> Share your referral link with friends. When they connect their wallet and make
          their first deposit, you'll earn 2% commission and both of you get 0.5% bonus APR!
        </div>
      </CardContent>
    </Card>
  )
}
