"use client"

import { useState, useEffect } from "react"
import { AdminAPI, AdminData } from "@/services/apis/admin.api"
import { useToast } from "@/hooks/use-toast"
import { AdminHeader } from "./AdminHeader"
import { AdminAddDialog } from "./AdminAddDialog"
import { AdminRoleOverview } from "./AdminRoleOverview"
import { AdminList } from "./AdminList"
import { AdminPermissionMatrix } from "./AdminPermissionMatrix"

export function AdminManagement() {
    const { toast } = useToast()
    const [admins, setAdmins] = useState<AdminData[]>([])
    const [showAddDialog, setShowAddDialog] = useState(false)
    const adminApi = new AdminAPI()

    useEffect(() => {
        const fetchAdmins = async () => {
            try {
                const adminData = await adminApi.GetAllAdmin()
                setAdmins(adminData)
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch admins.",
                    variant: "destructive",
                })
            }
        }
        fetchAdmins()
    }, [])

    const handleAdminStatusChange = async () => {
        try {
            const adminData = await adminApi.GetAllAdmin()
            setAdmins(adminData)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to refresh admin list.",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="p-6 space-y-6">
            <AdminHeader activeAdmins={admins.filter((a) => a.status === "active").length} setShowAddDialog={setShowAddDialog} />
            <AdminAddDialog open={showAddDialog} setOpen={setShowAddDialog} onAdminAdded={handleAdminStatusChange} />
            <AdminRoleOverview admins={admins} />
            <AdminList admins={admins} onStatusChange={handleAdminStatusChange} />
            <AdminPermissionMatrix />
        </div>
    )
}