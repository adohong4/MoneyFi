// components/system-config/controller-sections/CheckSection.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye } from "lucide-react"
import { CheckFunction } from "../CheckFunction"

interface CheckSectionProps {
    isConnected: boolean
    loading: string | null
    handleConfigAction: (actionName: string, params: any) => void
}

export function CheckSection({ isConnected, loading, handleConfigAction }: CheckSectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Check Functions
                </CardTitle>
                <CardDescription>View current system states and configurations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <CheckFunction
                    label="Is Strategy Active"
                    actionName="isStrategy"
                    mockValue="true"
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
                <CheckFunction
                    label="Is Internal Token"
                    actionName="isInternalToken"
                    mockValue="false"
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
                <CheckFunction
                    label="Protocol Fee"
                    actionName="getProtocolFee"
                    mockValue="0.3%"
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
                <CheckFunction
                    label="Referral Fee"
                    actionName="getReferralFee"
                    mockValue="0.1%"
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
                <CheckFunction
                    label="Max Percent Liquidity"
                    actionName="getMaxPercentLiquidity"
                    mockValue="80%"
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
                <CheckFunction
                    label="Max Deposit Value"
                    actionName="getMaxDepositValue"
                    mockValue="$1,000,000"
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
                <CheckFunction
                    label="Current Router"
                    actionName="getRouter"
                    mockValue="0x1234...5678"
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
                <CheckFunction
                    label="Hot Wallet"
                    actionName="getHotWallet"
                    mockValue="0xabcd...efgh"
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
            </CardContent>
        </Card>
    )
}