import { ethers } from "ethers"
import { CONTRACT_ADDRESSES } from "./config"

// Contract ABIs (simplified for demo)
export const MONEYFI_CONTROLLER_ABI = [
  "function getSystemConfig() view returns (tuple(uint256 protocolFee, uint256 referralFee, uint256 withdrawalFee, bool isActive))",
  "function setProtocolFee(uint256 _protocolFee) external",
  "function setReferralFee(uint256 _referralFee) external",
  "function setWithdrawalFee(uint256 _withdrawalFee) external",
  "function pause() external",
  "function unpause() external",
  "function isAdmin(address _sender) view returns (bool)",
  "function grantRole(bytes32 role, address account) external",
  "function revokeRole(bytes32 role, address account) external",
  "event SystemConfigUpdated(uint256 protocolFee, uint256 referralFee, uint256 withdrawalFee)",
  "event Paused(address account)",
  "event Unpaused(address account)",
]

export const MONEYFI_FUND_VAULT_ABI = [
  "function depositFund(address _tokenAddress, address _receiver, uint256 _amount) external returns (uint256)",
  "function withdrawUnDistributedFundToUser(address _userAddress, address _receiver, address _tokenAddress, uint256 _amount) external",
  "function getUserDepositInfor(address _token, address _user) view returns (tuple(uint256 originalDepositAmount, uint256 currentDepositAmount, uint256 durationDeposit, uint256 updatedAt))",
  "function totalProtocolFee(address token) view returns (uint256)",
  "function referralFee(address token) view returns (uint256)",
  "function rebalanceFee(address token) view returns (uint256)",
  "function withdrawFee(address token) view returns (uint256)",
  "event DepositFundVault(address tokenAddress, address receiver, uint256 depositAmount, uint256 actualDepositAmount, uint256 depositedAt)",
  "event WithdrawUnDistributedFundToUserFundVault(address userAddress, address tokenAddress, uint256 amount, uint256 withdrawAt)",
]

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

export function getContract(address: string, abi: string[], signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, abi, signerOrProvider)
}

export function getMoneyFiController(signerOrProvider: ethers.Signer | ethers.Provider) {
  return getContract(CONTRACT_ADDRESSES.MONEYFI_CONTROLLER, MONEYFI_CONTROLLER_ABI, signerOrProvider)
}

export function getMoneyFiFundVault(signerOrProvider: ethers.Signer | ethers.Provider) {
  return getContract(CONTRACT_ADDRESSES.MONEYFI_FUND_VAULT, MONEYFI_FUND_VAULT_ABI, signerOrProvider)
}

export function getERC20Contract(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return getContract(address, ERC20_ABI, signerOrProvider)
}
