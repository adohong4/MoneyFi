// components/system-config/controller-sections/ProtocolSection.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Settings, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { InputWithButton } from "../InputWithButton"

interface ProtocolSectionProps {
    isConnected: boolean
    loading: string | null
    handleConfigAction: (actionName: string, params: any) => void
}

export function ProtocolSection({ isConnected, loading, handleConfigAction }: ProtocolSectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Protocol Fee Settings
                </CardTitle>
                <CardDescription>Configure protocol fees and referral settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <InputWithButton
                    label="Protocol Fee (%)"
                    placeholder="0.3"
                    actionName="setProtocolFee"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    isConnected={isConnected}
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
                <InputWithButton
                    label="Referral Fee (%)"
                    placeholder="0.1"
                    actionName="setReferralFee"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    isConnected={isConnected}
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
                <div className="space-y-2">
                    <Label>Enable Referral Signature</Label>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => handleConfigAction("setEnableReferralSignature", { enabled: true })}
                            disabled={loading !== null || !isConnected}
                            variant="outline"
                            className="flex-1 gap-2"
                        >
                            {loading === "setEnableReferralSignature" ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle className="h-4 w-4" />
                            )}
                            Enable
                        </Button>
                        <Button
                            onClick={() => handleConfigAction("setEnableReferralSignature", { enabled: false })}
                            disabled={loading !== null || !isConnected}
                            variant="outline"
                            className="flex-1 gap-2"
                        >
                            {loading === "setEnableReferralSignature" ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <XCircle className="h-4 w-4" />
                            )}
                            Disable
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}