"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, LogOut } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"
import { useToast } from "@/hooks/use-toast"

export function WalletConnect() {
  const { account, chainId, isConnected, connect, disconnect } = useWeb3()
  const { toast } = useToast()

  const handleConnect = async () => {
    try {
      await connect()
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to your wallet",
      })
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getNetworkName = (chainId: number) => {
    const networks: { [key: number]: string } = {
      115511: "Sepolia",
      1: "Ethereum",
      56: "BSC",
      137: "Polygon",
      42161: "Arbitrum",
      10: "Optimism",
    }
    return networks[chainId] || `Chain ${chainId}`
  }

  if (!isConnected) {
    return (
      <Button onClick={handleConnect} className="gap-2">
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1">
          {chainId && getNetworkName(chainId)}
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <Wallet className="h-3 w-3" />
          {account && formatAddress(account)}
        </Badge>
      </div>
      <Button variant="outline" size="sm" onClick={disconnect} className="gap-1 bg-transparent">
        <LogOut className="h-3 w-3" />
        Disconnect
      </Button>
    </div>
  )
}
