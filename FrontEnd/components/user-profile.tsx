"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Wallet,
  TrendingUp,
  Gift,
  Copy,
  ExternalLink,
  DollarSign,
  Percent,
  Calendar,
  Award,
  PiggyBank,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAccount } from "wagmi"
import { ContractService } from "@/src/services/contractService"
import { ethers } from "ethers"
import { refApiService } from "@/services/referral.api"
import { TransactionEventService } from "@/src/services"

// Mock user data
const mockUserData = {
  address: "0x742d35Cc6634C0532925a3b8D4C9db96590c4C5d",
  totalDeposited: 25000,
  totalWithdrawn: 5000,
  currentBalance: 22500,
  totalEarnings: 2500,
  apr: 12.5,
  joinDate: "2024-01-15",
  rank: 47,
  referralCode: "DEFI47X9",
  referralEarnings: 450,
  referredUsers: 12,
}

const mockTransactions = [
  { id: 1, type: "deposit", amount: 5000, chain: "ETH", hash: "0x123...abc", date: "2024-03-01", status: "completed" },
  { id: 2, type: "withdraw", amount: 2000, chain: "BNB", hash: "0x456...def", date: "2024-02-28", status: "completed" },
  { id: 3, type: "deposit", amount: 10000, chain: "ARB", hash: "0x789...ghi", date: "2024-02-25", status: "completed" },
  { id: 4, type: "reward", amount: 125, chain: "BASE", hash: "0xabc...123", date: "2024-02-24", status: "completed" },
  { id: 5, type: "deposit", amount: 7500, chain: "CORE", hash: "0xdef...456", date: "2024-02-20", status: "completed" },
]

const chainColors = {
  ETH: "bg-blue-500",
  BNB: "bg-yellow-500",
  ARB: "bg-cyan-500",
  BASE: "bg-purple-500",
  CORE: "bg-orange-500",
}

export function UserProfile() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [depositInfo, setDepositInfo] = useState({
    originalDepositAmount: 0,
    currentDepositAmount: 0,
  })
  const [referralCode, setReferralCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const { address, isConnected } = useAccount()

  useEffect(() => {
    const fetchDepositInfo = async () => {
      if (!isConnected || !address || !window.ethereum) return

      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const contractService = new ContractService(provider)
        const info = await contractService.getUserDepositInfo(address)
        setDepositInfo(info)
      } catch (error) {
        console.error("Error fetching deposit info:", error)
      }
    }

    fetchDepositInfo()
  }, [address, isConnected])

  useEffect(() => {
    const fetchUserInfor = async () => {
      if (!address || !isConnected) return

      setLoading(true)
      try {
        const userInfo = await refApiService.getUserInfor(address)

        setReferralCode(userInfo.invitationCode)  // This also returns user data

      } catch (error) {
        console.error("Error fetching referral stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUserInfor()
  }, [address])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    })
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border">
        <Avatar className="w-20 h-20">
          <AvatarFallback className="text-2xl font-bold">
            {(address || mockUserData.address).slice(2, 4).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">My Profile</h1>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              Rank #{mockUserData.rank}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="w-4 h-4" />
            <span className="font-mono">{formatAddress(address || mockUserData.address)}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(address || mockUserData.address, "Address")}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Joined {formatDate(mockUserData.joinDate)}
            </div>
            <div className="flex items-center gap-1">
              <Percent className="w-4 h-4" />
              {mockUserData.apr}% APR
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposited</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockUserData.totalDeposited.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all chains</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockUserData.currentBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active deposits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Original Deposit</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${depositInfo.originalDepositAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Initial investment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Deposit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${depositInfo.currentDepositAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available to withdraw</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referral Earnings</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">${mockUserData.referralEarnings}</div>
            <p className="text-xs text-muted-foreground">{mockUserData.referredUsers} referrals</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Performance</CardTitle>
                <CardDescription>Your investment progress over time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Profit Margin</span>
                    <span className="font-medium">
                      {((mockUserData.totalEarnings / mockUserData.totalDeposited) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={(mockUserData.totalEarnings / mockUserData.totalDeposited) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current APR</span>
                    <span className="font-medium">{mockUserData.apr}%</span>
                  </div>
                  <Progress value={mockUserData.apr} className="h-2" />
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground">Next milestone</div>
                  <div className="text-lg font-semibold">Reach $30,000 for VIP status</div>
                  <Progress value={(mockUserData.currentBalance / 30000) * 100} className="h-2 mt-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chain Distribution</CardTitle>
                <CardDescription>Your deposits across different chains</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { chain: "ETH", amount: 8500, percentage: 38 },
                  { chain: "BNB", amount: 5200, percentage: 23 },
                  { chain: "ARB", amount: 4100, percentage: 18 },
                  { chain: "BASE", amount: 2900, percentage: 13 },
                  { chain: "CORE", amount: 1800, percentage: 8 },
                ].map((item) => (
                  <div key={item.chain} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${chainColors[item.chain as keyof typeof chainColors]}`} />
                      <span className="font-medium">{item.chain}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${item.amount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deposits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deposit Information</CardTitle>
              <CardDescription>Your deposit details in the MoneyFi system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <PiggyBank className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold">Original Deposit</h3>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    ${depositInfo.originalDepositAmount.toLocaleString()} USDC
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Your initial investment amount</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold">Current Balance</h3>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ${depositInfo.currentDepositAmount.toLocaleString()} USDC
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Available for withdrawal</p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">LP Token Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">LP Token Address:</span>
                    <div className="flex items-center gap-2">
                      <code className="font-mono">0x88C3e7da67170E731B261475F3eB73f477355f4f</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard("0x88C3e7da67170E731B261475F3eB73f477355f4f", "LP Token address")
                        }
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Token Symbol:</span>
                    <span className="font-medium">mUSDC</span>
                  </div>
                </div>
              </div>

              {depositInfo.originalDepositAmount > 0 && (
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-700 dark:text-green-400">Growth Summary</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Growth:</span>
                      <span className="font-medium text-green-600">
                        +${(depositInfo.currentDepositAmount - depositInfo.originalDepositAmount).toLocaleString()} USDC
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Growth Percentage:</span>
                      <span className="font-medium text-green-600">
                        +
                        {(
                          ((depositInfo.currentDepositAmount - depositInfo.originalDepositAmount) /
                            depositInfo.originalDepositAmount) *
                          100
                        ).toFixed(2)}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All your deposits, withdrawals, and rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${chainColors[tx.chain as keyof typeof chainColors]}`} />
                      <div>
                        <div className="font-medium capitalize">{tx.type}</div>
                        <div className="text-sm text-muted-foreground">
                          {tx.chain} • {formatDate(tx.date)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-medium ${tx.type === "withdraw" ? "text-red-600" : "text-green-600"}`}>
                        {tx.type === "withdraw" ? "-" : "+"}${tx.amount.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>{formatAddress(tx.hash)}</span>
                        <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Referral Program</CardTitle>
              <CardDescription>Earn 2% of your referrals' deposits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Your Referral Code</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-background rounded border font-mono">{referralCode}</code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(referralCode, "Referral code")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{mockUserData.referredUsers}</div>
                  <div className="text-sm text-muted-foreground">Total Referrals</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">${mockUserData.referralEarnings}</div>
                  <div className="text-sm text-muted-foreground">Total Earned</div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Share your referral code and earn 2% of every deposit made by users who sign up with your code.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
