// components/system-config/SwapConfig.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputWithButton } from "./InputWithButton"

interface SwapConfigProps {
    isConnected: boolean
    loading: string | null
    handleConfigAction: (actionName: string, params: any) => void
}

export function SwapConfig({ isConnected, loading, handleConfigAction }: SwapConfigProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Uniswap Configuration</CardTitle>
                    <CardDescription>Configure Uniswap router and factory addresses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <InputWithButton
                        label="Router V3 Address"
                        placeholder="0x..."
                        actionName="setRouterV3"
                        isConnected={isConnected}
                        loading={loading}
                        handleConfigAction={handleConfigAction}
                    />
                    <InputWithButton
                        label="Router V2 Address"
                        placeholder="0x..."
                        actionName="setRouterV2"
                        isConnected={isConnected}
                        loading={loading}
                        handleConfigAction={handleConfigAction}
                    />
                    <InputWithButton
                        label="Factory V3 Address"
                        placeholder="0x..."
                        actionName="setFactoryV3"
                        isConnected={isConnected}
                        loading={loading}
                        handleConfigAction={handleConfigAction}
                    />
                    <InputWithButton
                        label="Factory V2 Address"
                        placeholder="0x..."
                        actionName="setFactoryV2"
                        isConnected={isConnected}
                        loading={loading}
                        handleConfigAction={handleConfigAction}
                    />
                    <InputWithButton
                        label="Pool Fee (basis points)"
                        placeholder="3000"
                        actionName="setPoolFee"
                        type="number"
                        isConnected={isConnected}
                        loading={loading}
                        handleConfigAction={handleConfigAction}
                    />
                </CardContent>
            </Card>
        </div>
    )
}