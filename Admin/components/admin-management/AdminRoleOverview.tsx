import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { AdminData } from "@/services/apis/admin.api"
import { roleMapping } from "@/lib/utils/permissions.utils"

interface AdminRoleOverviewProps {
    admins: AdminData[]
}

export function AdminRoleOverview({ admins }: AdminRoleOverviewProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Super Admins</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {admins.filter((a) => roleMapping[a.role]?.name === "Super Admin").length}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Delegate Admins</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {admins.filter((a) => roleMapping[a.role]?.name === "Delegate Admin").length}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Operators</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {admins.filter((a) => roleMapping[a.role]?.name === "Operator").length}
                    </div>
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
    )
}