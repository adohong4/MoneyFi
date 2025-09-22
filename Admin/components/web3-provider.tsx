"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { ethers } from "ethers"

interface Web3ContextType {
  account: string | null
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  chainId: number | null
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
  switchNetwork: (chainId: number) => Promise<void>
  isLoading: boolean
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

let ethersLib: typeof ethers | null = null
const loadEthers = async () => {
  if (!ethersLib) {
    const { ethers } = await import("ethers")
    ethersLib = ethers
  }
  return ethersLib
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const connect = async () => {
    setIsLoading(true)
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const ethers = await loadEthers()
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.send("eth_requestAccounts", [])
        const signer = await provider.getSigner()
        const network = await provider.getNetwork()

        setProvider(provider)
        setSigner(signer)
        setAccount(accounts[0])
        setChainId(Number(network.chainId))
        setIsConnected(true)
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = () => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
    setChainId(null)
    setIsConnected(false)
  }

  const switchNetwork = async (targetChainId: number) => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        })
      }
    } catch (error) {
      console.error("Failed to switch network:", error)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect()
        } else {
          setAccount(accounts[0])
        }
      })

      window.ethereum.on("chainChanged", (chainId: string) => {
        setChainId(Number.parseInt(chainId, 16))
      })
    }
  }, [])

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        signer,
        chainId,
        isConnected,
        connect,
        disconnect,
        switchNetwork,
        isLoading,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider")
  }
  return context
}
