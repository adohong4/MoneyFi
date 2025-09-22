"use client"

import { lazy, Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const EnhancedWalletConnect = lazy(() =>
  import("@/components/enhanced-wallet-connect").then((module) => ({
    default: module.EnhancedWalletConnect,
  })),
)

const SystemConfig = lazy(() =>
  import("@/components/system-config").then((module) => ({
    default: module.SystemConfig,
  })),
)

const Web3TransactionModal = lazy(() =>
  import("@/components/web3-transaction-modal").then((module) => ({
    default: module.Web3TransactionModal,
  })),
)

const WalletConnectSkeleton = () => (
  <Card className="w-full">
    <CardContent className="p-4">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-3 w-48" />
      </div>
    </CardContent>
  </Card>
)

const SystemConfigSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48" />
    <div className="grid gap-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
)

export function LazyWalletConnect() {
  return (
    <Suspense fallback={<WalletConnectSkeleton />}>
      <EnhancedWalletConnect />
    </Suspense>
  )
}

export function LazySystemConfig() {
  return (
    <Suspense fallback={<SystemConfigSkeleton />}>
      <SystemConfig />
    </Suspense>
  )
}

export function LazyWeb3TransactionModal() {
  return (
    <Suspense fallback={null}>
      <Web3TransactionModal />
    </Suspense>
  )
}
