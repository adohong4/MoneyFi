// components/system-config/controller-sections/AdminSection.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, CheckCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useWeb3 } from "@/components/web3-provider"
import { ControllerContract } from "@/services/contracts/controllerContract" // Adjust path as needed
import { AdminAPI, AdminInput } from "@/services/apis/admin.api" // Adjust path as needed
import { ROLE } from "@/lib/web3/config" // Adjust path as needed

interface AdminSectionProps {
    isConnected: boolean
    loading: string | null
}

export function AdminSection({ isConnected, loading: externalLoading }: AdminSectionProps) {
    const { toast } = useToast()
    const { provider } = useWeb3()
    const [userAddress, setUserAddress] = useState("")
    const [selectedRole, setSelectedRole] = useState("")
    const [localLoading, setLocalLoading] = useState<string | null>(null)

    const controllerContract = new ControllerContract(provider ?? undefined)
    const adminAPI = new AdminAPI()

    // Handle grant role transaction and API call
    const handleGrantRole = async () => {
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

        setLocalLoading("grantRole")
        try {
            // Execute the grantRole transaction
            const tx = await controllerContract.setGrantRole(userAddress, selectedRole)
            await tx.wait()

            toast({
                title: "Transaction Successful",
                description: `Role ${selectedRole} granted to ${userAddress}.`,
            })

            // Call the createAdmin API
            const adminInput: AdminInput = { userAddress, role: selectedRole }
            await adminAPI.createAdmin(adminInput)

            toast({
                title: "Admin Created",
                description: `Admin role successfully recorded for ${userAddress}.`,
            })

            // Reset inputs
            setUserAddress("")
            setSelectedRole("")
        } catch (error) {
            console.error("Error granting role or creating admin:", error)
            toast({
                title: "Operation Failed",
                description: "Failed to grant role or create admin. Please try again.",
                variant: "destructive",
            })
        } finally {
            setLocalLoading(null)
        }
    }

    // Handle pause/unpause actions
    const handleEmergencyAction = async (action: "pause" | "unpause") => {
        if (!isConnected) {
            toast({
                title: "Wallet Not Connected",
                description: "Please connect your wallet to perform this action.",
                variant: "destructive",
            })
            return
        }

        setLocalLoading(action)
        try {
            const contract = await controllerContract.getControllerContract()
            const tx = await (action === "pause" ? contract.pause() : contract.unpause())
            await tx.wait()

            toast({
                title: "Transaction Successful",
                description: `${action.charAt(0).toUpperCase() + action.slice(1)} executed successfully.`,
            })
        } catch (error) {
            console.error(`Error executing ${action}:`, error)
            toast({
                title: "Transaction Failed",
                description: `Failed to execute ${action}. Please try again.`,
                variant: "destructive",
            })
        } finally {
            setLocalLoading(null)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Admin Functions</CardTitle>
                <CardDescription>Administrative controls and role management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Role Selection and Address Input */}
                <div className="space-y-2">
                    <Label>Grant Role</Label>
                    <div className="space-y-2">
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ROLE.ADMIN_ROLE}>Admin Role</SelectItem>
                                <SelectItem value={ROLE.ADMIN_DELEGATE_ROLE}>Admin Delegate Role</SelectItem>
                                <SelectItem value={ROLE.OPERATOR_ROLE}>Operator Role</SelectItem>
                                <SelectItem value={ROLE.SIGNER_ROLE}>Signer Role</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder="Enter user address (0x...)"
                            value={userAddress}
                            onChange={(e) => setUserAddress(e.target.value)}
                        />
                        <Button
                            onClick={handleGrantRole}
                            disabled={localLoading !== null || !isConnected || !userAddress || !selectedRole}
                            className="w-full gap-2"
                        >
                            {localLoading === "grantRole" ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle className="h-4 w-4" />
                            )}
                            Grant Role
                        </Button>
                    </div>
                </div>

                {/* Emergency Controls */}
                {/* <div className="space-y-2">
                    <Label>Emergency Controls</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            onClick={() => handleEmergencyAction("pause")}
                            disabled={localLoading !== null || !isConnected}
                            variant="destructive"
                            className="gap-2"
                        >
                            {localLoading === "pause" ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <AlertTriangle className="h-4 w-4" />
                            )}
                            Pause
                        </Button>
                        <Button
                            onClick={() => handleEmergencyAction("unpause")}
                            disabled={localLoading !== null || !isConnected}
                            variant="outline"
                            className="gap-2"
                        >
                            {localLoading === "unpause" ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle className="h-4 w-4" />
                            )}
                            Unpause
                        </Button>
                    </div>
                </div> */}
            </CardContent>
        </Card>
    )
}