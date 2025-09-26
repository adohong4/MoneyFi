// components/system-config/controller-sections/StrategySection.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputWithButton } from "../InputWithButton"

interface StrategySectionProps {
    isConnected: boolean
    loading: string | null
    handleConfigAction: (actionName: string, params: any) => void
}

export function StrategySection({ isConnected, loading, handleConfigAction }: StrategySectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Strategy Configuration</CardTitle>
                <CardDescription>Configure investment strategies and parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <InputWithButton
                    label="Strategy Address"
                    placeholder="0x..."
                    actionName="setStrategy"
                    isConnected={isConnected}
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
                <InputWithButton
                    label="Max Percent Liquidity (%)"
                    placeholder="80"
                    actionName="setMaxPercentLiquidity"
                    type="number"
                    min="0"
                    max="100"
                    isConnected={isConnected}
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
                <InputWithButton
                    label="Max Deposit Value (USD)"
                    placeholder="1000000"
                    actionName="setMaxDepositValue"
                    type="number"
                    isConnected={isConnected}
                    loading={loading}
                    handleConfigAction={handleConfigAction}
                />
            </CardContent>
        </Card>
    )
}