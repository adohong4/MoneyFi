// components/system-config/Header.tsx
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Wallet } from "lucide-react"

interface HeaderProps {
    isConnected: boolean
}

export function Header({ isConnected }: HeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-balance">System Configuration</h1>
                <p className="text-muted-foreground">Manage smart contract parameters and system settings</p>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    Admin Only
                </Badge>
                {!isConnected && (
                    <Badge variant="destructive" className="gap-1">
                        <Wallet className="h-3 w-3" />
                        Wallet Required
                    </Badge>
                )}
            </div>
        </div>
    )
}