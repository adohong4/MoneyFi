"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LogOut, Copy, ExternalLink, CheckCircle, Wallet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useWeb3 } from "@/components/web3-provider"

const loadConfig = async () => {
  const { SUPPORTED_CHAINS } = await import("@/lib/web3/config")
  return { SUPPORTED_CHAINS }
}

export function EnhancedWalletConnect() {
  const { toast } = useToast()
  const { account, chainId, isConnected, connect, disconnect, isLoading } = useWeb3()
  const [copied, setCopied] = useState(false)
  const [supportedChains, setSupportedChains] = useState<any>(null)

  const loadChainConfig = async () => {
    if (!supportedChains) {
      const { SUPPORTED_CHAINS } = await loadConfig()
      setSupportedChains(SUPPORTED_CHAINS)
    }
    return supportedChains
  }

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

  const handleDisconnect = () => {
    disconnect()
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    })
  }

  const copyAddress = async () => {
    if (account) {
      await navigator.clipboard.writeText(account)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getNetworkName = async (chainId: number) => {
    const chains = await loadChainConfig()
    const chain = Object.values(chains).find((c: any) => c.chainId === chainId)
    return chain?.name || `Chain ${chainId}`
  }

  const getNetworkColor = (chainId: number) => {
    if (chainId === 1) return "bg-blue-500" // Ethereum
    if (chainId === 11155111) return "bg-purple-500" // Sepolia
    return "bg-gray-500"
  }

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 justify-center">
              <Wallet className="h-4 w-4" />
              <h3 className="text-sm font-medium">Connect Wallet</h3>
            </div>
            <Button onClick={handleConnect} disabled={isLoading} className="w-full" size="sm">
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">Connect your wallet to access admin features</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <h3 className="text-sm font-medium">Wallet Connected</h3>
            </div>
            <div className={`w-2 h-2 rounded-full ${getNetworkColor(chainId || 0)}`} />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Network</span>
              <Badge variant="secondary" className="text-xs">
                Chain {chainId || 0}
              </Badge>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Address</span>
              <div className="flex items-center gap-1">
                <code className="text-xs bg-muted px-2 py-1 rounded flex-1">{formatAddress(account || "")}</code>
                <Button variant="ghost" size="sm" onClick={copyAddress} className="h-6 w-6 p-0">
                  {copied ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="flex-1 gap-1 h-8 text-xs bg-transparent"
            >
              <LogOut className="h-3 w-3" />
              Disconnect
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (account) {
                  const explorerUrl = chainId === 1 ? "https://etherscan.io" : "https://sepolia.etherscan.io"
                  window.open(`${explorerUrl}/address/${account}`, "_blank")
                }
              }}
              className="h-8 w-8 p-0"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
