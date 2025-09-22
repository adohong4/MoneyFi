"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
} from "recharts"

// Mock data for advanced analytics
const volumeData = [
  { date: "Jan", volume: 2400000, fees: 7200, users: 1200 },
  { date: "Feb", volume: 1800000, fees: 5400, users: 1350 },
  { date: "Mar", volume: 3200000, fees: 9600, users: 1500 },
  { date: "Apr", volume: 2800000, fees: 8400, users: 1680 },
  { date: "May", volume: 3600000, fees: 10800, users: 1850 },
  { date: "Jun", volume: 4200000, fees: 12600, users: 2100 },
]

const poolDistribution = [
  { name: "USDC-ETH", value: 35, amount: 840000 },
  { name: "DAI-USDC", value: 25, amount: 600000 },
  { name: "WBTC-ETH", value: 20, amount: 480000 },
  { name: "USDT-DAI", value: 12, amount: 288000 },
  { name: "Others", value: 8, amount: 192000 },
]

const riskMetrics = [
  { metric: "Liquidity", value: 85, fullMark: 100 },
  { metric: "Volatility", value: 65, fullMark: 100 },
  { metric: "Concentration", value: 75, fullMark: 100 },
  { metric: "Slippage", value: 90, fullMark: 100 },
  { metric: "Impermanent Loss", value: 70, fullMark: 100 },
  { metric: "Smart Contract", value: 95, fullMark: 100 },
]

const userBehavior = [
  { hour: "00", deposits: 120, withdrawals: 80 },
  { hour: "04", deposits: 80, withdrawals: 60 },
  { hour: "08", deposits: 200, withdrawals: 150 },
  { hour: "12", deposits: 350, withdrawals: 280 },
  { hour: "16", deposits: 280, withdrawals: 220 },
  { hour: "20", deposits: 180, withdrawals: 140 },
]

const correlationData = [
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
  { x: 150, y: 400, z: 500 },
  { x: 110, y: 280, z: 200 },
]

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

export function AdvancedAnalytics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Analytics</CardTitle>
        <CardDescription>Comprehensive protocol performance and risk analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="volume" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="volume">Volume Analysis</TabsTrigger>
            <TabsTrigger value="distribution">Pool Distribution</TabsTrigger>
            <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
            <TabsTrigger value="behavior">User Behavior</TabsTrigger>
            <TabsTrigger value="correlation">Correlation</TabsTrigger>
          </TabsList>

          <TabsContent value="volume" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Trading Volume Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={volumeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${(value as number).toLocaleString()}`, ""]} />
                      <Area type="monotone" dataKey="volume" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fee Collection vs Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={volumeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Bar yAxisId="left" dataKey="fees" fill="#10b981" />
                      <Bar yAxisId="right" dataKey="users" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">TVL Distribution by Pool</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={poolDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {poolDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pool Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {poolDistribution.map((pool, index) => (
                      <div key={pool.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{pool.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${pool.amount.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">{pool.value}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Assessment Radar</CardTitle>
                <CardDescription>Multi-dimensional risk analysis across key metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={riskMetrics}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Risk Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Activity Patterns</CardTitle>
                <CardDescription>Hourly deposit and withdrawal patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userBehavior}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="deposits" stackId="1" stroke="#10b981" fill="#10b981" />
                    <Area type="monotone" dataKey="withdrawals" stackId="1" stroke="#ef4444" fill="#ef4444" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="correlation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Asset Correlation Analysis</CardTitle>
                <CardDescription>Relationship between different protocol metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={correlationData}>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="x" name="TVL" />
                    <YAxis type="number" dataKey="y" name="Volume" />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter name="Correlation" dataKey="z" fill="#3b82f6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
