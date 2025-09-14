"use client"

import type React from "react"
import { Button } from "@/src/components/atoms/Button"
import { ChevronDown } from "lucide-react"

interface Token {
  symbol: string
  name: string
  icon: string
  chainId: number
}

interface TokenSelectorProps {
  selectedToken: Token
  tokens: Token[]
  onTokenSelect: (token: Token) => void
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({ selectedToken, tokens, onTokenSelect }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Token</label>
      <Button
        variant="outline"
        className="w-full justify-between bg-transparent"
        onClick={() => {
          // Open token selection modal
        }}
      >
        <div className="flex items-center gap-2">
          <img
            src={selectedToken.icon || "/placeholder.svg"}
            alt={selectedToken.symbol}
            className="w-5 h-5 rounded-full"
          />
          <span>{selectedToken.symbol}</span>
        </div>
        <ChevronDown className="w-4 h-4" />
      </Button>
    </div>
  )
}
