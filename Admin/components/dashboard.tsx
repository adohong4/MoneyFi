"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Waves, Activity, DollarSign, CheckCircle } from "lucide-react"
import { AnalyticsChart } from "@/components/analytics-chart"
import { RecentTransactions } from "@/components/recent-transactions"
import { SystemStatus } from "@/components/system-status"
import { AdvancedAnalytics } from "@/components/advanced-analytics" // Added advanced analytics import

// Mock data
const stats = [
  {
    title: "Total Users",
    value: "12,847",
    change: "+12.5%",
    trend: "up",
    icon: Users,
  },
  {
    title: "Active Pools",
    value: "24",
    change: "+2",
    trend: "up",
    icon: Waves,
  },
  {
    title: "Total Value Locked",
    value: "$2.4M",
    change: "+8.2%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "Daily Transactions",
    value: "1,429",
    change: "-3.1%",
    trend: "down",
    icon: Activity,
  },
]

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Dashboard Overview</h1>
          <p className="text-muted-foreground">Monitor your DeFi protocol performance and system health</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            System Healthy
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div
                className={`text-xs flex items-center gap-1 ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}
              >
                <TrendingUp className={`h-3 w-3 ${stat.trend === "down" ? "rotate-180" : ""}`} />
                {stat.change} from last month
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart />
        <SystemStatus />
      </div>

      <AdvancedAnalytics />

      <div className="grid grid-cols-1 gap-6">
        <RecentTransactions />
      </div>
    </div>
  )
}
