// components/system-config/controller-sections/StrategySection.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useWeb3 } from "@/components/web3-provider"
import { ControllerContract } from "@/services/contracts/controllerContract"
import { ethers } from "ethers"
import { Strategy, StrategyExternal } from "@/lib/web3/type/controllerType"
import { InputWithButton } from "../InputWithButton"

interface StrategySectionProps {
    isConnected: boolean
    loading: string | null
}

export function StrategySection({ isConnected }: StrategySectionProps) {
    const { toast } = useToast()
    const { provider } = useWeb3()
    const [localLoading, setLocalLoading] = useState<string | null>(null)
    const [strategyAddress, setStrategyAddress] = useState("")
    const [strategyType, setStrategyType] = useState<"internal" | "external" | "">("")
    const [strategyName, setStrategyName] = useState("")
    const [chainId, setChainId] = useState("")
    const [isActive, setIsActive] = useState<"true" | "false">("true")
    const [underlyingAsset, setUnderlyingAsset] = useState("")

    const controllerContract = new ControllerContract(provider ?? undefined)

    const handleSetStrategy = async (actionName: string) => {
        if (!isConnected) {
            toast({
                title: "Ví chưa được kết nối",
                description: "Vui lòng kết nối ví để thực hiện hành động này.",
                variant: "destructive",
            })
            return
        }

        if (!ethers.isAddress(strategyAddress)) {
            toast({
                title: "Địa chỉ không hợp lệ",
                description: "Vui lòng nhập địa chỉ chiến lược hợp lệ.",
                variant: "destructive",
            })
            return
        }

        if (!strategyName || !chainId || !strategyType) {
            toast({
                title: "Dữ liệu không đầy đủ",
                description: "Vui lòng nhập đầy đủ thông tin chiến lược.",
                variant: "destructive",
            })
            return
        }

        if (strategyType === "external" && !ethers.isAddress(underlyingAsset)) {
            toast({
                title: "Địa chỉ tài sản cơ bản không hợp lệ",
                description: "Vui lòng nhập địa chỉ tài sản cơ bản hợp lệ cho chiến lược bên ngoài.",
                variant: "destructive",
            })
            return
        }

        const strategyInfo: Strategy | StrategyExternal =
            strategyType === "internal"
                ? { name: strategyName, chainId: parseInt(chainId), isActive: isActive === "true" }
                : { name: strategyName, chainId: parseInt(chainId), isActive: isActive === "true", underlyingAsset }

        setLocalLoading(actionName)
        try {
            const tx =
                strategyType === "internal"
                    ? await controllerContract.setStrategyInternal(strategyAddress, strategyInfo as Strategy)
                    : await controllerContract.setStrategyExternal(strategyAddress, strategyInfo as StrategyExternal)
            await tx.wait()

            toast({
                title: "Giao dịch thành công",
                description: `Đã đặt chiến lược ${strategyType === "internal" ? "nội bộ" : "bên ngoài"} cho ${strategyAddress}.`,
            })

            // Reset inputs
            setStrategyAddress("")
            setStrategyType("")
            setStrategyName("")
            setChainId("")
            setIsActive("true")
            setUnderlyingAsset("")
        } catch (error) {
            console.error(`Lỗi khi thực hiện ${actionName}:`, error)
            toast({
                title: "Giao dịch thất bại",
                description: `Không thể đặt chiến lược. Vui lòng thử lại.`,
                variant: "destructive",
            })
        } finally {
            setLocalLoading(null)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cấu hình chiến lược</CardTitle>
                <CardDescription>Cấu hình chiến lược đầu tư và thông số</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Địa chỉ chiến lược & Loại</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="0x..."
                            value={strategyAddress}
                            onChange={(e) => setStrategyAddress(e.target.value)}
                            className="flex-1"
                        />
                        <Select value={strategyType} onValueChange={(value) => setStrategyType(value as "internal" | "external")}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="Loại" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="internal">Nội bộ</SelectItem>
                                <SelectItem value="external">Bên ngoài</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Thông tin chiến lược</Label>
                    <div className="space-y-2">
                        <Input
                            placeholder="Tên chiến lược"
                            value={strategyName}
                            onChange={(e) => setStrategyName(e.target.value)}
                        />
                        <Input
                            placeholder="Chain ID"
                            type="number"
                            value={chainId}
                            onChange={(e) => setChainId(e.target.value)}
                        />
                        <Select value={isActive} onValueChange={(value) => setIsActive(value as "true" | "false")}>
                            <SelectTrigger>
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Kích hoạt</SelectItem>
                                <SelectItem value="false">Không kích hoạt</SelectItem>
                            </SelectContent>
                        </Select>
                        {strategyType === "external" && (
                            <Input
                                placeholder="Địa chỉ tài sản cơ bản (0x...)"
                                value={underlyingAsset}
                                onChange={(e) => setUnderlyingAsset(e.target.value)}
                            />
                        )}
                        <Button
                            onClick={() => handleSetStrategy(strategyType === "internal" ? "setStrategyInternal" : "setStrategyExternal")}
                            disabled={localLoading !== null || !isConnected || !strategyAddress || !strategyType || !strategyName || !chainId || (strategyType === "external" && !underlyingAsset)}
                            className="w-full gap-2"
                        >
                            {localLoading === "setStrategyInternal" || localLoading === "setStrategyExternal" ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle className="h-4 w-4" />
                            )}
                            Đặt chiến lược
                        </Button>
                    </div>
                </div>
                <InputWithButton
                    label="Tỷ lệ thanh khoản tối đa (%)"
                    placeholder="80"
                    actionName="setMaxPercentLiquidityStrategyToken"
                    type="number"
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
                        const tokenAddress = prompt("Nhập địa chỉ token (0x...):") // Có thể thay bằng Input
                        if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
                            toast({
                                title: "Địa chỉ token không hợp lệ",
                                description: "Vui lòng nhập địa chỉ token hợp lệ.",
                                variant: "destructive",
                            })
                            return
                        }
                        setLocalLoading(actionName)
                        try {
                            const tx = await controllerContract.setMaxPercentLiquidityStrategyToken(tokenAddress, parseFloat(value))
                            await tx.wait()
                            toast({
                                title: "Giao dịch thành công",
                                description: `Đã đặt tỷ lệ thanh khoản tối đa thành ${value}% cho token ${tokenAddress}.`,
                            })
                        } catch (error) {
                            console.error(`Lỗi khi thực hiện ${actionName}:`, error)
                            toast({
                                title: "Giao dịch thất bại",
                                description: `Không thể đặt tỷ lệ thanh khoản tối đa. Vui lòng thử lại.`,
                                variant: "destructive",
                            })
                        } finally {
                            setLocalLoading(null)
                        }
                    }}
                />
                <InputWithButton
                    label="Giá trị gửi tối đa (USD)"
                    placeholder="1000000"
                    actionName="setMaxDepositValue"
                    type="number"
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
                        const tokenAddress = prompt("Nhập địa chỉ token (0x...):") // Có thể thay bằng Input
                        if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
                            toast({
                                title: "Địa chỉ token không hợp lệ",
                                description: "Vui lòng nhập địa chỉ token hợp lệ.",
                                variant: "destructive",
                            })
                            return
                        }
                        setLocalLoading(actionName)
                        try {
                            const tx = await controllerContract.setMaxDepositValue(tokenAddress, parseFloat(value))
                            await tx.wait()
                            toast({
                                title: "Giao dịch thành công",
                                description: `Đã đặt giá trị gửi tối đa thành ${value} USD cho token ${tokenAddress}.`,
                            })
                        } catch (error) {
                            console.error(`Lỗi khi thực hiện ${actionName}:`, error)
                            toast({
                                title: "Giao dịch thất bại",
                                description: `Không thể đặt giá trị gửi tối đa. Vui lòng thử lại.`,
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