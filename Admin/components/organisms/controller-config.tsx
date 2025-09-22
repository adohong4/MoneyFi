"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Shield, Coins, Route, CheckCircle, UserCog } from "lucide-react"
import { InputWithButton } from "@/components/atoms/input-with-button"
import { ConfigButton } from "@/components/atoms/config-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ControllerConfigProps {
  onConfigAction: (actionName: string, params: any) => Promise<void>
  loading: string | null
  isConnected: boolean
}

export function ControllerConfig({ onConfigAction, loading, isConnected }: ControllerConfigProps) {
  const [activeTab, setActiveTab] = useState("protocol")

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 h-auto p-1">
          <TabsTrigger value="protocol" className="flex flex-col gap-1 h-12">
            <Settings className="h-4 w-4" />
            <span className="text-xs">Protocol</span>
          </TabsTrigger>
          <TabsTrigger value="tokens" className="flex flex-col gap-1 h-12">
            <Coins className="h-4 w-4" />
            <span className="text-xs">Tokens</span>
          </TabsTrigger>
          <TabsTrigger value="strategies" className="flex flex-col gap-1 h-12">
            <Shield className="h-4 w-4" />
            <span className="text-xs">Strategies</span>
          </TabsTrigger>
          <TabsTrigger value="routers" className="flex flex-col gap-1 h-12">
            <Route className="h-4 w-4" />
            <span className="text-xs">Routers</span>
          </TabsTrigger>
          <TabsTrigger value="checks" className="flex flex-col gap-1 h-12">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs">Checks</span>
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex flex-col gap-1 h-12">
            <UserCog className="h-4 w-4" />
            <span className="text-xs">Admin</span>
          </TabsTrigger>
        </TabsList>

        {/* Protocol Settings */}
        <TabsContent value="protocol" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Protocol Fees</CardTitle>
                <CardDescription>Configure protocol and referral fees</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputWithButton
                  label="Protocol Fee (%)"
                  placeholder="0.3"
                  buttonText="Set Protocol Fee"
                  onButtonClick={(value) => onConfigAction("setProtocolFee", { protocolFee: value })}
                  loading={loading === "setProtocolFee"}
                  disabled={!isConnected}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                />

                <InputWithButton
                  label="Referral Fee (%)"
                  placeholder="0.1"
                  buttonText="Set Referral Fee"
                  onButtonClick={(value) => onConfigAction("setReferralFee", { referralFee: value })}
                  loading={loading === "setReferralFee"}
                  disabled={!isConnected}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                />

                <div className="space-y-2">
                  <Label>Enable Referral Signature</Label>
                  <div className="flex gap-2">
                    <Select>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Enabled</SelectItem>
                        <SelectItem value="false">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                    <ConfigButton
                      actionName="Set Referral Signature"
                      params={{ enabled: true }}
                      onClick={onConfigAction}
                      loading={loading === "Set Referral Signature"}
                      disabled={!isConnected}
                      className="whitespace-nowrap"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Token Management */}
        <TabsContent value="tokens" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Token Configuration</CardTitle>
                <CardDescription>Manage supported tokens and their parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Token Address & Type</Label>
                  <div className="flex gap-2">
                    <Input placeholder="0x..." className="flex-1" />
                    <Select>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Internal</SelectItem>
                        <SelectItem value="external">External</SelectItem>
                      </SelectContent>
                    </Select>
                    <ConfigButton
                      actionName="Set Token Info"
                      params={{ address: "0x...", type: "internal" }}
                      onClick={onConfigAction}
                      loading={loading === "Set Token Info"}
                      disabled={!isConnected}
                      className="whitespace-nowrap"
                    />
                  </div>
                </div>

                <InputWithButton
                  label="Internal Token Address"
                  placeholder="0x..."
                  buttonText="Set Internal Token"
                  onButtonClick={(value) => onConfigAction("setInternalToken", { token: value, isInternal: true })}
                  loading={loading === "setInternalToken"}
                  disabled={!isConnected}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Strategy Management */}
        <TabsContent value="strategies" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Configuration</CardTitle>
                <CardDescription>Configure investment strategies and parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputWithButton
                  label="Strategy Address"
                  placeholder="0x..."
                  buttonText="Set Strategy"
                  onButtonClick={(value) => onConfigAction("setStrategy", { address: value })}
                  loading={loading === "setStrategy"}
                  disabled={!isConnected}
                />

                <InputWithButton
                  label="Max Percent Liquidity (%)"
                  placeholder="80"
                  buttonText="Set Max Percent"
                  onButtonClick={(value) => onConfigAction("setMaxPercentLiquidity", { percent: value })}
                  loading={loading === "setMaxPercentLiquidity"}
                  disabled={!isConnected}
                  type="number"
                  min="0"
                  max="100"
                />

                <InputWithButton
                  label="Max Deposit Value (USD)"
                  placeholder="1000000"
                  buttonText="Set Max Deposit"
                  onButtonClick={(value) => onConfigAction("setMaxDepositValue", { value: value })}
                  loading={loading === "setMaxDepositValue"}
                  disabled={!isConnected}
                  type="number"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Router Configuration */}
        <TabsContent value="routers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Router Configuration</CardTitle>
                <CardDescription>Configure router addresses and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputWithButton
                  label="Router Address"
                  placeholder="0x..."
                  buttonText="Set Router"
                  onButtonClick={(value) => onConfigAction("setRouter", { router: value })}
                  loading={loading === "setRouter"}
                  disabled={!isConnected}
                />

                <InputWithButton
                  label="Cross Chain Router"
                  placeholder="0x..."
                  buttonText="Set Cross Chain Router"
                  onButtonClick={(value) => onConfigAction("setCrossChainRouter", { router: value })}
                  loading={loading === "setCrossChainRouter"}
                  disabled={!isConnected}
                />

                <InputWithButton
                  label="Hot Wallet Address"
                  placeholder="0x..."
                  buttonText="Set Hot Wallet"
                  onButtonClick={(value) => onConfigAction("setHotWallet", { wallet: value })}
                  loading={loading === "setHotWallet"}
                  disabled={!isConnected}
                />

                <InputWithButton
                  label="System Action Fee (ETH)"
                  placeholder="0.001"
                  buttonText="Set Action Fee"
                  onButtonClick={(value) => onConfigAction("setAverageSystemActionFee", { fee: value })}
                  loading={loading === "setAverageSystemActionFee"}
                  disabled={!isConnected}
                  type="number"
                  step="0.0001"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="checks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Checks</CardTitle>
                <CardDescription>Validate system configurations and states</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputWithButton
                  label="Check Strategy Address"
                  placeholder="0x..."
                  buttonText="Is Strategy"
                  onButtonClick={(value) => onConfigAction("isStrategy", { address: value })}
                  loading={loading === "isStrategy"}
                  disabled={!isConnected}
                />

                <InputWithButton
                  label="Check Token Address"
                  placeholder="0x..."
                  buttonText="Is Internal Token"
                  onButtonClick={(value) => onConfigAction("isInternalToken", { token: value })}
                  loading={loading === "isInternalToken"}
                  disabled={!isConnected}
                />

                <InputWithButton
                  label="Check Router Address"
                  placeholder="0x..."
                  buttonText="Is Valid Router"
                  onButtonClick={(value) => onConfigAction("isValidRouter", { router: value })}
                  loading={loading === "isValidRouter"}
                  disabled={!isConnected}
                />

                <div className="grid grid-cols-2 gap-2">
                  <ConfigButton
                    actionName="Get Protocol Fee"
                    params={{}}
                    onClick={onConfigAction}
                    loading={loading === "Get Protocol Fee"}
                    disabled={!isConnected}
                    variant="outline"
                  />
                  <ConfigButton
                    actionName="Get Referral Fee"
                    params={{}}
                    onClick={onConfigAction}
                    loading={loading === "Get Referral Fee"}
                    disabled={!isConnected}
                    variant="outline"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Admin Functions */}
        <TabsContent value="admin" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Admin Functions</CardTitle>
                <CardDescription>Administrative controls and emergency functions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputWithButton
                  label="New Owner Address"
                  placeholder="0x..."
                  buttonText="Transfer Ownership"
                  onButtonClick={(value) => onConfigAction("transferOwnership", { newOwner: value })}
                  loading={loading === "transferOwnership"}
                  disabled={!isConnected}
                />

                <div className="grid grid-cols-2 gap-2">
                  <ConfigButton
                    actionName="Pause System"
                    params={{}}
                    onClick={onConfigAction}
                    loading={loading === "Pause System"}
                    disabled={!isConnected}
                    variant="destructive"
                  />
                  <ConfigButton
                    actionName="Unpause System"
                    params={{}}
                    onClick={onConfigAction}
                    loading={loading === "Unpause System"}
                    disabled={!isConnected}
                    variant="outline"
                  />
                </div>

                <ConfigButton
                  actionName="Emergency Withdraw"
                  params={{}}
                  onClick={onConfigAction}
                  loading={loading === "Emergency Withdraw"}
                  disabled={!isConnected}
                  variant="destructive"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
