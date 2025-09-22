"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Mock data for analytics
const data = [
  { name: "Jan", users: 400, tvl: 2400, transactions: 240 },
  { name: "Feb", users: 300, tvl: 1398, transactions: 221 },
  { name: "Mar", users: 200, tvl: 9800, transactions: 229 },
  { name: "Apr", users: 278, tvl: 3908, transactions: 200 },
  { name: "May", users: 189, tvl: 4800, transactions: 218 },
  { name: "Jun", users: 239, tvl: 3800, transactions: 250 },
  { name: "Jul", users: 349, tvl: 4300, transactions: 210 },
]

export function AnalyticsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Protocol Analytics</CardTitle>
        <CardDescription>User growth and transaction volume over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
              <YAxis className="text-xs fill-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Line type="monotone" dataKey="users" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Users" />
              <Line
                type="monotone"
                dataKey="transactions"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                name="Transactions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
