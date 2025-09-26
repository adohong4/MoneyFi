// components/system-config/CheckFunction.tsx
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, RefreshCw } from "lucide-react"

interface CheckFunctionProps {
    label: string
    actionName: string
    mockValue: any
    loading: string | null
    handleConfigAction: (actionName: string, params: any) => void
}

export function CheckFunction({ label, actionName, mockValue, loading, handleConfigAction }: CheckFunctionProps) {
    return (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">{label}</span>
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                    <Eye className="h-3 w-3" />
                    {mockValue}
                </Badge>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConfigAction(actionName, {})}
                    disabled={loading !== null}
                    className="gap-1"
                >
                    {loading === actionName ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Eye className="h-3 w-3" />}
                    Check
                </Button>
            </div>
        </div>
    )
}