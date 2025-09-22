"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, LogOut, Copy, ExternalLink } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"
import { useToast } from "@/hooks/use-toast"

export function WalletInfo() {
  const { account, chainId, isConnected, disconnect, balance } = useWeb3()
  const { toast } = useToast()

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getNetworkName = (chainId: number) => {
    const networks: { [key: number]: string } = {
      1: "Ethereum",
      56: "BSC",
      137: "Polygon",
      42161: "Arbitrum",
      10: "Optimism",
    }
    return networks[chainId] || `Chain ${chainId}`
  }

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const openExplorer = () => {
    if (account && chainId) {
      const explorers: { [key: number]: string } = {
        1: "https://etherscan.io",
        56: "https://bscscan.com",
        137: "https://polygonscan.com",
        42161: "https://arbiscan.io",
        10: "https://optimistic.etherscan.io",
      }
      const explorerUrl = explorers[chainId] || "https://etherscan.io"
      window.open(`${explorerUrl}/address/${account}`, "_blank")
    }
  }

  if (!isConnected) {
    return null
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Connected Wallet</span>
          </div>

          <div className="space-y-1">
            <Badge variant="outline" className="w-full justify-center">
              {chainId && getNetworkName(chainId)}
            </Badge>

            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="flex-1 justify-center text-xs">
                {account && formatAddress(account)}
              </Badge>
              <Button variant="ghost" size="sm" onClick={copyAddress} className="h-6 w-6 p-0">
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={openExplorer} className="h-6 w-6 p-0">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>

            {balance && (
              <Badge variant="outline" className="w-full justify-center text-xs">
                {Number.parseFloat(balance).toFixed(4)} ETH
              </Badge>
            )}
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={disconnect} className="w-full gap-2 bg-transparent">
          <LogOut className="h-3 w-3" />
          Disconnect
        </Button>
      </CardContent>
    </Card>
  )
}
