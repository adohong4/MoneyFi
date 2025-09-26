// components/system-config/controller-sections/TokenSection.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, CheckCircle } from "lucide-react"

interface TokenSectionProps {
    isConnected: boolean
    loading: string | null
    handleConfigAction: (actionName: string, params: any) => void
}

export function TokenSection({ isConnected, loading, handleConfigAction }: TokenSectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Token Configuration</CardTitle>
                <CardDescription>Manage supported tokens and their parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Token Address & Type</Label>
                    <div className="flex gap-2">
                        <Input placeholder="0x..." className="flex-1" id="tokenAddress" />
                        <Select>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="internal">Internal</SelectItem>
                                <SelectItem value="external">External</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={() => handleConfigAction("setInternalToken", { token: "0x...", isInternal: true })}
                            disabled={loading !== null || !isConnected}
                            className="gap-2"
                        >
                            {loading === "setInternalToken" ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle className="h-4 w-4" />
                            )}
                            Set
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Token Info (JSON)</Label>
                    <div className="flex gap-2">
                        <Textarea
                            placeholder='{"symbol": "USDC", "decimals": 6, "active": true}'
                            rows={3}
                            className="flex-1"
                            id="tokenInfo"
                        />
                        <Button
                            onClick={() => handleConfigAction("setTokenInfo", { address: "0x...", info: "{}" })}
                            disabled={loading !== null || !isConnected}
                            className="gap-2 self-end"
                        >
                            {loading === "setTokenInfo" ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle className="h-4 w-4" />
                            )}
                            Set
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}