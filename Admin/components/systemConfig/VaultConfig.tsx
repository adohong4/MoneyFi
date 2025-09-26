// components/system-config/VaultConfig.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, RefreshCw } from "lucide-react"
import { InputWithButton } from "./InputWithButton"

interface VaultConfigProps {
    isConnected: boolean
    loading: string | null
    handleConfigAction: (actionName: string, params: any) => void
}

export function VaultConfig({ isConnected, loading, handleConfigAction }: VaultConfigProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Vault Settings</CardTitle>
                    <CardDescription>Configure fund vault parameters and fee destinations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <InputWithButton
                        label="Controller Address"
                        placeholder="0x..."
                        actionName="setController"
                        isConnected={isConnected}
                        loading={loading}
                        handleConfigAction={handleConfigAction}
                    />
                    <InputWithButton
                        label="Fee To Address"
                        placeholder="0x..."
                        actionName="setFeeTo"
                        isConnected={isConnected}
                        loading={loading}
                        handleConfigAction={handleConfigAction}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Fee Withdrawal</CardTitle>
                    <CardDescription>Withdraw accumulated fees from the vault</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button
                        onClick={() => handleConfigAction("withdrawProtocolFee", {})}
                        disabled={loading !== null || !isConnected}
                        variant="outline"
                        className="w-full gap-2"
                    >
                        {loading === "withdrawProtocolFee" ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <Wallet className="h-4 w-4" />
                        )}
                        Withdraw Protocol Fee
                    </Button>
                    <Button
                        onClick={() => handleConfigAction("withdrawDistributeFee", {})}
                        disabled={loading !== null || !isConnected}
                        variant="outline"
                        className="w-full gap-2"
                    >
                        {loading === "withdrawDistributeFee" ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <Wallet className="h-4 w-4" />
                        )}
                        Withdraw Distribute Fee
                    </Button>
                    <Button
                        onClick={() => handleConfigAction("withdrawRebalanceFee", {})}
                        disabled={loading !== null || !isConnected}
                        variant="outline"
                        className="w-full gap-2"
                    >
                        {loading === "withdrawRebalanceFee" ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <Wallet className="h-4 w-4" />
                        )}
                        Withdraw Rebalance Fee
                    </Button>
                    <Button
                        onClick={() => handleConfigAction("withdrawReferralFee", {})}
                        disabled={loading !== null || !isConnected}
                        variant="outline"
                        className="w-full gap-2"
                    >
                        {loading === "withdrawReferralFee" ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <Wallet className="h-4 w-4" />
                        )}
                        Withdraw Referral Fee
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}