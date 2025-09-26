// components/system-config/controller-sections/TokenSection.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useWeb3 } from "@/components/web3-provider"
import { ControllerContract } from "@/services/contracts/controllerContract"
import { ethers } from "ethers"
import { TokenInfo } from "@/lib/web3/type/controllerType"

interface TokenSectionProps {
    isConnected: boolean
    loading: string | null
}

export function TokenSection({ isConnected }: TokenSectionProps) {
    const { toast } = useToast()
    const { provider } = useWeb3()
    const [localLoading, setLocalLoading] = useState<string | null>(null)
    const [tokenAddress, setTokenAddress] = useState("")
    const [tokenType, setTokenType] = useState<"internal" | "external" | "">("")
    const [lpTokenAddress, setLpTokenAddress] = useState("")
    const [minDepositAmount, setMinDepositAmount] = useState("")
    const [decimals, setDecimals] = useState("")
    const [chainId, setChainId] = useState("")
    const [isActive, setIsActive] = useState<"true" | "false">("true")

    const controllerContract = new ControllerContract(provider ?? undefined)

    const handleSetTokenInfo = async (actionName: string) => {
        if (!isConnected) {
            toast({
                title: "Ví chưa được kết nối",
                description: "Vui lòng kết nối ví để thực hiện hành động này.",
                variant: "destructive",
            })
            return
        }

        if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(lpTokenAddress)) {
            toast({
                title: "Địa chỉ không hợp lệ",
                description: "Vui lòng nhập địa chỉ token và lpToken hợp lệ.",
                variant: "destructive",
            })
            return
        }

        if (!minDepositAmount || !decimals || !chainId) {
            toast({
                title: "Dữ liệu không đầy đủ",
                description: "Vui lòng nhập đầy đủ thông tin token.",
                variant: "destructive",
            })
            return
        }

        const tokenInfo: TokenInfo = {
            lpTokenAddress,
            minDepositAmount: parseFloat(minDepositAmount),
            decimals: parseInt(decimals),
            chainId: parseInt(chainId),
            isActive: isActive === "true",
        }

        setLocalLoading(actionName)
        try {
            const tx =
                tokenType === "internal"
                    ? await controllerContract.setTokenInfoInternal(tokenAddress, tokenInfo)
                    : await controllerContract.setTokenInfoExternal(tokenAddress, tokenInfo)
            await tx.wait()

            toast({
                title: "Giao dịch thành công",
                description: `Đã đặt thông tin token ${tokenType === "internal" ? "nội bộ" : "bên ngoài"} cho ${tokenAddress}.`,
            })

            // Reset inputs
            setTokenAddress("")
            setTokenType("")
            setLpTokenAddress("")
            setMinDepositAmount("")
            setDecimals("")
            setChainId("")
            setIsActive("true")
        } catch (error) {
            console.error(`Lỗi khi thực hiện ${actionName}:`, error)
            toast({
                title: "Giao dịch thất bại",
                description: `Không thể đặt thông tin token. Vui lòng thử lại.`,
                variant: "destructive",
            })
        } finally {
            setLocalLoading(null)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cấu hình token</CardTitle>
                <CardDescription>Quản lý token được hỗ trợ và thông số của chúng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Địa chỉ token & Loại</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="0x..."
                            value={tokenAddress}
                            onChange={(e) => setTokenAddress(e.target.value)}
                            className="flex-1"
                        />
                        <Select value={tokenType} onValueChange={(value) => setTokenType(value as "internal" | "external")}>
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
                    <Label>Thông tin token</Label>
                    <div className="space-y-2">
                        <Input
                            placeholder="Địa chỉ LP Token (0x...)"
                            value={lpTokenAddress}
                            onChange={(e) => setLpTokenAddress(e.target.value)}
                        />
                        <Input
                            placeholder="Số tiền gửi tối thiểu"
                            type="number"
                            value={minDepositAmount}
                            onChange={(e) => setMinDepositAmount(e.target.value)}
                        />
                        <Input
                            placeholder="Số thập phân (decimals)"
                            type="number"
                            value={decimals}
                            onChange={(e) => setDecimals(e.target.value)}
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
                        <Button
                            onClick={() => handleSetTokenInfo(tokenType === "internal" ? "setTokenInfoInternal" : "setTokenInfoExternal")}
                            disabled={localLoading !== null || !isConnected || !tokenAddress || !tokenType || !lpTokenAddress || !minDepositAmount || !decimals || !chainId}
                            className="w-full gap-2"
                        >
                            {localLoading === "setTokenInfoInternal" || localLoading === "setTokenInfoExternal" ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle className="h-4 w-4" />
                            )}
                            Đặt thông tin token
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}