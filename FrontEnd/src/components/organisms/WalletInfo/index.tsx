"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { useAccount, useBalance, useChainId } from "wagmi"
import { formatUnits } from "viem"
import { CONTRACT_ADDRESSES } from "@/src/config/contracts"
import { ContractService } from "@/src/services/contractService"
import { apiService, UserBalance, PoolBalance } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { sepolia } from "wagmi/chains"

export const WalletDashboard = () => {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { toast } = useToast()
  const [lpTokenBalance, setLpTokenBalance] = useState<string>("0")
  const [withdrawPercentage, setWithdrawPercentage] = useState([0])
  const [selectedPools, setSelectedPools] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null)

  const { data: ethBalance } = useBalance({ address })
  const { data: usdcBalanceData } = useBalance({
    address,
    token: chainId === sepolia.id ? (CONTRACT_ADDRESSES.USDC as `0x${string}`) : undefined,
  })
  const { data: lpBalanceData } = useBalance({
    address,
    token: chainId === sepolia.id ? (CONTRACT_ADDRESSES.MoneyFiTokenLp as `0x${string}`) : undefined,
  })

  // Fetch user balance from API
  useEffect(() => {
    const fetchUserBalance = async () => {
      if (!address || !isConnected) return
      setLoading(true)
      try {
        const balanceData = await apiService.getUserBalance(address)
        setUserBalance(balanceData)
      } catch (error) {
        console.error("Error fetching user balance:", error)
        toast({
          title: "Error",
          description: "Failed to fetch user balance.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchUserBalance()
  }, [address, isConnected, toast])

  // Update LP token balance
  useEffect(() => {
    if (lpBalanceData) {
      setLpTokenBalance(formatUnits(lpBalanceData.value, lpBalanceData.decimals))
    }
  }, [lpBalanceData])

  // Calculate system balance (totalBalance from API) and withdraw amount
  const systemBalance = userBalance ? Number(userBalance.totalUserBalance) : 0
  const currentFundVault = userBalance ? Number(userBalance.currentUserFundVault) : 0
  const withdrawAmount = (systemBalance * withdrawPercentage[0]) / 100

  // Calculate available pool balance for withdrawal
  const availablePoolBalance = selectedPools.length
    ? userBalance?.poolBalances
      .filter((pool) => selectedPools.includes(pool.strategyAddress))
      .reduce((sum, pool) => sum + Number(pool.poolValueInUSDC), 0) || 0
    : 0

  // Check if withdrawal is possible
  const canWithdraw = withdrawAmount <= currentFundVault + availablePoolBalance

  // Handle pool selection
  const handlePoolSelection = (poolAddress: string) => {
    setSelectedPools((prev) =>
      prev.includes(poolAddress) ? prev.filter((id) => id !== poolAddress) : [...prev, poolAddress]
    )
  }

  // Handle withdraw action
  const handleWithdraw = async () => {
    if (!address || withdrawAmount <= 0 || !canWithdraw) {
      toast({
        title: "Invalid Withdraw",
        description: !selectedPools.length && withdrawAmount > currentFundVault
          ? "Please select pools to cover the withdrawal amount."
          : "Invalid withdrawal amount or insufficient balance.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const contractService = new ContractService()
      const amountInWei = Math.floor(withdrawAmount * 1000000) // USDC has 6 decimals
      await contractService.withdrawUSDC(amountInWei, address, selectedPools)
      toast({
        title: "Withdraw Successful",
        description: `Successfully withdrew ${withdrawAmount.toFixed(6)} USDC`,
      })
      setWithdrawPercentage([0])
      setSelectedPools([])
      window.location.reload()
    } catch (error) {
      console.error("Withdraw failed:", error)
      toast({
        title: "Withdraw Failed",
        description: (error as Error).message || "Failed to withdraw USDC",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected || !address) {
    return (
      <Card className="p-4 max-w-4xl mx-auto">
        <p className="text-center text-muted-foreground">Vui lòng kết nối ví để xem thông tin</p>
      </Card>
    )
  }

  const isCorrectNetwork = chainId === sepolia.id

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-10xl mx-auto p-4">
      {/* Left Column: Withdraw Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Withdraw</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Withdraw Controls */}
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
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>System Balance:</span>
                <span>{loading ? "Loading..." : `${systemBalance.toFixed(3)} USDC`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Fund Vault Balance:</span>
                <span>{loading ? "Loading..." : `${currentFundVault.toFixed(3)} USDC`}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Withdraw Amount:</span>
                <span className="text-primary">{withdrawAmount.toFixed(3)} USDC</span>
              </div>
            </div>
            <Button
              className="w-full"
              size="lg"
              variant="destructive"
              onClick={handleWithdraw}
              disabled={loading || withdrawAmount <= 0 || !canWithdraw}
            >
              {loading ? "Processing..." : `Withdraw ${withdrawAmount.toFixed(6)} USDC`}
            </Button>
          </div>
          {/* Pool Selection (shown only if withdrawAmount > currentFundVault) */}

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Select Pools (Fund Vault Insufficient)</h4>
            {userBalance?.poolBalances.map((pool) => (
              <div key={pool.strategyAddress} className="flex items-center space-x-2">
                <Checkbox
                  id={pool.strategyAddress}
                  checked={selectedPools.includes(pool.strategyAddress)}
                  onCheckedChange={() => handlePoolSelection(pool.strategyAddress)}
                />
                <Label htmlFor={pool.strategyAddress} className="text-sm">
                  {pool.poolName} ({Number(pool.poolValueInUSDC).toFixed(2)} USDC)
                </Label>
              </div>
            ))}
          </div>

        </div>
      </Card>

      {/* Right Column: Wallet Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">User Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Address Wallet:</span>
            <span className="text-sm font-mono">{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Network:</span>
            <span className={`text-sm font-semibold ${isCorrectNetwork ? "text-green-600" : "text-red-600"}`}>
              {isCorrectNetwork ? "Sepolia ✓" : "Wrong Network ✗"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">ETH:</span>
            <span className="text-sm font-semibold">
              {ethBalance ? Number.parseFloat(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4) : "0"} ETH
            </span>
          </div>
          {isCorrectNetwork && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">USDC:</span>
                <span className="text-sm font-semibold text-green-600">
                  {usdcBalanceData
                    ? Number.parseFloat(formatUnits(usdcBalanceData.value, usdcBalanceData.decimals)).toFixed(2)
                    : "0"}{" "}
                  USDC
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">LP Token:</span>
                <span className="text-sm font-semibold text-blue-600">
                  {Number.parseFloat(lpTokenBalance).toFixed(4)} mUSDC
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Deposit:</span>
                <span className="text-sm font-semibold text-purple-600">
                  {loading ? "Loading..." : `${userBalance?.totalUserBalance} USDC`}
                </span>
              </div>
            </>
          )}
          {!isCorrectNetwork && (
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Vui lòng chuyển sang mạng Sepolia để sử dụng ứng dụng
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}