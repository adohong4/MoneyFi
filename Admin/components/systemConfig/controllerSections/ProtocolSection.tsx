// components/system-config/controller-sections/ProtocolSection.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useWeb3 } from "@/components/web3-provider"
import { ControllerContract } from "@/services/contracts/controllerContract"
import { InputWithButton } from "../InputWithButton"

interface ProtocolSectionProps {
    isConnected: boolean
    loading: string | null
}

export function ProtocolSection({ isConnected }: ProtocolSectionProps) {
    const { toast } = useToast()
    const { provider } = useWeb3()
    const [localLoading, setLocalLoading] = useState<string | null>(null)
    const controllerContract = new ControllerContract(provider ?? undefined)

    const handleEnableReferralSignature = async (enabled: boolean, actionName: string) => {
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
            const tx = await controllerContract.setEnableReferralSignature(enabled)
            await tx.wait()

            toast({
                title: "Giao dịch thành công",
                description: enabled
                    ? "Đã bật chữ ký giới thiệu."
                    : "Đã tắt chữ ký giới thiệu.",
            })
        } catch (error) {
            console.error(`Lỗi khi thực hiện ${actionName}:`, error)
            toast({
                title: "Giao dịch thất bại",
                description: `Không thể thực hiện ${actionName}. Vui lòng thử lại.`,
                variant: "destructive",
            })
        } finally {
            setLocalLoading(null)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Cấu hình phí giao thức
                </CardTitle>
                <CardDescription>Cấu hình phí giao thức và cài đặt giới thiệu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <InputWithButton
                    label="Phí giao thức (%)"
                    placeholder="0.3"
                    actionName="setProtocolFee"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
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
                            const tx = await controllerContract.setProtocolFee(parseFloat(value))
                            await tx.wait()
                            toast({
                                title: "Giao dịch thành công",
                                description: `Đã đặt phí giao thức thành ${value}%.`,
                            })
                        } catch (error) {
                            console.error(`Lỗi khi thực hiện ${actionName}:`, error)
                            toast({
                                title: "Giao dịch thất bại",
                                description: `Không thể đặt phí giao thức. Vui lòng thử lại.`,
                                variant: "destructive",
                            })
                        } finally {
                            setLocalLoading(null)
                        }
                    }}
                />
                <InputWithButton
                    label="Phí giới thiệu (%)"
                    placeholder="0.1"
                    actionName="setReferralFee"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
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
                            const tx = await controllerContract.setReferralFee(parseFloat(value))
                            await tx.wait()
                            toast({
                                title: "Giao dịch thành công",
                                description: `Đã đặt phí giới thiệu thành ${value}%.`,
                            })
                        } catch (error) {
                            console.error(`Lỗi khi thực hiện ${actionName}:`, error)
                            toast({
                                title: "Giao dịch thất bại",
                                description: `Không thể đặt phí giới thiệu. Vui lòng thử lại.`,
                                variant: "destructive",
                            })
                        } finally {
                            setLocalLoading(null)
                        }
                    }}
                />
                <div className="space-y-2">
                    <Label>Bật/Tắt chữ ký giới thiệu</Label>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => handleEnableReferralSignature(true, "setEnableReferralSignature")}
                            disabled={localLoading !== null || !isConnected}
                            variant="outline"
                            className="flex-1 gap-2"
                        >
                            {localLoading === "setEnableReferralSignature" ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle className="h-4 w-4" />
                            )}
                            Bật
                        </Button>
                        <Button
                            onClick={() => handleEnableReferralSignature(false, "setEnableReferralSignature")}
                            disabled={localLoading !== null || !isConnected}
                            variant="outline"
                            className="flex-1 gap-2"
                        >
                            {localLoading === "setEnableReferralSignature" ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <XCircle className="h-4 w-4" />
                            )}
                            Tắt
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}