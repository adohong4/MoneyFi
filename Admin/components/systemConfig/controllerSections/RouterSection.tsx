// components/system-config/controller-sections/RouterSection.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputWithButton } from "../InputWithButton"

interface RouterSectionProps {
    isConnected: boolean
    loading: string | null
    handleConfigAction: (actionName: string, params: any) => void
}

export function RouterSection({ isConnected, loading, handleConfigAction }: RouterSectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Router Configuration</CardTitle>
                <CardDescription>Configure router addresses and cross-chain settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <InputWithButton
                    label="Router Address"
                    placeholder="0x..."
                    actionName="setRouter"
                    isConnected={isConnected}
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
                <InputWithButton
                    label="Cross Chain Router"
                    placeholder="0x..."
                    actionName="setCrossChainRouter"
                    isConnected={isConnected}
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
                <InputWithButton
                    label="Hot Wallet Address"
                    placeholder="0x..."
                    actionName="setHotWallet"
                    isConnected={isConnected}
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
                <InputWithButton
                    label="Average System Action Fee (ETH)"
                    placeholder="0.001"
                    actionName="setAverageSystemActionFee"
                    type="number"
                    step="0.0001"
                    isConnected={isConnected}
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
            </CardContent>
        </Card>
    )
}