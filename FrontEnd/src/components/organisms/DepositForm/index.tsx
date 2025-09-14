"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Card, CardContentComponent, CardHeaderComponent } from "@/src/components/atoms/Card"
import { Button } from "@/src/components/atoms/Button"
import { Input } from "@/src/components/atoms/Input"
import { TokenSelector } from "@/src/components/molecules/TokenSelector"
import { Slider } from "@/components/ui/slider"
import { ContractService } from "@/src/services/contractService"
import { ethers } from "ethers"
import { useToast } from "@/hooks/use-toast"

interface DepositFormProps {
  onDeposit?: (amount: string, token: string) => void
  isLoading?: boolean
}

export const DepositForm: React.FC<DepositFormProps> = ({ onDeposit, isLoading = false }) => {
  const [amount, setAmount] = useState("")
  const [percentage, setPercentage] = useState([0])
  const [usdcBalance, setUsdcBalance] = useState("0")
  const [isApproving, setIsApproving] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const { address, isConnected } = useAccount()
  const { toast } = useToast()

  const [selectedToken] = useState({
    symbol: "USDC",
    name: "USD Coin",
    icon: "/usdc-coins.png",
    chainId: 11155111, // Sepolia
  })

  const tokens = [
    {
      symbol: "USDC",
      name: "USD Coin",
      icon: "/usdc-coins.png",
      chainId: 11155111,
    },
  ]

  useEffect(() => {
    const fetchBalance = async () => {
      if (address && isConnected && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const contractService = new ContractService(provider)
          const balance = await contractService.getUSDCBalance(address)
          setUsdcBalance(balance)
        } catch (error) {
          console.error("Error fetching USDC balance:", error)
        }
      }
    }

    fetchBalance()
  }, [address, isConnected])

  const handlePercentageChange = (value: number[]) => {
    setPercentage(value)
    const calculatedAmount = (Number.parseFloat(usdcBalance) * value[0]) / 100
    setAmount(calculatedAmount.toFixed(6))
  }

  const handleDeposit = async () => {
    if (!address || !isConnected || !window.ethereum) {
      toast({
        title: "Lỗi",
        description: "Vui lòng kết nối ví trước",
        variant: "destructive",
      })
      return
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số tiền hợp lệ",
        variant: "destructive",
      })
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contractService = new ContractService(provider)

      // Kiểm tra allowance
      const allowance = await contractService.getUSDCAllowance(address)

      if (Number.parseFloat(allowance) < Number.parseFloat(amount)) {
        // Cần approve trước
        setIsApproving(true)
        toast({
          title: "Đang approve USDC...",
          description: "Vui lòng xác nhận giao dịch trong ví",
        })

        const approveTx = await contractService.approveUSDC(amount)
        await approveTx.wait()

        toast({
          title: "Approve thành công",
          description: "Bây giờ có thể deposit",
        })
        setIsApproving(false)
      }

      // Thực hiện deposit
      setIsDepositing(true)
      toast({
        title: "Đang deposit...",
        description: "Vui lòng xác nhận giao dịch trong ví",
      })

      const depositTx = await contractService.depositFund(amount)
      await depositTx.wait()

      toast({
        title: "Deposit thành công!",
        description: `Đã deposit ${amount} USDC vào hệ thống`,
      })

      // Reset form
      setAmount("")
      setPercentage([0])

      // Cập nhật lại balance
      const newBalance = await contractService.getUSDCBalance(address)
      setUsdcBalance(newBalance)

      if (onDeposit) {
        onDeposit(amount, selectedToken.symbol)
      }
    } catch (error: any) {
      console.error("Deposit error:", error)
      toast({
        title: "Lỗi deposit",
        description: error.message || "Có lỗi xảy ra khi deposit",
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
      setIsDepositing(false)
    }
  }

  const isProcessing = isApproving || isDepositing || isLoading

  return (
    <Card>
      <CardHeaderComponent title="Deposit USDC" description="Deposit USDC on Sepolia to earn yield" />
      <CardContentComponent className="space-y-4">
        <TokenSelector selectedToken={selectedToken} tokens={tokens} onTokenSelect={() => {}} />

        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!isConnected}
          />
          <p className="text-xs text-muted-foreground">
            Balance: {Number.parseFloat(usdcBalance).toFixed(6)} {selectedToken.symbol}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Percentage: {percentage[0]}%</label>
          <Slider
            value={percentage}
            onValueChange={handlePercentageChange}
            max={100}
            step={1}
            className="w-full"
            disabled={!isConnected}
          />
        </div>

        <Button onClick={handleDeposit} disabled={!amount || !isConnected || isProcessing} className="w-full">
          {!isConnected
            ? "Kết nối ví để deposit"
            : isApproving
              ? "Đang approve..."
              : isDepositing
                ? "Đang deposit..."
                : "Deposit"}
        </Button>
      </CardContentComponent>
    </Card>
  )
}
