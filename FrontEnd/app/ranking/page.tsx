"use client"

import { Web3Provider } from "@/components/web3-provider"
import { WalletConnect } from "@/components/wallet-connect"
import { ChainSelector } from "@/components/chain-selector"
import { DepositModal } from "@/components/deposit-modal"
import { ThemeToggle } from "@/components/theme-toggle"
import { Navigation } from "@/components/navigation"
import { RankingLeaderboard } from "@/components/ranking-leaderboard"
import { Toaster } from "@/components/ui/toaster"
import { TrendingUp } from "lucide-react"

export default function RankingPage() {
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
                {/* <DepositModal /> */}
                <WalletConnect />
                {/* <ThemeToggle /> */}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <RankingLeaderboard />
        </main>

        <Toaster />
      </div>
    </Web3Provider>
  )
}
