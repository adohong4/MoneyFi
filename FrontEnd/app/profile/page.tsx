"use client"

import { Web3Provider } from "@/components/web3-provider"
import { WalletConnect } from "@/components/wallet-connect"
import { ChainSelector } from "@/components/chain-selector"
import { DepositModal } from "@/components/deposit-modal"
import { ThemeToggle } from "@/components/theme-toggle"
import { Navigation } from "@/components/navigation"
import { UserProfile } from "@/components/user-profile"
import { useAccount } from "wagmi"
import { Toaster } from "@/components/ui/toaster"
import { TrendingUp, Wallet } from "lucide-react"
import { WalletInfo } from "@/src/components/organisms/WalletInfo"

function ProfileContent() {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="text-center space-y-4">
          <Wallet className="w-16 h-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
          <p className="text-muted-foreground max-w-md">
            Please connect your wallet to view your profile and access DeFi features
          </p>
        </div>
        <WalletConnect />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <WalletInfo />
      <UserProfile />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Web3Provider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h1 className="text-xl font-bold">DeFi Yield</h1>
                </div>
                <ChainSelector />
              </div>

              <div className="flex items-center gap-4">
                <Navigation />
                <DepositModal />
                <WalletConnect />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <ProfileContent />
        </main>

        <Toaster />
      </div>
    </Web3Provider>
  )
}
