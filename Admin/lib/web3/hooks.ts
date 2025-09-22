"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/components/web3-provider"
import { Web3Service, type SystemConfig, type UserDepositInfo, type TokenInfo } from "./services"

export function useWeb3Service() {
  const { provider, signer } = useWeb3()

  if (!provider) return null

  return new Web3Service(provider, signer || undefined)
}

export function useSystemConfig() {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const service = useWeb3Service()

  const fetchConfig = async () => {
    if (!service) return

    try {
      setLoading(true)
      const systemConfig = await service.getSystemConfig()
      setConfig(systemConfig)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch system config")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [service])

  return { config, loading, error, refetch: fetchConfig }
}

export function useUserDeposit(tokenAddress: string, userAddress: string) {
  const [deposit, setDeposit] = useState<UserDepositInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const service = useWeb3Service()

  const fetchDeposit = async () => {
    if (!service || !tokenAddress || !userAddress) return

    try {
      setLoading(true)
      const depositInfo = await service.getUserDepositInfo(tokenAddress, userAddress)
      setDeposit(depositInfo)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch deposit info")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeposit()
  }, [service, tokenAddress, userAddress])

  return { deposit, loading, error, refetch: fetchDeposit }
}

export function useTokenInfo(tokenAddress: string, userAddress: string) {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const service = useWeb3Service()

  const fetchTokenInfo = async () => {
    if (!service || !tokenAddress || !userAddress) return

    try {
      setLoading(true)
      const info = await service.getTokenInfo(tokenAddress, userAddress)
      setTokenInfo(info)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch token info")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTokenInfo()
  }, [service, tokenAddress, userAddress])

  return { tokenInfo, loading, error, refetch: fetchTokenInfo }
}

export function useAdminCheck(address: string) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const service = useWeb3Service()

  const checkAdmin = async () => {
    if (!service || !address) return

    try {
      setLoading(true)
      const adminStatus = await service.isAdmin(address)
      setIsAdmin(adminStatus)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check admin status")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAdmin()
  }, [service, address])

  return { isAdmin, loading, error, refetch: checkAdmin }
}
