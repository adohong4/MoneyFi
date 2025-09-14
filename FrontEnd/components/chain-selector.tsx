"use client"

import { Badge } from "@/components/ui/badge"
import { useAccount, useChainId } from "wagmi"
import { sepolia } from "wagmi/chains"

export function ChainSelector() {
  const { isConnected } = useAccount()
  const chainId = useChainId()

  if (!isConnected) return null

  const isCorrectNetwork = chainId === sepolia.id

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Network:</span>
      <Badge variant={isCorrectNetwork ? "default" : "destructive"} className="text-xs">
        {isCorrectNetwork ? "Sepolia" : "Wrong Network"}
      </Badge>
      {!isCorrectNetwork && <span className="text-xs text-muted-foreground">Please switch to Sepolia</span>}
    </div>
  )
}
