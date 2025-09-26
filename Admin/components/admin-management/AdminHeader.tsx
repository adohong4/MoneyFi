import { Shield, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface AdminHeaderProps {
    activeAdmins: number
    setShowAddDialog: (open: boolean) => void
}

export function AdminHeader({ activeAdmins, setShowAddDialog }: AdminHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-balance">Admin Management</h1>
                <p className="text-muted-foreground">Manage administrator accounts and permissions</p>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                    <Shield className="h-3 w-3" />
                    {activeAdmins} Active Admins
                </Badge>
                <Button onClick={() => setShowAddDialog(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Admin
                </Button>
            </div>
        </div>
    )
}