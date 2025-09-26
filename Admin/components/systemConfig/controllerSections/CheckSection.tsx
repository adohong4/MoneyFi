// components/system-config/controller-sections/CheckSection.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useWeb3 } from "@/components/web3-provider"
import { ControllerContract } from "@/services/contracts/controllerContract"
import { CheckFunction } from "../CheckFunction"
import { ethers } from "ethers"

interface CheckSectionProps {
    isConnected: boolean
    loading: string | null
}

export function CheckSection({ isConnected }: CheckSectionProps) {
    const { toast } = useToast()
    const { provider } = useWeb3()
    const [localLoading, setLocalLoading] = useState<string | null>(null)

    const controllerContract = new ControllerContract(provider ?? undefined)

    const handleCheck = async (actionName: string, inputValues: any = {}) => {
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
            let value: any
            switch (actionName) {
                case "getProtocolFee":
                    value = await controllerContract.getProtocolFee()
                    value = `${value}%`
                    break
                case "getReferralFee":
                    value = await controllerContract.getReferralFee()
                    value = `${value}%`
                    break
                case "getRouter":
                    value = await controllerContract.getRouter()
                    break
                case "getCrossChainRouter":
                    value = await controllerContract.getCrossChainRouter()
                    break
                case "getSignerController":
                    value = await controllerContract.getSignerController()
                    break
                case "getHotWallet":
                    value = await controllerContract.getHotWallet()
                    break
                case "getAverageSystemActionFee":
                    value = await controllerContract.getAverageSystemActionFee()
                    value = `${value} ETH`
                    break
                case "getEnableReferralSignature":
                    value = await controllerContract.getEnableReferralSignature()
                    value = value ? "Kích hoạt" : "Không kích hoạt"
                    break
                case "getMaxPercentLiquidityStrategyToken":
                    if (!ethers.isAddress(inputValues.tokenAddress)) {
                        toast({
                            title: "Địa chỉ token không hợp lệ",
                            description: "Vui lòng nhập địa chỉ token hợp lệ.",
                            variant: "destructive",
                        })
                        return
                    }
                    value = await controllerContract.getMaxPercentLiquidityStrategyToken(inputValues.tokenAddress)
                    value = `${value}%`
                    break
                case "getMaxDepositValueToken":
                    if (!ethers.isAddress(inputValues.tokenAddress)) {
                        toast({
                            title: "Địa chỉ token không hợp lệ",
                            description: "Vui lòng nhập địa chỉ token hợp lệ.",
                            variant: "destructive",
                        })
                        return
                    }
                    value = await controllerContract.getMaxDepositValueToken(inputValues.tokenAddress)
                    value = `${value} USD`
                    break
                case "getSupportedTokenInternalInfor":
                    if (!ethers.isAddress(inputValues.tokenAddress)) {
                        toast({
                            title: "Địa chỉ token không hợp lệ",
                            description: "Vui lòng nhập địa chỉ token hợp lệ.",
                            variant: "destructive",
                        })
                        return
                    }
                    value = await controllerContract.getSupportedTokenInternalInfor(inputValues.tokenAddress)
                    value = JSON.stringify(value, null, 2)
                    break
                case "isStrategyInternalActive":
                    if (!ethers.isAddress(inputValues.strategyAddress)) {
                        toast({
                            title: "Địa chỉ chiến lược không hợp lệ",
                            description: "Vui lòng nhập địa chỉ chiến lược hợp lệ.",
                            variant: "destructive",
                        })
                        return
                    }
                    value = await controllerContract.isStrategyInternalActive(inputValues.strategyAddress)
                    value = value ? "Kích hoạt" : "Không kích hoạt"
                    break
                case "isStrategyExternalActive":
                    if (!ethers.isAddress(inputValues.strategyAddress)) {
                        toast({
                            title: "Địa chỉ chiến lược không hợp lệ",
                            description: "Vui lòng nhập địa chỉ chiến lược hợp lệ.",
                            variant: "destructive",
                        })
                        return
                    }
                    value = await controllerContract.isStrategyExternalActive(inputValues.strategyAddress)
                    value = value ? "Kích hoạt" : "Không kích hoạt"
                    break
                case "isDexCrossChainInternalActive":
                    if (!ethers.isAddress(inputValues.dexCrossChainAddress)) {
                        toast({
                            title: "Địa chỉ DEX cross-chain không hợp lệ",
                            description: "Vui lòng nhập địa chỉ DEX cross-chain hợp lệ.",
                            variant: "destructive",
                        })
                        return
                    }
                    value = await controllerContract.isDexCrossChainInternalActive(inputValues.dexCrossChainAddress)
                    value = value ? "Kích hoạt" : "Không kích hoạt"
                    break
                case "isDexCrossChainExternalActive":
                    if (!ethers.isAddress(inputValues.dexCrossChainAddress)) {
                        toast({
                            title: "Địa chỉ DEX cross-chain không hợp lệ",
                            description: "Vui lòng nhập địa chỉ DEX cross-chain hợp lệ.",
                            variant: "destructive",
                        })
                        return
                    }
                    value = await controllerContract.isDexCrossChainExternalActive(inputValues.dexCrossChainAddress)
                    value = value ? "Kích hoạt" : "Không kích hoạt"
                    break
                case "isTokenSupportInternalActive":
                    if (!ethers.isAddress(inputValues.tokenAddress)) {
                        toast({
                            title: "Địa chỉ token không hợp lệ",
                            description: "Vui lòng nhập địa chỉ token hợp lệ.",
                            variant: "destructive",
                        })
                        return
                    }
                    value = await controllerContract.isTokenSupportInternalActive(inputValues.tokenAddress)
                    value = value ? "Kích hoạt" : "Không kích hoạt"
                    break
                case "isTokenSupportExternalActive":
                    if (!ethers.isAddress(inputValues.tokenAddress)) {
                        toast({
                            title: "Địa chỉ token không hợp lệ",
                            description: "Vui lòng nhập địa chỉ token hợp lệ.",
                            variant: "destructive",
                        })
                        return
                    }
                    value = await controllerContract.isTokenSupportExternalActive(inputValues.tokenAddress)
                    value = value ? "Kích hoạt" : "Không kích hoạt"
                    break
                case "isDexSwapInternalActive":
                    if (!ethers.isAddress(inputValues.dexSwapAddress)) {
                        toast({
                            title: "Địa chỉ DEX swap không hợp lệ",
                            description: "Vui lòng nhập địa chỉ DEX swap hợp lệ.",
                            variant: "destructive",
                        })
                        return
                    }
                    value = await controllerContract.isDexSwapInternalActive(inputValues.dexSwapAddress)
                    value = value ? "Kích hoạt" : "Không kích hoạt"
                    break
                case "isDexSwapExternalActive":
                    if (!ethers.isAddress(inputValues.dexSwapAddress)) {
                        toast({
                            title: "Địa chỉ DEX swap không hợp lệ",
                            description: "Vui lòng nhập địa chỉ DEX swap hợp lệ.",
                            variant: "destructive",
                        })
                        return
                    }
                    value = await controllerContract.isDexSwapExternalActive(inputValues.dexSwapAddress)
                    value = value ? "Kích hoạt" : "Không kích hoạt"
                    break
                case "isValidUnderlyingAssetStrategyExternal":
                    if (!ethers.isAddress(inputValues.strategyAddress) || !ethers.isAddress(inputValues.underlyingAsset)) {
                        toast({
                            title: "Địa chỉ không hợp lệ",
                            description: "Vui lòng nhập địa chỉ chiến lược và tài sản cơ bản hợp lệ.",
                            variant: "destructive",
                        })
                        return
                    }
                    value = await controllerContract.isValidUnderlyingAssetStrategyExternal(
                        inputValues.strategyAddress,
                        inputValues.underlyingAsset
                    )
                    value = value ? "Hợp lệ" : "Không hợp lệ"
                    break
                case "isCrossChainSwapSameType":
                    if (!ethers.isAddress(inputValues.crossChainSender) || !ethers.isAddress(inputValues.crossChainReceiver)) {
                        toast({
                            title: "Địa chỉ không hợp lệ",
                            description: "Vui lòng nhập địa chỉ sender và receiver hợp lệ.",
                            variant: "destructive",
                        })
                        return
                    }
                    value = await controllerContract.isCrossChainSwapSameType(
                        inputValues.crossChainSender,
                        inputValues.crossChainReceiver
                    )
                    value = value ? "Cùng loại" : "Khác loại"
                    break
                default:
                    throw new Error("Hàm không được hỗ trợ")
            }

            toast({
                title: "Kiểm tra thành công",
                description: `Giá trị: ${value}`,
            })

            return value
        } catch (error) {
            console.error(`Lỗi khi kiểm tra ${actionName}:`, error)
            toast({
                title: "Kiểm tra thất bại",
                description: `Không thể kiểm tra ${actionName}. Vui lòng thử lại.`,
                variant: "destructive",
            })
            return "Lỗi"
        } finally {
            setLocalLoading(null)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Chức năng kiểm tra
                </CardTitle>
                <CardDescription>Xem trạng thái và cấu hình hệ thống hiện tại</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <CheckFunction
                    label="Phí giao thức"
                    actionName="getProtocolFee"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="Phí giới thiệu"
                    actionName="getReferralFee"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="Router hiện tại"
                    actionName="getRouter"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="Router liên chuỗi"
                    actionName="getCrossChainRouter"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="Signer điều khiển"
                    actionName="getSignerController"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="Ví nóng"
                    actionName="getHotWallet"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="Phí hành động hệ thống trung bình"
                    actionName="getAverageSystemActionFee"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="Chữ ký giới thiệu có bật không"
                    actionName="getEnableReferralSignature"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="Tỷ lệ thanh khoản tối đa của token"
                    actionName="getMaxPercentLiquidityStrategyToken"
                    inputType="single"
                    inputPlaceholder="Địa chỉ token (0x...)"
                    inputKey="tokenAddress"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="Giá trị gửi tối đa của token"
                    actionName="getMaxDepositValueToken"
                    inputType="single"
                    inputPlaceholder="Địa chỉ token (0x...)"
                    inputKey="tokenAddress"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="Thông tin token nội bộ"
                    actionName="getSupportedTokenInternalInfor"
                    inputType="single"
                    inputPlaceholder="Địa chỉ token (0x...)"
                    inputKey="tokenAddress"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="Chiến lược nội bộ có hoạt động"
                    actionName="isStrategyInternalActive"
                    inputType="single"
                    inputPlaceholder="Địa chỉ chiến lược (0x...)"
                    inputKey="strategyAddress"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="Chiến lược bên ngoài có hoạt động"
                    actionName="isStrategyExternalActive"
                    inputType="single"
                    inputPlaceholder="Địa chỉ chiến lược (0x...)"
                    inputKey="strategyAddress"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="DEX cross-chain nội bộ có hoạt động"
                    actionName="isDexCrossChainInternalActive"
                    inputType="single"
                    inputPlaceholder="Địa chỉ DEX cross-chain (0x...)"
                    inputKey="dexCrossChainAddress"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="DEX cross-chain bên ngoài có hoạt động"
                    actionName="isDexCrossChainExternalActive"
                    inputType="single"
                    inputPlaceholder="Địa chỉ DEX cross-chain (0x...)"
                    inputKey="dexCrossChainAddress"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="Token nội bộ có được hỗ trợ"
                    actionName="isTokenSupportInternalActive"
                    inputType="single"
                    inputPlaceholder="Địa chỉ token (0x...)"
                    inputKey="tokenAddress"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="Token bên ngoài có được hỗ trợ"
                    actionName="isTokenSupportExternalActive"
                    inputType="single"
                    inputPlaceholder="Địa chỉ token (0x...)"
                    inputKey="tokenAddress"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="DEX swap nội bộ có hoạt động"
                    actionName="isDexSwapInternalActive"
                    inputType="single"
                    inputPlaceholder="Địa chỉ DEX swap (0x...)"
                    inputKey="dexSwapAddress"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="DEX swap bên ngoài có hoạt động"
                    actionName="isDexSwapExternalActive"
                    inputType="single"
                    inputPlaceholder="Địa chỉ DEX swap (0x...)"
                    inputKey="dexSwapAddress"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="Tài sản cơ bản chiến lược bên ngoài hợp lệ"
                    actionName="isValidUnderlyingAssetStrategyExternal"
                    inputType="double"
                    inputPlaceholder1="Địa chỉ chiến lược (0x...)"
                    inputPlaceholder2="Địa chỉ tài sản cơ bản (0x...)"
                    inputKey1="strategyAddress"
                    inputKey2="underlyingAsset"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
                <CheckFunction
                    label="Swap liên chuỗi cùng loại"
                    actionName="isCrossChainSwapSameType"
                    inputType="double"
                    inputPlaceholder1="Địa chỉ sender (0x...)"
                    inputPlaceholder2="Địa chỉ receiver (0x...)"
                    inputKey1="crossChainSender"
                    inputKey2="crossChainReceiver"
                    loading={localLoading}
                    handleConfigAction={handleCheck}
                />
            </CardContent>
        </Card>
    )
}