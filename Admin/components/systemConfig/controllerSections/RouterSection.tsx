// components/system-config/controller-sections/RouterSection.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ethers } from "ethers"
import { useToast } from "@/hooks/use-toast"
import { useWeb3 } from "@/components/web3-provider"
import { ControllerContract } from "@/services/contracts/controllerContract"
import { InputWithButton } from "../InputWithButton"

interface RouterSectionProps {
    isConnected: boolean
    loading: string | null
}

export function RouterSection({ isConnected }: RouterSectionProps) {
    const { toast } = useToast()
    const { provider } = useWeb3()
    const [localLoading, setLocalLoading] = useState<string | null>(null)
    const controllerContract = new ControllerContract(provider ?? undefined)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cấu hình Router</CardTitle>
                <CardDescription>Cấu hình địa chỉ router và cài đặt liên chuỗi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <InputWithButton
                    label="Địa chỉ Router"
                    placeholder="0x..."
                    actionName="setRouter"
                    isConnected={isConnected}
                    loading={localLoading}
                    handleConfigAction={async (actionName, { value }) => {
                        if (!isConnected) {
                            toast({
                                title: "Ví chưa được kết nối",
                                description: "Vui lòng kết nối ví để thực hiện hành động này.",
                                variant: "destructive",
                            })
                            return
                        }
                        if (!ethers.isAddress(value)) {
                            toast({
                                title: "Địa chỉ không hợp lệ",
                                description: "Vui lòng nhập địa chỉ router hợp lệ.",
                                variant: "destructive",
                            })
                            return
                        }
                        setLocalLoading(actionName)
                        try {
                            const tx = await controllerContract.setRouter(value)
                            await tx.wait()
                            toast({
                                title: "Giao dịch thành công",
                                description: `Đã đặt địa chỉ router thành ${value}.`,
                            })
                        } catch (error) {
                            console.error(`Lỗi khi thực hiện ${actionName}:`, error)
                            toast({
                                title: "Giao dịch thất bại",
                                description: `Không thể đặt địa chỉ router. Vui lòng thử lại.`,
                                variant: "destructive",
                            })
                        } finally {
                            setLocalLoading(null)
                        }
                    }}
                />
                <InputWithButton
                    label="Địa chỉ Router liên chuỗi"
                    placeholder="0x..."
                    actionName="setCrossChainRouter"
                    isConnected={isConnected}
                    loading={localLoading}
                    handleConfigAction={async (actionName, { value }) => {
                        if (!isConnected) {
                            toast({
                                title: "Ví chưa được kết nối",
                                description: "Vui lòng kết nối ví để thực hiện hành động này.",
                                variant: "destructive",
                            })
                            return
                        }
                        if (!ethers.isAddress(value)) {
                            toast({
                                title: "Địa chỉ không hợp lệ",
                                description: "Vui lòng nhập địa chỉ router liên chuỗi hợp lệ.",
                                variant: "destructive",
                            })
                            return
                        }
                        setLocalLoading(actionName)
                        try {
                            const tx = await controllerContract.setCrossChainRouter(value)
                            await tx.wait()
                            toast({
                                title: "Giao dịch thành công",
                                description: `Đã đặt địa chỉ router liên chuỗi thành ${value}.`,
                            })
                        } catch (error) {
                            console.error(`Lỗi khi thực hiện ${actionName}:`, error)
                            toast({
                                title: "Giao dịch thất bại",
                                description: `Không thể đặt địa chỉ router liên chuỗi. Vui lòng thử lại.`,
                                variant: "destructive",
                            })
                        } finally {
                            setLocalLoading(null)
                        }
                    }}
                />
                <InputWithButton
                    label="Địa chỉ ví nóng"
                    placeholder="0x..."
                    actionName="setHotWallet"
                    isConnected={isConnected}
                    loading={localLoading}
                    handleConfigAction={async (actionName, { value }) => {
                        if (!isConnected) {
                            toast({
                                title: "Ví chưa được kết nối",
                                description: "Vui lòng kết nối ví để thực hiện hành động này.",
                                variant: "destructive",
                            })
                            return
                        }
                        if (!ethers.isAddress(value)) {
                            toast({
                                title: "Địa chỉ không hợp lệ",
                                description: "Vui lòng nhập địa chỉ ví nóng hợp lệ.",
                                variant: "destructive",
                            })
                            return
                        }
                        setLocalLoading(actionName)
                        try {
                            const tx = await controllerContract.setHotWallet(value)
                            await tx.wait()
                            toast({
                                title: "Giao dịch thành công",
                                description: `Đã đặt địa chỉ ví nóng thành ${value}.`,
                            })
                        } catch (error) {
                            console.error(`Lỗi khi thực hiện ${actionName}:`, error)
                            toast({
                                title: "Giao dịch thất bại",
                                description: `Không thể đặt địa chỉ ví nóng. Vui lòng thử lại.`,
                                variant: "destructive",
                            })
                        } finally {
                            setLocalLoading(null)
                        }
                    }}
                />
                <InputWithButton
                    label="Phí hành động hệ thống trung bình (ETH)"
                    placeholder="0.001"
                    actionName="setAverageSystemActionFee"
                    type="number"
                    step="0.0001"
                    isConnected={isConnected}
                    loading={localLoading}
                    handleConfigAction={async (actionName, { value }) => {
                        if (!isConnected) {
                            toast({
                                title: "Ví chưa được kết nối",
                                description: "Vui lòng kết nối ví để thực hiện hành động này.",
                                variant: "destructive",
                            })
                            return
                        }
                        setLocalLoading(actionName)
                        try {
                            const tx = await controllerContract.setAverageSystemActionFee(parseFloat(value))
                            await tx.wait()
                            toast({
                                title: "Giao dịch thành công",
                                description: `Đã đặt phí hành động hệ thống trung bình thành ${value} ETH.`,
                            })
                        } catch (error) {
                            console.error(`Lỗi khi thực hiện ${actionName}:`, error)
                            toast({
                                title: "Giao dịch thất bại",
                                description: `Không thể đặt phí hành động hệ thống. Vui lòng thử lại.`,
                                variant: "destructive",
                            })
                        } finally {
                            setLocalLoading(null)
                        }
                    }}
                />
            </CardContent>
        </Card>
    )
}