// src/lib/utils/transactionUtils.ts

import { Badge } from "@/components/ui/badge"
import { ArrowDownLeft, RefreshCw, Activity, AlertTriangle, TrendingUp } from "lucide-react"

// Hàm lấy biểu tượng cho loại giao dịch
export function getTransactionIcon(type: string): JSX.Element {
    if (type.includes("deposit")) return <ArrowDownLeft className="h-4 w-4 text-green-500" />
  if (type.includes("rebalance")) return <RefreshCw className="h-4 w-4 text-purple-500" />
  return <Activity className="h-4 w-4 text-gray-500" />
}

// Hàm lấy badge cho trạng thái giao dịch
export function getStatusBadge(status: string): JSX.Element {
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

// Hàm lấy badge cho mức độ nghiêm trọng của sự kiện
export function getSeverityBadge(severity: string): JSX.Element {
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

// Hàm lấy biểu tượng cho loại sự kiện
export function getEventIcon(type: string): JSX.Element {
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

// Hàm lấy URL explorer
export function getExplorerUrl(txHash: string): string {
    return `https://sepolia.etherscan.io/tx/${txHash}`
}