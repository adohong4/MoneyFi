"use client"

import { useState } from "react"

interface Web3State {
  isConnected: boolean
  address: string | null
  chainId: number | null
  balance: string
}

export const useWeb3 = () => {
  const [web3State, setWeb3State] = useState<Web3State>({
    isConnected: false,
    address: null,
    chainId: null,
    balance: "0",
  })

  const connectWallet = async () => {
    // Implementation for wallet connection
    console.log("[v0] Connecting wallet...")
  }

  const disconnectWallet = () => {
    setWeb3State({
      isConnected: false,
      address: null,
      chainId: null,
      balance: "0",
    })
  }

  return {
    ...web3State,
    connectWallet,
    disconnectWallet,
  }
}
