"use client"

import type React from "react"
import { Button } from "@/src/components/atoms/Button"
import { Card, CardContentComponent, CardHeaderComponent } from "@/src/components/atoms/Card"
import { Wallet, ChevronDown } from "lucide-react"

interface WalletConnectorProps {
  isConnected: boolean
  address?: string
  onConnect: () => void
  onDisconnect: () => void
}

export const WalletConnector: React.FC<WalletConnectorProps> = ({ isConnected, address, onConnect, onDisconnect }) => {
  if (isConnected && address) {
    return (
      <Button variant="outline" onClick={onDisconnect} className="flex items-center gap-2 bg-transparent">
        <Wallet className="w-4 h-4" />
        {`${address.slice(0, 6)}...${address.slice(-4)}`}
        <ChevronDown className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeaderComponent title="Connect Wallet" description="Choose your preferred wallet to connect" />
      <CardContentComponent>
        <div className="space-y-3">
          <Button onClick={onConnect} className="w-full justify-start gap-3">
            <Wallet className="w-5 h-5" />
            MetaMask
          </Button>
          <Button onClick={onConnect} variant="outline" className="w-full justify-start gap-3 bg-transparent">
            <Wallet className="w-5 h-5" />
            Coinbase Wallet
          </Button>
          <Button onClick={onConnect} variant="outline" className="w-full justify-start gap-3 bg-transparent">
            <Wallet className="w-5 h-5" />
            Rainbow
          </Button>
        </div>
      </CardContentComponent>
    </Card>
  )
}
