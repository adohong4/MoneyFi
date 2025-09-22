"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Search, Filter, Eye, Ban, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/pagination"

// Mock user data - expanded for pagination demo
const generateMockUsers = () => {
  const users = []
  for (let i = 1; i <= 150; i++) {
    users.push({
      id: i.toString(),
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      balance: `${(Math.random() * 50000).toFixed(2)} ${["USDC", "DAI", "ETH", "USDT"][Math.floor(Math.random() * 4)]}`,
      totalDeposits: `${(Math.random() * 100000).toFixed(2)} USDC`,
      totalWithdraws: `${(Math.random() * 50000).toFixed(2)} USDC`,
      activePools: Math.floor(Math.random() * 6),
      status: Math.random() > 0.8 ? "suspended" : "active",
      joinDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
        .toISOString()
        .split("T")[0],
      lastActivity: `${Math.floor(Math.random() * 30)} days ago`,
      riskScore: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
    })
  }
  return users
}

const mockUsers = generateMockUsers()

export function UserManagement() {
  const { toast } = useToast()
  const [users, setUsers] = useState(mockUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredUsers.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize)

  const handleUserAction = (userId: string, action: string) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, status: action === "suspend" ? "suspended" : "active" } : user,
      ),
    )

    toast({
      title: "User Updated",
      description: `User has been ${action === "suspend" ? "suspended" : "activated"} successfully.`,
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "Low":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Low Risk</Badge>
      case "Medium":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Medium Risk</Badge>
      case "High":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">High Risk</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">User Management</h1>
          <p className="text-muted-foreground">Monitor and manage protocol users and their activities</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {users.length} Total Users
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.status === "active").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suspended Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.status === "suspended").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Risk Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.riskScore === "High").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total TVL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.4M</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>Search and filter protocol users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Active Pools</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm">
                      {user.address.slice(0, 10)}...{user.address.slice(-8)}
                    </TableCell>
                    <TableCell className="font-medium">{user.balance}</TableCell>
                    <TableCell>{user.activePools}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{getRiskBadge(user.riskScore)}</TableCell>
                    <TableCell className="text-muted-foreground">{user.lastActivity}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>User Details</DialogTitle>
                              <DialogDescription>
                                Detailed information for user {selectedUser?.address}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedUser && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Address</Label>
                                  <p className="font-mono text-sm">{selectedUser.address}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label>Current Balance</Label>
                                  <p className="font-medium">{selectedUser.balance}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label>Total Deposits</Label>
                                  <p className="font-medium">{selectedUser.totalDeposits}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label>Total Withdraws</Label>
                                  <p className="font-medium">{selectedUser.totalWithdraws}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label>Active Pools</Label>
                                  <p className="font-medium">{selectedUser.activePools}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label>Join Date</Label>
                                  <p className="font-medium">{selectedUser.joinDate}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label>Status</Label>
                                  {getStatusBadge(selectedUser.status)}
                                </div>
                                <div className="space-y-2">
                                  <Label>Risk Score</Label>
                                  {getRiskBadge(selectedUser.riskScore)}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {user.status === "active" ? (
                          <Button variant="ghost" size="sm" onClick={() => handleUserAction(user.id, "suspend")}>
                            <Ban className="h-4 w-4 text-red-500" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => handleUserAction(user.id, "activate")}>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredUsers.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newPageSize) => {
                setPageSize(newPageSize)
                setCurrentPage(1)
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
