export const APP_CONFIG = {
  name: "DeFi Yield Platform",
  description: "Multi-chain DeFi platform for USDC/USDT deposits and yield farming",
  version: "1.0.0",
  author: "DeFi Team",
}

export const API_ENDPOINTS = {
  connectWallet: "/user/connectWallet",
  deposits: "/user/deposit",
  userInfor: "/user/infor",
  userBalance: "/user/balance",
  withdrawals: "/api/withdrawals",
  stats: "/api/stats",
  leaderboard: "/api/leaderboard",
  referrals: "/api/referrals",
}

export const REFERRAL_API_ENDPOINTS = {
  referralRank: "/referral/getRank"
}

export const CONTRACT_ADDRESSES = {
  1: {
    // Ethereum
    vault: "0x...",
    usdc: "0xA0b86a33E6441c8C06DD2b7c94b7E0e8c07e8e8e",
    usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
  56: {
    // BSC
    vault: "0x...",
    usdc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    usdt: "0x55d398326f99059fF775485246999027B3197955",
  },
  // Add other chains...
}


export const TOKENS_ADDRESSES = {
  LP_TOKEN: "0x88C3e7da67170E731B261475F3eB73f477355f4f",
  USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
}