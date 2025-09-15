"use client"

import { Button } from "@/components/ui/button"
import { useWeb3Modal } from "@web3modal/wagmi/react"
import { useAccount, useDisconnect } from "wagmi"
import { Wallet, LogOut } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiService } from "@/services/api"
import { useEffect } from "react"

export function WalletConnect() {
  const { open } = useWeb3Modal()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    const callConnectAPI = async () => {
      if (isConnected && address) {
        try {
          // nếu có referral code trong URL thì lấy ra
          const urlParams = new URLSearchParams(window.location.search)
          const invitationCode = urlParams.get("ref") || ""
          console.log("address: ", address)
          console.log("invitationCode: ", invitationCode)
          const res = await apiService.connectWallet(address, invitationCode)
          console.log("[API] Connect wallet success:", res)
        } catch (err) {
          console.error("[API] Connect wallet failed:", err)
        }
      }
    }
    callConnectAPI()
  }, [isConnected, address])

  const handleConnect = () => {
    open()
  }

  const handleDisconnect = () => {
    disconnect()
  }

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-transparent">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => open({ view: "Account" })}>
            <Wallet className="w-4 h-4 mr-2" />
            View Account
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDisconnect}>
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button variant="outline" className="gap-2 bg-transparent" onClick={handleConnect}>
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </Button>
  )
}
