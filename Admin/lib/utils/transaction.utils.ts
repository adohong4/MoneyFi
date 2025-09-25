import { ArrowDownLeft, RefreshCw, Activity, AlertTriangle, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Transaction } from "@/services/apis/transaction.api"

export const getTransactionIcon = (type: string) => {
    if (type.includes("deposit")) return <ArrowDownLeft className="h-4 w-4 text-green-500" />
  if (type.includes("rebalance")) return <RefreshCw className="h-4 w-4 text-purple-500" />
  return <Activity className="h-4 w-4 text-gray-500" />
}

export const getStatusBadge = (status: string) => {
    switch (status) {
        case "completed":
            return <Badge className="bg-green-500/10 text-green-500 border-green-500/20" > Completed </Badge>
        case "pending":
            return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20" > Pending </Badge>
        case "failed":
            return <Badge variant="destructive" > Failed </Badge>
        default:
            return <Badge variant="secondary" > Unknown </Badge>
    }
}

export const getEventIcon = (type: string) => {
    switch (type) {
        case "emergency":
            return <AlertTriangle className="h-4 w-4 text-red-500" />
    case "config_change":
            return <RefreshCw className="h-4 w-4 text-blue-500" />
    case "pool_update":
            return <TrendingUp className="h-4 w-4 text-green-500" />
    default:
            return <Activity className="h-4 w-4 text-gray-500" />
  }
}

export const getSeverityBadge = (severity: string) => {
    switch (severity) {
        case "high":
            return <Badge variant="destructive" > High </Badge>
        case "medium":
            return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20" > Medium </Badge>
        case "low":
            return <Badge className="bg-green-500/10 text-green-500 border-green-500/20" > Low </Badge>
        default:
            return <Badge variant="secondary" > Info </Badge>
    }
}

export const getExplorerUrl = (txHash: string) => {
    return `https://sepolia.etherscan.io/tx/${txHash}`
}

export const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const formatTxHash = (txHash: string) => {
    return `${txHash.slice(0, 10)}...${txHash.slice(-8)}`
}