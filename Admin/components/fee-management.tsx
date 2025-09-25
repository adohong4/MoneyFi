"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Waves,
} from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic imports for recharts components to avoid SSR issues
const LineChart = dynamic(() => import("recharts").then((mod) => mod.LineChart), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), { ssr: false });
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });

// Mock fee data (giữ nguyên như mã gốc)
const feeStats = [
  {
    title: "Protocol Fee",
    value: "$12,450.50",
    percentage: "0.3%",
    change: "+8.2%",
    trend: "up",
    collected: 12450.5,
    pending: 1250.3,
  },
  {
    title: "Rebalance Fee",
    value: "$3,280.75",
    percentage: "0.1%",
    change: "+12.5%",
    trend: "up",
    collected: 3280.75,
    pending: 420.15,
  },
  {
    title: "Referral Fee",
    value: "$1,890.25",
    percentage: "0.05%",
    change: "+5.8%",
    trend: "up",
    collected: 1890.25,
    pending: 180.5,
  },
  {
    title: "Cross-Chain Fee",
    value: "$2,150.00",
    percentage: "0.2%",
    change: "-2.1%",
    trend: "down",
    collected: 2150.0,
    pending: 320.75,
  },
];

const feeHistory = [
  { date: "Jan", protocol: 8500, rebalance: 2100, referral: 1200, crosschain: 1800 },
  { date: "Feb", protocol: 9200, rebalance: 2400, referral: 1350, crosschain: 1950 },
  { date: "Mar", protocol: 10800, rebalance: 2800, referral: 1600, crosschain: 2100 },
  { date: "Apr", protocol: 11500, rebalance: 3000, referral: 1750, crosschain: 2050 },
  { date: "May", protocol: 12450, rebalance: 3280, referral: 1890, crosschain: 2150 },
];

const feeDistribution = [
  { name: "Protocol Fee", value: 62.5, color: "#3b82f6" },
  { name: "Rebalance Fee", value: 16.5, color: "#10b981" },
  { name: "Cross-Chain Fee", value: 10.8, color: "#f59e0b" },
  { name: "Referral Fee", value: 9.5, color: "#ef4444" },
];

const profitMargins = [
  { pool: "USDC-ETH", tvl: "$450K", fees: "$1,250", margin: "0.28%", apy: "12.5%" },
  { pool: "DAI-USDC", tvl: "$320K", fees: "$890", margin: "0.28%", apy: "10.2%" },
  { pool: "WBTC-ETH", tvl: "$280K", fees: "$780", margin: "0.28%", apy: "15.8%" },
  { pool: "USDT-DAI", tvl: "$180K", fees: "$520", margin: "0.29%", apy: "8.9%" },
];

export function FeeManagement() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  const totalFees = feeStats.reduce((sum, fee) => sum + fee.collected, 0);
  const totalPending = feeStats.reduce((sum, fee) => sum + fee.pending, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Fee Management</h1>
          <p className="text-muted-foreground">Monitor protocol fees, profit margins, and revenue streams</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <DollarSign className="h-3 w-3 text-green-500" />${totalFees.toLocaleString()} Collected
          </Badge>
        </div>
      </div>

      {/* Fee Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {feeStats.map((fee) => (
          <Card key={fee.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{fee.title}</CardTitle>
              <div className="flex items-center gap-1">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{fee.percentage}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fee.value}</div>
              <div className="flex items-center justify-between mt-2">
                <div
                  className={`text-xs flex items-center gap-1 ${fee.trend === "up" ? "text-green-500" : "text-red-500"}`}
                >
                  {fee.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {fee.change}
                </div>
                <Badge variant="secondary" className="text-xs">
                  ${fee.pending.toFixed(2)} pending
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Fee History</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="margins">Profit Margins</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Revenue Trend</CardTitle>
                <CardDescription>Monthly fee collection across all categories</CardDescription>
              </CardHeader>
              <CardContent>
                {feeHistory && feeHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={feeHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, ""]} />
                      <Line type="monotone" dataKey="protocol" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="rebalance" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="referral" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="crosschain" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div>Không có dữ liệu để hiển thị</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fee Collection Status</CardTitle>
                <CardDescription>Current collection progress and pending amounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {feeStats.map((fee) => (
                  <div key={fee.title} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{fee.title}</span>
                      <span className="font-medium">${fee.collected.toFixed(2)}</span>
                    </div>
                    <Progress value={(fee.collected / (fee.collected + fee.pending)) * 100} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Collected: ${fee.collected.toFixed(2)}</span>
                      <span>Pending: ${fee.pending.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Fee History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historical Fee Performance</CardTitle>
              <CardDescription>Detailed breakdown of fee collection over time</CardDescription>
            </CardHeader>
            <CardContent>
              {feeHistory && feeHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={feeHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, ""]} />
                    <Bar dataKey="protocol" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="rebalance" stackId="a" fill="#10b981" />
                    <Bar dataKey="referral" stackId="a" fill="#ef4444" />
                    <Bar dataKey="crosschain" stackId="a" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div>Không có dữ liệu để hiển thị</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fee Distribution</CardTitle>
                <CardDescription>Breakdown of fee types by percentage</CardDescription>
              </CardHeader>
              <CardContent>
                {feeDistribution && feeDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={feeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {feeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div>Không có dữ liệu để hiển thị</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fee Breakdown</CardTitle>
                <CardDescription>Detailed percentage and amounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {feeDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{item.value}%</div>
                      <div className="text-xs text-muted-foreground">
                        ${((totalFees * item.value) / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profit Margins Tab */}
        <TabsContent value="margins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pool Profit Margins</CardTitle>
              <CardDescription>Revenue and profit margins by pool</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profitMargins.map((pool) => (
                  <div key={pool.pool} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Waves className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{pool.pool}</div>
                        <div className="text-sm text-muted-foreground">TVL: {pool.tvl}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Fees Collected</div>
                        <div className="font-medium">{pool.fees}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Profit Margin</div>
                        <div className="font-medium text-green-500">{pool.margin}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">APY</div>
                        <div className="font-medium">{pool.apy}</div>
                      </div>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}