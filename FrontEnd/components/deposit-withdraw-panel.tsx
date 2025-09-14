"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react"
import { useAccount, useBalance, useChainId } from "wagmi"
import { formatUnits } from "viem"
import { ContractService } from "@/src/services/contractService"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { TOKENS_ADDRESSES } from "@/config/constants"

const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" // USDC Sepolia
const LP_TOKEN_ADDRESS = "0x88C3e7da67170E731B261475F3eB73f477355f4f" // MoneyFi LP Token

export function DepositWithdrawPanel() {
  const [activeTab, setActiveTab] = useState("deposit")
  const [depositPercentage, setDepositPercentage] = useState([0])
  const [withdrawPercentage, setWithdrawPercentage] = useState([0])
  const [systemBalance, setSystemBalance] = useState(0)
  const [loading, setLoading] = useState(false)

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { toast } = useToast()

  const { data: usdcBalance } = useBalance({
    address: address,
    token: USDC_ADDRESS,
  })

  useEffect(() => {
    const fetchSystemBalance = async () => {
      if (!address || !isConnected) return

      setLoading(true)
      try {
        const contractService = new ContractService()

        // Lấy balance từ các pool và fund vault
        // const [uniLinkBalance, usdcArbBalance, fundVaultBalance] = await Promise.all([
        //   contractService.getUniLinkPoolBalance(address),
        //   contractService.getUsdcArbPoolBalance(address),
        //   contractService.getFundVaultBalance(address),
        // ])

        // Tổng số dư có thể rút (tính bằng USDC)

        const info = await contractService.getUserDepositInfo(address)
        const total = info.originalDepositAmount

        setSystemBalance(total)
      } catch (error) {
        console.error("Error fetching system balance:", error)
        setSystemBalance(0)
      } finally {
        setLoading(false)
      }
    }

    fetchSystemBalance()
  }, [address, isConnected])

  useEffect(() => {
    const saveUserAddress = async () => {
      if (!address || !isConnected) return

      try {
        // Check for referrer in URL params
        const urlParams = new URLSearchParams(window.location.search)
        const referrer = urlParams.get("ref")

        await api.saveUserAddress(address, referrer || undefined)
        console.log(`[API] User address saved: ${address}`)
      } catch (error) {
        console.error("Error saving user address:", error)
      }
    }

    saveUserAddress()
  }, [address, isConnected])

  const walletBalance = usdcBalance ? Number(formatUnits(usdcBalance.value, 6)) : 0
  const depositAmount = (walletBalance * depositPercentage[0]) / 100
  const withdrawAmount = (systemBalance * withdrawPercentage[0]) / 100

  const handleDeposit = async () => {
    if (!address || depositAmount <= 0) return

    setLoading(true)
    try {
      console.log("[v0] Starting deposit process for amount:", depositAmount)
      const contractService = new ContractService()

      const amountInWei = Math.floor(depositAmount) // Convert to 6 decimal places
      console.log("[v0] Amount in wei:", amountInWei)

      // Gọi deposit function với amount đã chuyển đổi
      await contractService.depositUSDC(amountInWei, address)

      const txHash = `0x${Math.random().toString(16).substr(2, 64)}` // Mock tx hash
      await api.recordDeposit(address, depositAmount, txHash)

      toast({
        title: "Deposit Successful",
        description: `Successfully deposited ${depositAmount.toFixed(6)} USDC`,
      })

      // Reset form
      setDepositPercentage([0])

      // Refresh balances after successful deposit
      window.location.reload()
    } catch (error) {
      console.error("[v0] Deposit failed:", error)
      toast({
        title: "Deposit Failed",
        description: (error as Error).message || "Failed to deposit USDC",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!address || withdrawAmount <= 0) return

    setLoading(true)
    try {
      console.log("[v0] Starting withdraw process for amount:", withdrawAmount)
      const contractService = new ContractService()

      // Chuyển đổi amount thành wei với 6 decimals cho USDC
      const amountInWei = Math.floor(withdrawAmount * 1000000)
      console.log("[v0] Amount in wei:", amountInWei)

      await contractService.withdrawUSDC(amountInWei, address)

      toast({
        title: "Withdraw Successful",
        description: `Successfully withdrew ${withdrawAmount.toFixed(6)} USDC`,
      })

      // Reset form
      setWithdrawPercentage([0])

      // Refresh balances after successful withdrawal
      window.location.reload()
    } catch (error) {
      console.error("[v0] Withdraw failed:", error)
      toast({
        title: "Withdraw Failed",
        description: (error as Error).message || "Failed to withdraw USDC",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5" />
            Deposit & Withdraw
          </CardTitle>
          <CardDescription>Connect wallet to manage your USDC deposits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Please connect your wallet to continue</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5" />
          Deposit & Withdraw
        </CardTitle>
        <CardDescription>Manage your USDC deposits on Sepolia testnet</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Withdraw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Deposit Percentage: {depositPercentage[0]}%</Label>
                <Slider
                  value={depositPercentage}
                  onValueChange={setDepositPercentage}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Wallet Balance (USDC):</span>
                  <span>{walletBalance.toFixed(6)} USDC</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Deposit Amount:</span>
                  <span className="text-primary">{depositAmount.toFixed(6)} USDC</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDepositPercentage([25])}>
                  25%
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDepositPercentage([50])}>
                  50%
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDepositPercentage([75])}>
                  75%
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDepositPercentage([100])}>
                  Max
                </Button>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleDeposit} disabled={loading || depositAmount <= 0}>
              {loading ? "Processing..." : `Deposit ${depositAmount.toFixed(6)} USDC`}
            </Button>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Withdraw Percentage: {withdrawPercentage[0]}%</Label>
                <Slider
                  value={withdrawPercentage}
                  onValueChange={setWithdrawPercentage}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>System Balance:</span>
                  <span>{loading ? "Loading..." : `${systemBalance.toFixed(3)} USDC`}</span>
                </div>
                {/* <div className="flex justify-between text-sm">
                  <span>LP Token Address:</span>
                  <span className="text-xs font-mono">
                    {LP_TOKEN_ADDRESS.slice(0, 6)}...{LP_TOKEN_ADDRESS.slice(-4)}
                  </span>
                </div> */}
                <div className="flex justify-between text-sm font-medium">
                  <span>Withdraw Amount:</span>
                  <span className="text-primary">{withdrawAmount.toFixed(3)} USDC</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setWithdrawPercentage([25])}>
                  25%
                </Button>
                <Button variant="outline" size="sm" onClick={() => setWithdrawPercentage([50])}>
                  50%
                </Button>
                <Button variant="outline" size="sm" onClick={() => setWithdrawPercentage([75])}>
                  75%
                </Button>
                <Button variant="outline" size="sm" onClick={() => setWithdrawPercentage([100])}>
                  Max
                </Button>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              variant="destructive"
              onClick={handleWithdraw}
              disabled={loading || withdrawAmount <= 0}
            >
              {loading ? "Processing..." : `Withdraw ${withdrawAmount.toFixed(6)} USDC`}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
