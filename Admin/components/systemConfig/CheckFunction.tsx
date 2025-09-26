// components/system-config/CheckFunction.tsx
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, Eye } from "lucide-react"

interface CheckFunctionProps {
    label: string
    actionName: string
    inputType?: "single" | "double"
    inputPlaceholder?: string
    inputKey?: string
    inputPlaceholder1?: string
    inputKey1?: string
    inputPlaceholder2?: string
    inputKey2?: string
    loading: string | null
    handleConfigAction: (actionName: string, params: any) => Promise<string | undefined>
}

export function CheckFunction({
    label,
    actionName,
    inputType,
    inputPlaceholder,
    inputKey,
    inputPlaceholder1,
    inputKey1,
    inputPlaceholder2,
    inputKey2,
    loading,
    handleConfigAction,
}: CheckFunctionProps) {
    const [input1, setInput1] = useState("")
    const [input2, setInput2] = useState("")

    const handleCheckClick = async () => {
        const params: any = {}
        if (inputType === "single" && inputKey) {
            params[inputKey] = input1
        } else if (inputType === "double" && inputKey1 && inputKey2) {
            params[inputKey1] = input1
            params[inputKey2] = input2
        }

        const result = await handleConfigAction(actionName, params)
        if (result) {
            setInput1("")
            setInput2("")
        }
    }

    return (
        <div className="p-3 bg-muted/50 rounded-lg">
            {inputType === "double" ? (
                // Bố cục dọc cho hai input
                <div className="space-y-2">
                    <Label>{label}</Label>
                    <Input
                        placeholder={inputPlaceholder1}
                        value={input1}
                        onChange={(e) => setInput1(e.target.value)}
                        className="w-full"
                    />
                    <Input
                        placeholder={inputPlaceholder2}
                        value={input2}
                        onChange={(e) => setInput2(e.target.value)}
                        className="w-full"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCheckClick}
                        disabled={loading === actionName}
                        className="w-full gap-1"
                    >
                        {loading === actionName ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Eye className="h-3 w-3" />}
                        Kiểm tra
                    </Button>
                </div>
            ) : (
                // Bố cục cho không input hoặc một input
                <div>
                    <Label>{label}</Label>
                    <div className="flex items-center gap-2 mt-1">
                        {inputType === "single" && (
                            <Input
                                placeholder={inputPlaceholder}
                                value={input1}
                                onChange={(e) => setInput1(e.target.value)}
                                className="w-80" // Tăng chiều rộng từ w-48 thành w-80
                            />
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCheckClick}
                            disabled={loading === actionName}
                            className="gap-1"
                        >
                            {loading === actionName ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Eye className="h-3 w-3" />}
                            Kiểm tra
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}