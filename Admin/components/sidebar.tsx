"use client"

import { useState } from "react"
import { cn } from "@/lib/utils/utils"
import { Button } from "@/components/ui/button"
import { EnhancedWalletConnect } from "@/components/enhanced-wallet-connect"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  LayoutDashboard,
  Settings,
  Users,
  History,
  Waves,
  Shield,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "dashboard", icon: LayoutDashboard },
  { name: "System Config", href: "config", icon: Settings },
  { name: "Fee Management", href: "fees", icon: DollarSign },
  { name: "User Management", href: "users", icon: Users },
  { name: "Admin Management", href: "admins", icon: Shield },
  { name: "Transaction History", href: "transactions", icon: History },
  { name: "Pool Management", href: "pools", icon: Waves },
]

interface SidebarProps {
  className?: string
  activeSection: string
  onSectionChange: (section: string) => void
}

export function Sidebar({ className, activeSection, onSectionChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-80", // Increased width to accommodate vertical wallet layout
        className,
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && <h1 className="text-xl font-bold text-sidebar-foreground">DeFi Admin</h1>}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <Button
            key={item.name}
            variant={activeSection === item.href ? "default" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 text-sidebar-foreground",
              activeSection === item.href && "bg-sidebar-primary text-sidebar-primary-foreground",
              activeSection !== item.href && "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "px-2",
            )}
            onClick={() => onSectionChange(item.href)}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </Button>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        {!collapsed && (
          <>
            <EnhancedWalletConnect />
            <div className="flex justify-center">
              <ThemeToggle />
            </div>
          </>
        )}
        {collapsed && (
          <div className="flex flex-col items-center gap-2">
            <ThemeToggle />
          </div>
        )}
      </div>
    </div>
  )
}
