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
import { Shield, UserPlus, Trash2, Key, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Mock admin data
const mockAdmins = [
  {
    id: "1",
    address: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    role: "Super Admin",
    permissions: ["All Permissions"],
    addedBy: "System",
    addedDate: "2023-10-01",
    lastLogin: "2 hours ago",
    status: "active",
    description: "System administrator with full access",
  },
  {
    id: "2",
    address: "0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1",
    role: "Delegate Admin",
    permissions: ["Config Management", "Fee Withdrawal", "User Management"],
    addedBy: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    addedDate: "2023-11-15",
    lastLogin: "1 day ago",
    status: "active",
    description: "Protocol configuration and user management",
  },
  {
    id: "3",
    address: "0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
    role: "Operator",
    permissions: ["Transaction Processing", "Pool Management"],
    addedBy: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    addedDate: "2024-01-20",
    lastLogin: "30 minutes ago",
    status: "active",
    description: "Daily operations and transaction processing",
  },
  {
    id: "4",
    address: "0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3",
    role: "Delegate Admin",
    permissions: ["Config Management", "Emergency Controls"],
    addedBy: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    addedDate: "2024-02-10",
    lastLogin: "1 week ago",
    status: "inactive",
    description: "Emergency response and system controls",
  },
]

const rolePermissions = {
  "Super Admin": ["All Permissions"],
  "Delegate Admin": [
    "Config Management",
    "Fee Withdrawal",
    "User Management",
    "Emergency Controls",
    "Router Management",
  ],
  Operator: ["Transaction Processing", "Pool Management", "Rebalancing", "Cross Chain Operations"],
  Viewer: ["Read Only Access", "Analytics View"],
}

export function AdminManagement() {
  const { toast } = useToast()
  const [admins, setAdmins] = useState(mockAdmins)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newAdmin, setNewAdmin] = useState({
    address: "",
    role: "",
    description: "",
  })

  const handleAddAdmin = () => {
    if (!newAdmin.address || !newAdmin.role) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const admin = {
      id: String(admins.length + 1),
      address: newAdmin.address,
      role: newAdmin.role,
      permissions: rolePermissions[newAdmin.role as keyof typeof rolePermissions] || [],
      addedBy: "Current Admin",
      addedDate: new Date().toISOString().split("T")[0],
      lastLogin: "Never",
      status: "active",
      description: newAdmin.description,
    }

    setAdmins([...admins, admin])
    setNewAdmin({ address: "", role: "", description: "" })
    setShowAddDialog(false)

    toast({
      title: "Admin Added",
      description: `New ${newAdmin.role} has been added successfully.`,
    })
  }

  const handleRemoveAdmin = (adminId: string) => {
    setAdmins(admins.filter((admin) => admin.id !== adminId))
    toast({
      title: "Admin Removed",
      description: "Admin has been removed from the system.",
    })
  }

  const handleToggleStatus = (adminId: string) => {
    setAdmins(
      admins.map((admin) =>
        admin.id === adminId ? { ...admin, status: admin.status === "active" ? "inactive" : "active" } : admin,
      ),
    )

    toast({
      title: "Admin Status Updated",
      description: "Admin status has been changed successfully.",
    })
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Super Admin":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Super Admin</Badge>
      case "Delegate Admin":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Delegate Admin</Badge>
      case "Operator":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Operator</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Admin Management</h1>
          <p className="text-muted-foreground">Manage administrator accounts and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            {admins.filter((a) => a.status === "active").length} Active Admins
          </Badge>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Administrator</DialogTitle>
                <DialogDescription>
                  Add a new administrator to the system with specific role and permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminAddress">Wallet Address *</Label>
                  <Input
                    id="adminAddress"
                    placeholder="0x..."
                    value={newAdmin.address}
                    onChange={(e) => setNewAdmin({ ...newAdmin, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminRole">Role *</Label>
                  <Select value={newAdmin.role} onValueChange={(value) => setNewAdmin({ ...newAdmin, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Delegate Admin">Delegate Admin</SelectItem>
                      <SelectItem value="Operator">Operator</SelectItem>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminDescription">Description</Label>
                  <Input
                    id="adminDescription"
                    placeholder="Brief description of admin role..."
                    value={newAdmin.description}
                    onChange={(e) => setNewAdmin({ ...newAdmin, description: e.target.value })}
                  />
                </div>
                {newAdmin.role && (
                  <div className="space-y-2">
                    <Label>Permissions for {newAdmin.role}</Label>
                    <div className="flex flex-wrap gap-2">
                      {rolePermissions[newAdmin.role as keyof typeof rolePermissions]?.map((permission) => (
                        <Badge key={permission} variant="outline">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddAdmin}>Add Admin</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Role Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Super Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.filter((a) => a.role === "Super Admin").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delegate Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.filter((a) => a.role === "Delegate Admin").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Operators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.filter((a) => a.role === "Operator").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.filter((a) => a.status === "active").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Admin List */}
      <Card>
        <CardHeader>
          <CardTitle>Administrator Directory</CardTitle>
          <CardDescription>Manage system administrators and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Added Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-mono text-sm">
                      {admin.address.slice(0, 10)}...{admin.address.slice(-8)}
                    </TableCell>
                    <TableCell>{getRoleBadge(admin.role)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {admin.permissions.slice(0, 2).map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                        {admin.permissions.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{admin.permissions.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(admin.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{admin.lastLogin}</TableCell>
                    <TableCell className="text-muted-foreground">{admin.addedDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(admin.id)}
                          disabled={admin.role === "Super Admin"}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAdmin(admin.id)}
                          disabled={admin.role === "Super Admin"}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>Overview of permissions for each admin role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(rolePermissions).map(([role, permissions]) => (
              <div key={role} className="flex items-start gap-4 p-4 rounded-lg border">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getRoleBadge(role)}
                    {role === "Super Admin" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
