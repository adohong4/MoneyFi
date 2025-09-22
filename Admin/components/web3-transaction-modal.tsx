"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, ExternalLink, Loader2 } from "lucide-react"
import { SUPPORTED_CHAINS } from "@/lib/web3/config"

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  txHash?: string
  status: "pending" | "success" | "error"
  title: string
  description?: string
  chainId?: number
}

export function Web3TransactionModal({
  isOpen,
  onClose,
  txHash,
  status,
  title,
  description,
  chainId,
}: TransactionModalProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      case "success":
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case "error":
        return <XCircle className="h-8 w-8 text-red-500" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "pending":
        return "Transaction Pending"
      case "success":
        return "Transaction Successful"
      case "error":
        return "Transaction Failed"
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "pending":
        return "bg-blue-500"
      case "success":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
    }
  }

  const getExplorerUrl = () => {
    if (!txHash || !chainId) return null
    const chain = Object.values(SUPPORTED_CHAINS).find((c) => c.chainId === chainId)
    return chain ? `${chain.blockExplorer}/tx/${txHash}` : null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col items-center space-y-2">
            {getStatusIcon()}
            <Badge variant="outline" className={`${getStatusColor()} text-white`}>
              {getStatusText()}
            </Badge>
          </div>

          {description && <p className="text-sm text-muted-foreground text-center">{description}</p>}

          {txHash && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Transaction Hash</span>
                <code className="text-xs bg-muted p-2 rounded block break-all">{txHash}</code>
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Close
            </Button>
            {getExplorerUrl() && (
              <Button
                variant="default"
                onClick={() => window.open(getExplorerUrl()!, "_blank")}
                className="flex-1 gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View on Explorer
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
