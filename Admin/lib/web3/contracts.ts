import { ethers } from "ethers"
import { CONTRACT_ADDRESSES } from "./config"
import MoneyFiRouterJSON from "@/contracts/MoneyFiController.json";
import MoneyFiFundVaultJSON from "@/contracts/MoneyFiFundVault.json";


const MoneyFiRouterABI = MoneyFiRouterJSON.abi;
const MoneyFiFundVaultABI = MoneyFiFundVaultJSON.abi;

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
]

export function getContract(address: string, abi: ethers.InterfaceAbi, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, abi, signerOrProvider)
}

export function getMoneyFiController(signerOrProvider: ethers.Signer | ethers.Provider) {
  return getContract(CONTRACT_ADDRESSES.MONEYFI_CONTROLLER, MoneyFiRouterABI, signerOrProvider)
}

export function getMoneyFiFundVault(signerOrProvider: ethers.Signer | ethers.Provider) {
  return getContract(CONTRACT_ADDRESSES.MONEYFI_FUND_VAULT, MoneyFiFundVaultABI, signerOrProvider)
}

export function getERC20Contract(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return getContract(address, ERC20_ABI, signerOrProvider)
}
