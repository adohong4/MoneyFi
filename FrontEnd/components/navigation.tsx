"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { User, Trophy, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: Home,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: User,
    },
    {
      href: "/ranking",
      label: "Ranking",
      icon: Trophy,
    },
  ]

  return (
    <nav className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Button
              key={item.href}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              asChild
              className={cn("flex items-center gap-2", isActive && "bg-primary text-primary-foreground")}
            >
              <Link href={item.href}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            </Button>
          )
        })}
      </div>
      <ThemeToggle />
    </nav>
  )
}
