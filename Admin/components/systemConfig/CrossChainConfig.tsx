// components/system-config/CrossChainConfig.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputWithButton } from "./InputWithButton"

interface CrossChainConfigProps {
    isConnected: boolean
    loading: string | null
    handleConfigAction: (actionName: string, params: any) => void
}

export function CrossChainConfig({ isConnected, loading, handleConfigAction }: CrossChainConfigProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Stargate Configuration</CardTitle>
                    <CardDescription>Configure cross-chain bridge settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <InputWithButton
                        label="Stargate Endpoint ID"
                        placeholder="101"
                        actionName="setStargateEndpoint"
                        type="number"
                        isConnected={isConnected}
                        loading={loading}
                        handleConfigAction={handleConfigAction}
                    />
                    <InputWithButton
                        label="Stargate Pool Token"
                        placeholder="0x..."
                        actionName="setStargatePool"
                        isConnected={isConnected}
                        loading={loading}
                        handleConfigAction={handleConfigAction}
                    />
                    <InputWithButton
                        label="LayerZero Endpoint"
                        placeholder="0x..."
                        actionName="setLzEndpoint"
                        isConnected={isConnected}
                        loading={loading}
                        handleConfigAction={handleConfigAction}
                    />
                    <InputWithButton
                        label="Whitelist Hot Wallet"
                        placeholder="0x..."
                        actionName="setWhitelistHotWallet"
                        isConnected={isConnected}
                        loading={loading}
                        handleConfigAction={handleConfigAction}
                    />
                </CardContent>
            </Card>
        </div>
    )
}