"use client"

import { useState, useEffect } from "react"
import { useAccount, useBalance, useChainId } from "wagmi"
import { formatUnits } from "ethers"
import { Card } from "@/src/components/atoms/Card"
import { CONTRACT_ADDRESSES } from "@/src/config/contracts"
import { ContractService } from "@/src/services/contractService"
import { sepolia } from "wagmi/chains"

export const WalletInfo = () => {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [lpTokenBalance, setLpTokenBalance] = useState<string>("0")
  const [originalDepositAmount, setOriginalDepositAmount] = useState<string>("0")
  const [loading, setLoading] = useState(false)

  const { data: ethBalance } = useBalance({
    address: address,
  })

  const { data: usdcBalanceData } = useBalance({
    address: address,
    token: chainId === sepolia.id ? (CONTRACT_ADDRESSES.USDC as `0x${string}`) : undefined,
  })

  const { data: lpBalanceData } = useBalance({
    address: address,
    token: chainId === sepolia.id ? (CONTRACT_ADDRESSES.MoneyFiTokenLp as `0x${string}`) : undefined,
  })

  useEffect(() => {
    if (lpBalanceData) {
      setLpTokenBalance(formatUnits(lpBalanceData.value, lpBalanceData.decimals))
    }
  }, [lpBalanceData])

  useEffect(() => {
    const fetchOriginalDeposit = async () => {
      if (!address || !isConnected || chainId !== sepolia.id) return

      setLoading(true)
      try {
        const contractService = new ContractService()
        const depositInfo = await contractService.getUserDepositInfo(address)
        setOriginalDepositAmount(depositInfo.originalDepositAmount.toString())
      } catch (error) {
        console.error("Error fetching original deposit:", error)
        setOriginalDepositAmount("0")
      } finally {
        setLoading(false)
      }
    }

    fetchOriginalDeposit()
  }, [address, isConnected, chainId])

  if (!isConnected || !address) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">Vui lòng kết nối ví để xem thông tin</p>
      </Card>
    )
  }

  const isCorrectNetwork = chainId === sepolia.id

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Thông tin ví</h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Địa chỉ:</span>
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
              <span className="text-sm text-muted-foreground">Original Deposit:</span>
              <span className="text-sm font-semibold text-purple-600">
                {loading ? "Loading..." : `${Number.parseFloat(originalDepositAmount).toFixed(6)} USDC`}
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
  )
}
