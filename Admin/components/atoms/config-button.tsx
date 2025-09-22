"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw, Wallet } from "lucide-react"

interface ConfigButtonProps {
  actionName: string
  params: any
  variant?: "default" | "outline" | "destructive" | "secondary"
  loading?: boolean
  disabled?: boolean
  onClick: (actionName: string, params: any) => void
  className?: string
}

export function ConfigButton({
  actionName,
  params,
  variant = "default",
  loading = false,
  disabled = false,
  onClick,
  className = "",
}: ConfigButtonProps) {
  return (
    <Button
      onClick={() => onClick(actionName, params)}
      disabled={loading || disabled}
      variant={variant}
      className={`w-full gap-2 ${className}`}
    >
      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
      {actionName}
    </Button>
  )
}
