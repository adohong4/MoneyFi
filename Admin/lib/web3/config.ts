// Web3 Configuration
export const SUPPORTED_CHAINS = {
  SEPOLIA: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Sepolia ETH",
      symbol: "ETH",
      decimals: 18,
    },
  },
  ETHEREUM: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
} as const

export const CONTRACT_ADDRESSES = {
  MONEYFI_CONTROLLER: "0x95f26cFAd70874e8e4FAF33B9a65634a44b10078",
  MONEYFI_FUND_VAULT: "0xecec15AfAE07feE618D60406a3705945c35C34Cc",
  MONEYFI_ROUTER: "0x2a64f7a1F0fb00d05Da02F37f1Ee0825CfCecb73",
  MONEYFI_REFERRAL: "0xA567d2536fC0C6a95A19582db98a68Fe5cf21D76",
  USDC_SEPOLIA: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  WETH_SEPOLIA: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
} as const

export const DEFAULT_CHAIN_ID = SUPPORTED_CHAINS.SEPOLIA.chainId

export const WALLET_CONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ""
