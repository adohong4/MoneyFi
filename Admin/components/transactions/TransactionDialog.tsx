// components/TransactionHistory/TransactionDetailsDialog.tsx
import React, { useState } from 'react'; // Import useState
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Transaction } from "@/services/transaction.api" // Giả định interface Transaction của bạn
import { ArrowDownLeft, RefreshCw, Activity, ClipboardCopy, Check } from "lucide-react" // Thêm ClipboardCopy và Check
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"
import { toast } from 'sonner'; // Giả định bạn đang dùng sonner hoặc thư viện toast tương tự

interface TransactionDetailsDialogProps {
    transaction: Transaction
}

export function TransactionDetailsDialog({ transaction }: TransactionDetailsDialogProps) {
    const [copiedText, setCopiedText] = useState<string | null>(null);

    const getTransactionIcon = (type: string) => {
        const lowercasedType = type.toLowerCase();
        if (lowercasedType.includes("deposit")) return <ArrowDownLeft className="h-4 w-4 text-green-500" />
        if (lowercasedType.includes("rebalance")) return <RefreshCw className="h-4 w-4 text-purple-500" />
        return <Activity className="h-4 w-4 text-gray-500" />
    }

    const getStatusBadge = (status: string) => {
        const lowercasedStatus = status.toLowerCase();
        switch (lowercasedStatus) {
            case "completed":
                return <Badge className="bg-green-500/10 text-green-400 border-green-500/20 px-2 py-1 text-xs font-medium">Hoàn thành</Badge>
            case "pending":
                return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 px-2 py-1 text-xs font-medium">Đang chờ</Badge>
            case "failed":
                return <Badge variant="destructive" className="px-2 py-1 text-xs font-medium">Thất bại</Badge>
            default:
                return <Badge variant="secondary" className="px-2 py-1 text-xs font-medium">Không xác định</Badge>
        }
    }

    const copyToClipboard = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedText(fieldName);
            toast.success(`${fieldName} đã được sao chép!`); // Sử dụng toast để thông báo
            setTimeout(() => setCopiedText(null), 2000); // Reset sau 2 giây
        } catch (err) {
            console.error('Không thể sao chép: ', err);
            toast.error(`Không thể sao chép ${fieldName}.`);
        }
    };

    const renderCopyButton = (textToCopy: string, fieldName: string) => (
        <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-2 text-gray-400 hover:text-gray-200"
            onClick={() => copyToClipboard(textToCopy, fieldName)}
            aria-label={`Sao chép ${fieldName}`}
        >
            {copiedText === fieldName ? <Check className="h-3 w-3 text-green-500" /> : <ClipboardCopy className="h-3 w-3" />}
        </Button>
    );

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-gray-900 text-gray-100 p-6 rounded-lg shadow-2xl border border-gray-700">
                <DialogHeader className="mb-4 border-b border-gray-800 pb-2">
                    <DialogTitle className="text-2xl font-bold text-gray-50">Chi tiết Giao dịch</DialogTitle>
                </DialogHeader>

                <div className="space-y-6"> {/* Main container for sections */}
                    {/* Phần 1: Tổng quan */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        {/* <h3 className="text-lg font-semibold text-gray-200 mb-4">Tổng quan</h3> */}
                        <div className="space-y-4">
                            {/* Mã băm Giao dịch */}
                            <div>
                                <Label className="text-xs font-medium text-gray-400 block mb-1">Mã băm Giao dịch</Label>
                                <div className="flex items-center">
                                    <p className="font-mono text-sm text-gray-200 break-all">{transaction.txHash}</p>
                                    {renderCopyButton(transaction.txHash, "Mã băm Giao dịch")}
                                </div>
                            </div>

                            {/* Trạng thái */}
                            <div>
                                <Label className="text-xs font-medium text-gray-400 block mb-1">Trạng thái: {getStatusBadge(transaction.status)}</Label>

                            </div>

                            {/* Loại */}
                            <div>
                                <Label className="text-xs font-medium text-gray-400 block mb-1">Loại</Label>
                                <div className="flex items-center gap-2">
                                    {getTransactionIcon(transaction.type)}
                                    <span className="capitalize text-sm text-gray-200">{transaction.type}</span>
                                </div>
                            </div>

                            {/* Số lượng */}
                            <div>
                                <Label className="text-xs font-medium text-gray-400 block mb-1">Số lượng</Label>
                                <p className="font-bold text-lg text-green-400">{transaction.amountDeposit}</p>
                            </div>
                        </div>
                    </div>

                    {/* Phần 2: Đối tượng & Hợp đồng */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        {/* <h3 className="text-lg font-semibold text-gray-200 mb-4">Đối tượng & Hợp đồng</h3> */}
                        <div className="space-y-4">
                            {/* Người dùng */}
                            <div>
                                <Label className="text-xs font-medium text-gray-400 block mb-1">Người dùng</Label>
                                <div className="flex items-center">
                                    <p className="font-mono text-sm text-gray-200 break-all">{transaction.userAddress}</p>
                                    {renderCopyButton(transaction.userAddress, "Địa chỉ Người dùng")}
                                </div>
                            </div>

                            {/* Hợp đồng */}
                            <div>
                                <Label className="text-xs font-medium text-gray-400 block mb-1">Hợp đồng</Label>
                                <div className="flex items-center">
                                    <p className="font-mono text-sm text-gray-200 break-all">{transaction.strategyAddress}</p>
                                    {renderCopyButton(transaction.strategyAddress, "Địa chỉ Hợp đồng")}
                                </div>
                            </div>

                            {/* Token */}
                            <div>
                                <Label className="text-xs font-medium text-gray-400 block mb-1">Token</Label>
                                <div className="flex items-center">
                                    <p className="font-mono text-sm text-gray-200 break-all">{transaction.token}</p>
                                    {renderCopyButton(transaction.token, "Địa chỉ Token")}
                                </div>
                            </div>

                            {/* Pool */}
                            <div>
                                <Label className="text-xs font-medium text-gray-400 block mb-1">Pool</Label>
                                <p className="font-medium text-sm text-gray-200">{transaction.poolName}</p>
                            </div>
                        </div>
                    </div>

                    {/* Phần 3: Thời gian */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        {/* <h3 className="text-lg font-semibold text-gray-200 mb-4">Thời gian</h3> */}
                        <div className="space-y-4">
                            {/* Thời gian */}
                            <div>
                                <Label className="text-xs font-medium text-gray-400 block mb-1">Thời gian</Label>
                                <p className="text-sm text-gray-200">{new Date(transaction.createdAt).toLocaleString('vi-VN', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false
                                })}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
