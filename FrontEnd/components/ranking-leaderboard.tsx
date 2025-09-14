"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Trophy,
  Medal,
  Award,
  Search,
  TrendingUp,
  Users,
  DollarSign,
  Crown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { api } from "@/lib/api"

export function RankingLeaderboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("deposits")
  const [currentPage, setCurrentPage] = useState(1)
  const [leaderboardData, setLeaderboardData] = useState({
    data: [],
    total: 0,
    totalPages: 0,
    page: 1,
  })
  const [isLoading, setIsLoading] = useState(false)

  const itemsPerPage = 20

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true)
      try {
        const result = await api.getRankingLeaderboard(currentPage, itemsPerPage)
        setLeaderboardData(result)
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
        setLeaderboardData({
          data: mockLeaderboard.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
          total: mockLeaderboard.length,
          totalPages: Math.ceil(mockLeaderboard.length / itemsPerPage),
          page: currentPage,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [currentPage])

  const mockLeaderboard = [
    {
      rank: 1,
      address: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12",
      totalDeposited: 2500000,
      totalEarnings: 312500,
      apr: 15.2,
      referrals: 89,
    },
    {
      rank: 2,
      address: "0x2b3c4d5e6f7890abcdef1234567890abcdef1234",
      totalDeposited: 1800000,
      totalEarnings: 216000,
      apr: 14.8,
      referrals: 67,
    },
    {
      rank: 3,
      address: "0x3c4d5e6f7890abcdef1234567890abcdef123456",
      totalDeposited: 1200000,
      totalEarnings: 144000,
      apr: 14.1,
      referrals: 45,
    },
    {
      rank: 4,
      address: "0x4d5e6f7890abcdef1234567890abcdef12345678",
      totalDeposited: 950000,
      totalEarnings: 114000,
      apr: 13.9,
      referrals: 34,
    },
    {
      rank: 5,
      address: "0x5e6f7890abcdef1234567890abcdef1234567890",
      totalDeposited: 780000,
      totalEarnings: 93600,
      apr: 13.5,
      referrals: 28,
    },
    {
      rank: 6,
      address: "0x6f7890abcdef1234567890abcdef123456789012",
      totalDeposited: 650000,
      totalEarnings: 78000,
      apr: 13.2,
      referrals: 23,
    },
    {
      rank: 7,
      address: "0x7890abcdef1234567890abcdef12345678901234",
      totalDeposited: 520000,
      totalEarnings: 62400,
      apr: 12.8,
      referrals: 19,
    },
    {
      rank: 8,
      address: "0x890abcdef1234567890abcdef1234567890123456",
      totalDeposited: 450000,
      totalEarnings: 54000,
      apr: 12.5,
      referrals: 16,
    },
    {
      rank: 9,
      address: "0x90abcdef1234567890abcdef12345678901234567",
      totalDeposited: 380000,
      totalEarnings: 45600,
      apr: 12.2,
      referrals: 14,
    },
    {
      rank: 10,
      address: "0x0abcdef1234567890abcdef123456789012345678",
      totalDeposited: 320000,
      totalEarnings: 38400,
      apr: 11.9,
      referrals: 12,
    },
  ]

  const topEarners = [...(leaderboardData.data.length > 0 ? leaderboardData.data : mockLeaderboard)].sort(
    (a, b) => b.totalEarnings - a.totalEarnings,
  )
  const topReferrers = [...(leaderboardData.data.length > 0 ? leaderboardData.data : mockLeaderboard)].sort(
    (a, b) => (b.referrals || 0) - (a.referrals || 0),
  )

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-primary" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-accent" />
      default:
        return (
          <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
            #{rank}
          </span>
        )
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-primary text-primary-50">Champion</Badge>
    if (rank <= 3) return <Badge className="bg-secondary text-secondary-50">Elite</Badge>
    if (rank <= 10) return <Badge variant="secondary">Top 10</Badge>
    if (rank <= 50) return <Badge variant="outline">Top 50</Badge>
    return null
  }

  const currentData = leaderboardData.data.length > 0 ? leaderboardData.data : mockLeaderboard
  const filteredLeaderboard = currentData.filter((user) =>
    user.address.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < leaderboardData.totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePageClick = (page: number) => {
    setCurrentPage(page)
  }

  const PaginationComponent = () => {
    const totalPages = leaderboardData.totalPages || Math.ceil(mockLeaderboard.length / itemsPerPage)
    const startPage = Math.max(1, currentPage - 2)
    const endPage = Math.min(totalPages, currentPage + 2)
    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, leaderboardData.total || mockLeaderboard.length)} of{" "}
          {leaderboardData.total || mockLeaderboard.length} results
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1 || isLoading}>
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {pages.map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageClick(page)}
              disabled={isLoading}
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages || isLoading}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Global Leaderboard</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Compete with DeFi investors worldwide and climb the rankings
        </p>
      </div>

      {/* Top 3 Podium */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Top Performers
          </CardTitle>
          <CardDescription>The elite investors leading our platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {currentData.slice(0, 3).map((user, index) => (
              <div
                key={user.rank}
                className={`text-center p-4 rounded-lg border ${
                  index === 0
                    ? "bg-primary/10 border-primary/30"
                    : index === 1
                      ? "bg-secondary/10 border-secondary/30"
                      : "bg-accent/10 border-accent/30"
                }`}
              >
                <div className="flex justify-center mb-2">{getRankIcon(user.rank)}</div>
                <Avatar className="w-12 h-12 mx-auto mb-2">
                  <AvatarFallback className="font-bold">{user.address.slice(2, 4).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="font-mono text-sm text-muted-foreground mb-1">{formatAddress(user.address)}</div>
                <div className="font-bold text-lg">${user.totalDeposited.toLocaleString()}</div>
                <div className="text-sm text-green-600">+${(user.totalEarnings || 0).toLocaleString()} earned</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Leaderboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deposits" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Top Deposits
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Top Earners
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Top Referrers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deposits">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard by Total Deposits</CardTitle>
              <CardDescription>Ranked by total USDC deposited across all chains</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading leaderboard...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLeaderboard.map((user) => (
                    <div
                      key={user.rank}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10">{getRankIcon(user.rank)}</div>

                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="font-bold">
                            {user.address.slice(2, 4).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <div className="font-mono text-sm">{formatAddress(user.address)}</div>
                          <div className="flex items-center gap-2">
                            {getRankBadge(user.rank)}
                            <span className="text-xs text-muted-foreground">{user.apr}% APR</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-lg">${user.totalDeposited.toLocaleString()}</div>
                        <div className="text-sm text-green-600">+${(user.totalEarnings || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <PaginationComponent />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard by Total Earnings</CardTitle>
              <CardDescription>Ranked by total profits generated from deposits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topEarners.map((user, index) => (
                  <div
                    key={user.address}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10">{getRankIcon(index + 1)}</div>

                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="font-bold">{user.address.slice(2, 4).toUpperCase()}</AvatarFallback>
                      </Avatar>

                      <div>
                        <div className="font-mono text-sm">{formatAddress(user.address)}</div>
                        <div className="flex items-center gap-2">
                          {getRankBadge(index + 1)}
                          <span className="text-xs text-muted-foreground">{user.apr}% APR</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-lg text-green-600">
                        ${(user.totalEarnings || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${user.totalDeposited.toLocaleString()} deposited
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard by Referrals</CardTitle>
              <CardDescription>Ranked by number of successful referrals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topReferrers.map((user, index) => (
                  <div
                    key={user.address}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10">{getRankIcon(index + 1)}</div>

                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="font-bold">{user.address.slice(2, 4).toUpperCase()}</AvatarFallback>
                      </Avatar>

                      <div>
                        <div className="font-mono text-sm">{formatAddress(user.address)}</div>
                        <div className="flex items-center gap-2">
                          {getRankBadge(index + 1)}
                          <span className="text-xs text-muted-foreground">
                            ${user.totalDeposited.toLocaleString()} deposited
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-lg text-purple-600">{user.referrals || 0} referrals</div>
                      <div className="text-sm text-muted-foreground">
                        ~${((user.referrals || 0) * 100).toLocaleString()} earned
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
