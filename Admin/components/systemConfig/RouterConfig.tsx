// components/system-config/RouterConfig.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RefreshCw, CheckCircle, AlertTriangle } from "lucide-react"
import { InputWithButton } from "./InputWithButton"

interface RouterConfigProps {
    isConnected: boolean
    loading: string | null
    handleConfigAction: (actionName: string, params: any) => void
}

export function RouterConfig({ isConnected, loading, handleConfigAction }: RouterConfigProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Router Settings</CardTitle>
                    <CardDescription>Configure router parameters and emergency controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <InputWithButton
                        label="Cooldown Period (seconds)"
                        placeholder="3600"
                        actionName="setCooldownPeriod"
                        type="number"
                        isConnected={isConnected}
                        loading={loading}
                        handleConfigAction={handleConfigAction}
                    />
                    <div className="space-y-2">
                        <Label>Emergency Stop</Label>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => handleConfigAction("setEmergencyStop", { stop: false })}
                                disabled={loading !== null || !isConnected}
                                variant="outline"
                                className="flex-1 gap-2"
                            >
                                {loading === "setEmergencyStop" ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="h-4 w-4" />
                                )}
                                Normal Operation
                            </Button>
                            <Button
                                onClick={() => handleConfigAction("setEmergencyStop", { stop: true })}
                                disabled={loading !== null || !isConnected}
                                variant="destructive"
                                className="flex-1 gap-2"
                            >
                                {loading === "setEmergencyStop" ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4" />
                                )}
                                Emergency Stop
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}