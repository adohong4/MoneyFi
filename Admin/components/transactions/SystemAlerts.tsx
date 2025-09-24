// components/TransactionHistory/SystemAlerts.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { AlertTriangle, Clock, CheckCircle } from "lucide-react"

export function SystemAlerts() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    System Alerts
                </CardTitle>
                <CardDescription>Active alerts and warnings</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-red-950 bg-red-500">
                        <AlertTriangle className="h-4 w-4 text-white" />
                        <div className="flex-1">
                            <p className="font-medium text-white">High Gas Prices Detected</p>
                            <p className="text-sm text-white">Current gas price: 45.2 gwei</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-yellow-200 bg-yellow-500">
                        <Clock className="h-4 w-4 text-black" />
                        <div className="flex-1">
                            <p className="font-medium text-black">Pending Transactions</p>
                            <p className="text-sm text-black">3 transactions pending for &gt;10 minutes</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-green-700 bg-green-900">
                        <CheckCircle className="h-4 w-4 text-yellow-500" />
                        <div className="flex-1">
                            <p className="font-medium text-yellow-500">System Healthy</p>
                            <p className="text-sm text-yellow-600">All contracts operating normally</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}