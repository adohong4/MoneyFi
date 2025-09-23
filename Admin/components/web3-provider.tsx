"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"
import WalletConnectProvider from "@walletconnect/web3-provider"
import { DEFAULT_RPC_URL } from "@/lib/web3/config"

// Add this global type augmentation for window.ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}

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

  const connect = async (walletType: string = "metamask") => {
    setIsLoading(true)
    try {
      let ethersProvider: ethers.BrowserProvider | null = null
      let accounts: string[] = []

      if (walletType === "walletconnect") {
        const walletConnectProvider = new WalletConnectProvider({
          infuraId: process.env.ALCHEMY_API_KEY, // Thay bằng Infura ID hoặc Alchemy API key
          rpc: {
            1: "https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_API_KEY",
            11155111: DEFAULT_RPC_URL,
          },
        })
        await walletConnectProvider.enable()
        ethersProvider = new ethers.BrowserProvider(walletConnectProvider)
        accounts = await walletConnectProvider.request({ method: "eth_accounts" })
      } else if (walletType === "metamask" && typeof window !== "undefined" && window.ethereum) {
        ethersProvider = new ethers.BrowserProvider(window.ethereum)
        accounts = await ethersProvider.send("eth_requestAccounts", [])
      } else {
        throw new Error("Unsupported wallet or wallet not installed")
      }

      const signer = await ethersProvider.getSigner()
      const network = await ethersProvider.getNetwork()

      setProvider(ethersProvider)
      setSigner(signer)
      setAccount(accounts[0])
      setChainId(Number(network.chainId))
      setIsConnected(true)
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = async () => {
    // Check if the underlying provider is WalletConnect by checking for 'disconnect' method and 'wc' property
    const underlyingProvider = provider && (provider as any).provider
    if (underlyingProvider && underlyingProvider.disconnect && underlyingProvider.wc) {
      await underlyingProvider.disconnect()
    }
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
