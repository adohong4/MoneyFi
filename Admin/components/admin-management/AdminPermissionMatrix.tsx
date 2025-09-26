import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import {
    admin_permissions,
    operator_permissions,
    delegate_admin_permissions,
    signer_permissions,
} from "@/lib/web3/type/permissions"
import { roleMapping } from "@/lib/utils/permissions.utils"

const rolePermissions = {
    "Super Admin": admin_permissions,
    "Delegate Admin": delegate_admin_permissions,
    Operator: operator_permissions,
    Signer: signer_permissions,
}

export function AdminPermissionMatrix() {
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

    return (
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
                                    {getRoleBadge(
                                        Object.keys(roleMapping).find((key) => roleMapping[key].name === role) || "",
                                    )}
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
    )
}