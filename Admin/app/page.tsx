"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { SystemConfig } from "@/components/system-config"
import { FeeManagement } from "@/components/fee-management" // Added fee management import
// import { UserManagement } from "@/components/user-management"
import { AdminManagement } from "@/components/admin-management"
// import { TransactionHistory } from "@/components/transaction-history"
// import { PoolManagement } from "@/components/pool-management"
import { TransactionHistory } from "@/components/transactions/TransactionHistory"
import { PoolManagement } from "@/components/pool/PoolManagement"
import { UserManagement } from "@/components/user/UserManagement"

export default function HomePage() {
  const [activeSection, setActiveSection] = useState("dashboard")

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />
      case "config":
        return <SystemConfig />
      case "fees": // Added fee management case
        return <FeeManagement />
      case "users":
        return <UserManagement />
      case "admins":
        return <AdminManagement />
      case "transactions":
        return <TransactionHistory />
      case "pools":
        return <PoolManagement />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 overflow-auto">{renderContent()}</main>
    </div>
  )
}
