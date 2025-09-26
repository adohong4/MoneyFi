// components/system-config/InputWithButton.tsx
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, Wallet } from "lucide-react"

interface InputWithButtonProps {
    label: string
    placeholder: string
    actionName: string
    type?: string
    step?: string
    min?: string
    max?: string
    isConnected: boolean
    loading: string | null
    handleConfigAction: (actionName: string, params: any) => void
}

export function InputWithButton({
    label,
    placeholder,
    actionName,
    type = "text",
    step,
    min,
    max,
    isConnected,
    loading,
    handleConfigAction,
}: InputWithButtonProps) {
    const [value, setValue] = useState("")

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex gap-2">
                <Input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    step={step}
                    min={min}
                    max={max}
                    className="flex-1"
                />
                <Button
                    onClick={() => handleConfigAction(actionName, { value })}
                    disabled={loading !== null || !isConnected || !value}
                    className="gap-2 whitespace-nowrap"
                >
                    {loading === actionName ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                    Set
                </Button>
            </div>
        </div>
    )
}