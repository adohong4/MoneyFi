import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useWeb3 } from "@/components/web3-provider"
import { ControllerContract } from "@/services/contracts/controllerContract"
import { AdminAPI, AdminInput } from "@/services/apis/admin.api"
import { ROLE } from "@/lib/web3/config"
import { roleMapping } from "@/lib/utils/permissions.utils"

interface AdminAddDialogProps {
    open: boolean
    setOpen: (open: boolean) => void
    onAdminAdded: () => Promise<void>
}

export function AdminAddDialog({ open, setOpen, onAdminAdded }: AdminAddDialogProps) {
    const { toast } = useToast()
    const { provider, isConnected } = useWeb3()
    const [userAddress, setUserAddress] = useState("")
    const [selectedRole, setSelectedRole] = useState("")
    const [loading, setLoading] = useState<string | null>(null)

    const controllerContract = new ControllerContract(provider ?? undefined)
    const adminAPI = new AdminAPI()

    const handleAddAdmin = async () => {
        if (!isConnected) {
            toast({
                title: "Wallet Not Connected",
                description: "Please connect your wallet to perform this action.",
                variant: "destructive",
            })
            return
        }

        if (!userAddress || !selectedRole) {
            toast({
                title: "Invalid Input",
                description: "Please provide both a user address and a role.",
                variant: "destructive",
            })
            return
        }

        setLoading("grantRole")
        try {
            // Gọi contract để cấp quyền
            const tx = await controllerContract.setGrantRole(userAddress, selectedRole)
            await tx.wait()

            toast({
                title: "Transaction Successful",
                description: `Role ${roleMapping[selectedRole]?.name || "Unknown"} granted to ${userAddress}.`,
            })

            // Gọi API để lưu admin
            const adminInput: AdminInput = { userAddress, role: selectedRole }
            await adminAPI.createAdmin(adminInput)

            toast({
                title: "Admin Created",
                description: `Admin role successfully recorded for ${userAddress}.`,
            })

            // Làm mới danh sách admin
            await onAdminAdded()

            // Reset form
            setUserAddress("")
            setSelectedRole("")
            setOpen(false)
        } catch (error) {
            console.error("Error granting role or creating admin:", error)
            toast({
                title: "Operation Failed",
                description: "Failed to grant role or create admin. Please try again.",
                variant: "destructive",
            })
        } finally {
            setLoading(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                            value={userAddress}
                            onChange={(e) => setUserAddress(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="adminRole">Role *</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ROLE.ADMIN_DELEGATE_ROLE}>Delegate Admin</SelectItem>
                                <SelectItem value={ROLE.OPERATOR_ROLE}>Operator</SelectItem>
                                <SelectItem value={ROLE.SIGNER_ROLE}>Signer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedRole && (
                        <div className="space-y-2">
                            <Label>Permissions for {roleMapping[selectedRole]?.name || "Role"}</Label>
                            <div className="flex flex-wrap gap-2">
                                {roleMapping[selectedRole]?.permissions.map((permission) => (
                                    <Badge key={permission} variant="outline">
                                        {permission}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddAdmin}
                            disabled={loading !== null || !isConnected || !userAddress || !selectedRole}
                        >
                            {loading === "grantRole" ? (
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            Add Admin
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}