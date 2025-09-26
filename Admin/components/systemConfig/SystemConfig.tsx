// components/system-config/SystemConfig.tsx
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useWeb3 } from "@/components/web3-provider"
import { Header } from "./Header"
import { ControllerSectionTabs } from "./ControllerSectionTabs"
import { ControllerSectionContent } from "./ControllerSectionContent"
import { VaultConfig } from "./VaultConfig"
import { RouterConfig } from "./RouterConfig"
import { SwapConfig } from "./SwapConfig"
import { CrossChainConfig } from "./CrossChainConfig"

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

    return (
        <div className="p-6 space-y-6">
            <Header isConnected={isConnected} />

            <Tabs defaultValue="controller" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="controller">Controller</TabsTrigger>
                    <TabsTrigger value="vault">Fund Vault</TabsTrigger>
                    <TabsTrigger value="router">Router</TabsTrigger>
                    <TabsTrigger value="swap">Swap</TabsTrigger>
                    <TabsTrigger value="crosschain">Cross Chain</TabsTrigger>
                </TabsList>

                <TabsContent value="controller" className="space-y-6">
                    <ControllerSectionTabs
                        controllerSection={controllerSection}
                        setControllerSection={setControllerSection}
                    />
                    <ControllerSectionContent
                        controllerSection={controllerSection}
                        isConnected={isConnected}
                        loading={loading}
                        handleConfigAction={handleConfigAction}
                    />
                </TabsContent>

                <TabsContent value="vault" className="space-y-6">
                    <VaultConfig
                        isConnected={isConnected}
                        loading={loading}
                        handleConfigAction={handleConfigAction}
                    />
                </TabsContent>

                <TabsContent value="router" className="space-y-6">
                    <RouterConfig
                        isConnected={isConnected}
                        loading={loading}
                        handleConfigAction={handleConfigAction}
                    />
                </TabsContent>

                <TabsContent value="swap" className="space-y-6">
                    <SwapConfig
                        isConnected={isConnected}
                        loading={loading}
                        handleConfigAction={handleConfigAction}
                    />
                </TabsContent>

                <TabsContent value="crosschain" className="space-y-6">
                    <CrossChainConfig
                        isConnected={isConnected}
                        loading={loading}
                        handleConfigAction={handleConfigAction}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}