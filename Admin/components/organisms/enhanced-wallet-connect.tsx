"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, Smartphone, Monitor, HardHatIcon as HardwareIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Mock WalletConnect SDK integration
interface WalletOption {
  id: string
  name: string
  icon: React.ReactNode
  type: "mobile" | "desktop" | "hardware"
  installed?: boolean
}

const walletOptions: WalletOption[] = [
  { id: "metamask", name: "MetaMask", icon: <Wallet className="h-5 w-5" />, type: "desktop", installed: true },
  { id: "walletconnect", name: "WalletConnect", icon: <Smartphone className="h-5 w-5" />, type: "mobile" },
  { id: "coinbase", name: "Coinbase Wallet", icon: <Monitor className="h-5 w-5" />, type: "desktop" },
  { id: "trust", name: "Trust Wallet", icon: <Smartphone className="h-5 w-5" />, type: "mobile" },
  { id: "ledger", name: "Ledger", icon: <HardwareIcon className="h-5 w-5" />, type: "hardware" },
]

interface EnhancedWalletConnectProps {
  onConnect: (walletId: string) => Promise<void>
}

export function EnhancedWalletConnect({ onConnect }: EnhancedWalletConnectProps) {
  const [connecting, setConnecting] = useState<string | null>(null)
  const { toast } = useToast()

  const handleConnect = async (walletId: string) => {
    setConnecting(walletId)
    try {
      await onConnect(walletId)
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${walletOptions.find((w) => w.id === walletId)?.name}`,
      })
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      })
    } finally {
      setConnecting(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect Wallet
        </CardTitle>
        <CardDescription>Choose your preferred wallet to connect to the admin system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {walletOptions.map((wallet) => (
          <Button
            key={wallet.id}
            variant="outline"
            className="w-full justify-start gap-3 h-12 bg-transparent"
            onClick={() => handleConnect(wallet.id)}
            disabled={connecting !== null}
          >
            {wallet.icon}
            <div className="flex-1 text-left">
              <div className="font-medium">{wallet.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{wallet.type} wallet</div>
            </div>
            {wallet.installed && (
              <Badge variant="secondary" className="text-xs">
                Installed
              </Badge>
            )}
            {connecting === wallet.id && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
