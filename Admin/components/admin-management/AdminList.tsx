import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Key, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AdminAPI, AdminData } from "@/services/apis/admin.api"
import { roleMapping } from "@/lib/utils/permissions.utils"

interface AdminListProps {
    admins: AdminData[]
    onStatusChange: () => Promise<void>
}

export function AdminList({ admins, onStatusChange }: AdminListProps) {
    const { toast } = useToast()
    const adminApi = new AdminAPI()

    const handleToggleStatus = async (adminId: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === "active" ? "inactive" : "active"
            await adminApi.AdminStatus(adminId, newStatus)
            await onStatusChange()
            toast({
                title: "Admin Status Updated",
                description: `Admin status has been changed to ${newStatus}.`,
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update admin status.",
                variant: "destructive",
            })
        }
    }

    const handleRemoveAdmin = async (adminId: string) => {
        try {
            await adminApi.AdminStatus(adminId, "inactive")
            await onStatusChange()
            toast({
                title: "Admin Removed",
                description: "Admin has been removed from the system.",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to remove admin.",
                variant: "destructive",
            })
        }
    }

    const getRoleBadge = (roleHash: string) => {
        const roleName = roleMapping[roleHash]?.name || "Unknown"
        switch (roleName) {
            case "Super Admin":
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Super Admin</Badge>
            case "Delegate Admin":
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Delegate Admin</Badge>
            case "Operator":
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Operator</Badge>
            case "Signer":
                return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Signer</Badge>
            default:
                return <Badge variant="secondary">{roleName}</Badge>
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
                                <TableHead>Added Date</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admins.map((admin) => (
                                <TableRow key={admin._id}>
                                    <TableCell className="font-mono text-sm">
                                        {admin.userAddress.slice(0, 10)}...{admin.userAddress.slice(-8)}
                                    </TableCell>
                                    <TableCell>{getRoleBadge(admin.role)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {roleMapping[admin.role]?.permissions.slice(0, 2).map((permission) => (
                                                <Badge key={permission} variant="outline" className="text-xs">
                                                    {permission}
                                                </Badge>
                                            ))}
                                            {roleMapping[admin.role]?.permissions.length > 2 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{roleMapping[admin.role].permissions.length - 2} more
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(admin.status)}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(admin.createdAt).toISOString().split("T")[0]}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleStatus(admin._id, admin.status)}
                                                disabled={roleMapping[admin.role]?.name === "Super Admin"}
                                            >
                                                <Key className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveAdmin(admin._id)}
                                                disabled={roleMapping[admin.role]?.name === "Super Admin"}
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
    )
}