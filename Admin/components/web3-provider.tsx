"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { ethers } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { DEFAULT_RPC_URL } from "@/lib/web3/config";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Web3ContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: number | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  isLoading: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const switchNetwork = async (targetChainId: number) => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        });
        setChainId(targetChainId);
      }
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        // Chuỗi không tồn tại, thêm Sepolia
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xaa36a7",
              chainName: "Sepolia Test Network",
              rpcUrls: ["https://rpc.sepolia.org"],
              nativeCurrency: {
                name: "Sepolia ETH",
                symbol: "ETH",
                decimals: 18,
              },
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
        setChainId(targetChainId);
      } else {
        console.error("Failed to switch network:", switchError);
        throw switchError;
      }
    }
  };

  const connect = async (walletType: string = "metamask") => {
    setIsLoading(true);
    try {
      let ethersProvider: ethers.BrowserProvider | null = null;
      let accounts: string[] = [];

      if (walletType === "walletconnect") {
        const walletConnectProvider = new WalletConnectProvider({
          infuraId: process.env.ALCHEMY_API_KEY,
          rpc: {
            11155111: DEFAULT_RPC_URL, // Ưu tiên Sepolia
            1: "https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_API_KEY",
          },
        });
        await walletConnectProvider.enable();
        ethersProvider = new ethers.BrowserProvider(walletConnectProvider);
        accounts = await walletConnectProvider.request({ method: "eth_accounts" });
        // Yêu cầu WalletConnect chuyển sang Sepolia
        await walletConnectProvider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }],
        });
      } else if (walletType === "metamask" && typeof window !== "undefined" && window.ethereum) {
        // Chuyển sang Sepolia trước khi kết nối
        await switchNetwork(11155111);
        ethersProvider = new ethers.BrowserProvider(window.ethereum);
        accounts = await ethersProvider.send("eth_requestAccounts", []);
      } else {
        throw new Error("Unsupported wallet or wallet not installed");
      }

      const signer = await ethersProvider.getSigner();
      const network = await ethersProvider.getNetwork();

      setProvider(ethersProvider);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setIsConnected(true);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    const underlyingProvider = provider && (provider as any).provider;
    if (underlyingProvider && underlyingProvider.disconnect && underlyingProvider.wc) {
      await underlyingProvider.disconnect();
    }
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setIsConnected(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAccount(accounts[0]);
        }
      });

      window.ethereum.on("chainChanged", (chainId: string) => {
        setChainId(Number.parseInt(chainId, 16));
      });
    }
  }, []);

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
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}