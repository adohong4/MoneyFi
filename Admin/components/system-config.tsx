"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, RefreshCw, AlertTriangle, Wallet, Eye, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useWeb3 } from "@/components/web3-provider"

export function SystemConfig() {
  const { toast } = useToast()
  const { isConnected, signer } = useWeb3()
  const [loading, setLoading] = useState<string | null>(null)
  const [controllerSection, setControllerSection] = useState("protocol")

  const handleConfigAction = async (actionName: string, params: any) => {
    if (!isConnected || !signer) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to perform this action.",
        variant: "destructive",
      })
      return
    }

    setLoading(actionName)
    try {
      console.log(`[v0] Executing ${actionName} with params:`, params)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Transaction Successful",
        description: `${actionName} has been executed successfully.`,
      })
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: `Failed to execute ${actionName}. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const InputWithButton = ({
    label,
    placeholder,
    actionName,
    type = "text",
    step,
    min,
    max,
  }: {
    label: string
    placeholder: string
    actionName: string
    type?: string
    step?: string
    min?: string
    max?: string
  }) => {
    const [value, setValue] = useState("")

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            step={step}
            min={min}
            max={max}
            className="flex-1"
          />
          <Button
            onClick={() => handleConfigAction(actionName, { value })}
            disabled={loading !== null || !isConnected || !value}
            className="gap-2 whitespace-nowrap"
          >
            {loading === actionName ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
            Set
          </Button>
        </div>
      </div>
    )
  }

  const CheckFunction = ({ label, actionName, mockValue }: { label: string; actionName: string; mockValue: any }) => (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1">
          <Eye className="h-3 w-3" />
          {mockValue}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleConfigAction(actionName, {})}
          disabled={loading !== null}
          className="gap-1"
        >
          {loading === actionName ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Eye className="h-3 w-3" />}
          Check
        </Button>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">System Configuration</h1>
          <p className="text-muted-foreground">Manage smart contract parameters and system settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <AlertTriangle className="h-3 w-3 text-yellow-500" />
            Admin Only
          </Badge>
          {!isConnected && (
            <Badge variant="destructive" className="gap-1">
              <Wallet className="h-3 w-3" />
              Wallet Required
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="controller" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="controller">Controller</TabsTrigger>
          <TabsTrigger value="vault">Fund Vault</TabsTrigger>
          <TabsTrigger value="router">Router</TabsTrigger>
          <TabsTrigger value="swap">Swap</TabsTrigger>
          <TabsTrigger value="crosschain">Cross Chain</TabsTrigger>
        </TabsList>

        {/* MoneyFiController Configuration */}
        <TabsContent value="controller" className="space-y-6">
          <div className="bg-muted/30 p-1 rounded-lg">
            <div className="grid grid-cols-6 gap-1">
              {[
                { id: "protocol", label: "Protocol" },
                { id: "token", label: "Token" },
                { id: "strategy", label: "Strategy" },
                { id: "router", label: "Router" },
                { id: "check", label: "Check Functions" },
                { id: "admin", label: "Admin" },
              ].map((section) => (
                <Button
                  key={section.id}
                  variant={controllerSection === section.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setControllerSection(section.id)}
                  className="text-xs"
                >
                  {section.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Protocol Fee Section */}
          {controllerSection === "protocol" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  />
                  <InputWithButton
                    label="Referral Fee (%)"
                    placeholder="0.1"
                    actionName="setReferralFee"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
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
            </div>
          )}

          {/* Token Configuration Section */}
          {controllerSection === "token" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                          <Wallet className="h-4 w-4" />
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
                          <Wallet className="h-4 w-4" />
                        )}
                        Set
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Strategy Configuration Section */}
          {controllerSection === "strategy" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Strategy Configuration</CardTitle>
                  <CardDescription>Configure investment strategies and parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InputWithButton label="Strategy Address" placeholder="0x..." actionName="setStrategy" />
                  <InputWithButton
                    label="Max Percent Liquidity (%)"
                    placeholder="80"
                    actionName="setMaxPercentLiquidity"
                    type="number"
                    min="0"
                    max="100"
                  />
                  <InputWithButton
                    label="Max Deposit Value (USD)"
                    placeholder="1000000"
                    actionName="setMaxDepositValue"
                    type="number"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Router Configuration Section */}
          {controllerSection === "router" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Router Configuration</CardTitle>
                  <CardDescription>Configure router addresses and cross-chain settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InputWithButton label="Router Address" placeholder="0x..." actionName="setRouter" />
                  <InputWithButton label="Cross Chain Router" placeholder="0x..." actionName="setCrossChainRouter" />
                  <InputWithButton label="Hot Wallet Address" placeholder="0x..." actionName="setHotWallet" />
                  <InputWithButton
                    label="Average System Action Fee (ETH)"
                    placeholder="0.001"
                    actionName="setAverageSystemActionFee"
                    type="number"
                    step="0.0001"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {controllerSection === "check" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Check Functions
                  </CardTitle>
                  <CardDescription>View current system states and configurations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CheckFunction label="Is Strategy Active" actionName="isStrategy" mockValue="true" />
                  <CheckFunction label="Is Internal Token" actionName="isInternalToken" mockValue="false" />
                  <CheckFunction label="Protocol Fee" actionName="getProtocolFee" mockValue="0.3%" />
                  <CheckFunction label="Referral Fee" actionName="getReferralFee" mockValue="0.1%" />
                  <CheckFunction label="Max Percent Liquidity" actionName="getMaxPercentLiquidity" mockValue="80%" />
                  <CheckFunction label="Max Deposit Value" actionName="getMaxDepositValue" mockValue="$1,000,000" />
                  <CheckFunction label="Current Router" actionName="getRouter" mockValue="0x1234...5678" />
                  <CheckFunction label="Hot Wallet" actionName="getHotWallet" mockValue="0xabcd...efgh" />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Admin Functions Section */}
          {controllerSection === "admin" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Functions</CardTitle>
                  <CardDescription>Administrative controls and emergency functions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InputWithButton label="New Owner Address" placeholder="0x..." actionName="transferOwnership" />
                  <div className="space-y-2">
                    <Label>Emergency Controls</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => handleConfigAction("pause", {})}
                        disabled={loading !== null || !isConnected}
                        variant="destructive"
                        className="gap-2"
                      >
                        {loading === "pause" ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        Pause
                      </Button>
                      <Button
                        onClick={() => handleConfigAction("unpause", {})}
                        disabled={loading !== null || !isConnected}
                        variant="outline"
                        className="gap-2"
                      >
                        {loading === "unpause" ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Unpause
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Fund Vault Configuration */}
        <TabsContent value="vault" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Vault Settings</CardTitle>
                <CardDescription>Configure fund vault parameters and fee destinations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputWithButton label="Controller Address" placeholder="0x..." actionName="setController" />
                <InputWithButton label="Fee To Address" placeholder="0x..." actionName="setFeeTo" />
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
        </TabsContent>

        {/* Router Configuration */}
        <TabsContent value="router" className="space-y-6">
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
        </TabsContent>

        {/* Swap Configuration */}
        <TabsContent value="swap" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Uniswap Configuration</CardTitle>
                <CardDescription>Configure Uniswap router and factory addresses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputWithButton label="Router V3 Address" placeholder="0x..." actionName="setRouterV3" />
                <InputWithButton label="Router V2 Address" placeholder="0x..." actionName="setRouterV2" />
                <InputWithButton label="Factory V3 Address" placeholder="0x..." actionName="setFactoryV3" />
                <InputWithButton label="Factory V2 Address" placeholder="0x..." actionName="setFactoryV2" />
                <InputWithButton
                  label="Pool Fee (basis points)"
                  placeholder="3000"
                  actionName="setPoolFee"
                  type="number"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cross Chain Configuration */}
        <TabsContent value="crosschain" className="space-y-6">
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
                />
                <InputWithButton label="Stargate Pool Token" placeholder="0x..." actionName="setStargatePool" />
                <InputWithButton label="LayerZero Endpoint" placeholder="0x..." actionName="setLzEndpoint" />
                <InputWithButton label="Whitelist Hot Wallet" placeholder="0x..." actionName="setWhitelistHotWallet" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
