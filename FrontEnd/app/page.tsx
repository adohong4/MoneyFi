"use client"

import { Web3Provider } from "@/components/web3-provider"
import { WalletConnect } from "@/components/wallet-connect"
import { ChainSelector } from "@/components/chain-selector"
import { StatsCards } from "@/components/stats-cards"
import { UserLeaderboard } from "@/components/user-leaderboard"
import { ChainStats } from "@/components/chain-stats"
import { ReferralSystem } from "@/components/referral-system"
import { DepositWithdrawPanel } from "@/components/deposit-withdraw-panel"
import { Navigation } from "@/components/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Toaster } from "@/components/ui/toaster"
import { TrendingUp, Shield, Zap } from "lucide-react"

export default function DeFiDashboard() {
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
                <WalletConnect />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-balance">Multi-Chain DeFi Yield Platform</h2>
              <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
                Deposit USDC/USDT across 5 major chains and earn competitive yields with our secure DeFi protocol
              </p>
              <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  Audited Smart Contracts
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Instant Deposits
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Up to 15% APR
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <StatsCards totalDeposits="7,000,000" totalUsers={3920} avgAPR={11.2} totalVolume="12,500,000" />

            {/* Main Dashboard Grid */}
            <div className="grid gap-8 lg:grid-cols-4">
              {/* Left Column - Deposit/Withdraw Panel */}
              <div className="lg:col-span-1 space-y-6">
                <DepositWithdrawPanel />
                <ReferralSystem />
              </div>

              {/* Middle Column - Charts and Stats */}
              <div className="lg:col-span-2 space-y-6">
                <ChainStats />
              </div>

              {/* Right Column - Leaderboard and Referrals */}
              <div className="lg:col-span-1 space-y-6">
                <UserLeaderboard />

              </div>
            </div>
          </div>
        </main>

        <Toaster />
      </div>
    </Web3Provider>
  )
}
