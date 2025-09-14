"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAccount, useChainId } from "wagmi"
import { DollarSign, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sepolia } from "wagmi/chains"
import { ContractService } from "@/src/services/contractService"
import { ethers } from "ethers"

export function DepositModal() {
  const [amount, setAmount] = useState("")
  const [isDepositing, setIsDepositing] = useState(false)
  const [open, setOpen] = useState(false)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { toast } = useToast()

  const handleDeposit = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      })
      return
    }

    if (!address || !isConnected || !window.ethereum) {
      toast({
        title: "Wallet Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    setIsDepositing(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contractService = new ContractService(provider)

      const depositTx = await contractService.depositFund(amount)
      await depositTx.wait()

      toast({
        title: "Deposit Successful",
        description: `Successfully deposited ${amount} USDC on Sepolia`,
      })
      setAmount("")
      setOpen(false)
    } catch (error: any) {
      toast({
        title: "Deposit Failed",
        description: error.message || "Failed to deposit USDC. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDepositing(false)
    }
  }

  if (!isConnected) return null

  const isCorrectNetwork = chainId === sepolia.id

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={!isCorrectNetwork}>
          <DollarSign className="w-4 h-4" />
          Deposit USDC
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit USDC</DialogTitle>
          <DialogDescription>Deposit USDC to start earning yield on Sepolia testnet</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (USDC)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Network: {isCorrectNetwork ? "Sepolia ✓" : "Wrong Network ✗"}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleDeposit} disabled={isDepositing || !amount || !isCorrectNetwork} className="w-full">
            {isDepositing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Depositing...
              </>
            ) : (
              "Deposit USDC"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
