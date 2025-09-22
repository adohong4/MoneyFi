"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"

const systemComponents = [
  { name: "MoneyFiController", status: "healthy", uptime: "99.9%" },
  { name: "MoneyFiFundVault", status: "healthy", uptime: "99.8%" },
  { name: "MoneyFiRouter", status: "warning", uptime: "98.5%" },
  { name: "CrossChainRouter", status: "healthy", uptime: "99.7%" },
  { name: "UniswapPool", status: "healthy", uptime: "99.9%" },
  { name: "StargateCrossChain", status: "error", uptime: "95.2%" },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "healthy":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case "error":
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <CheckCircle className="h-4 w-4 text-green-500" />
  }
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case "healthy":
      return "default"
    case "warning":
      return "secondary"
    case "error":
      return "destructive"
    default:
      return "default"
  }
}

export function SystemStatus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
        <CardDescription>Real-time status of all smart contracts and components</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {systemComponents.map((component) => (
            <div key={component.name} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                {getStatusIcon(component.status)}
                <div>
                  <p className="font-medium">{component.name}</p>
                  <p className="text-sm text-muted-foreground">Uptime: {component.uptime}</p>
                </div>
              </div>
              <Badge variant={getStatusVariant(component.status) as any}>{component.status}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
