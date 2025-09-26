// Web3 Configuration
export const SUPPORTED_CHAINS = {
  SEPOLIA: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/JehibbYhz7RXwY9jhJ8pG",
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
  MONEYFI_ROUTER_CROSS_CHAIN: "0xB5C2cFA406Cc99F9164A32EcE5c405e319aBd7eF",
  MONEYFI_REFERRAL: "0xA567d2536fC0C6a95A19582db98a68Fe5cf21D76",
} as const

export const TOKEN_ADDRESSES = {
  LP_TOKEN_SEPOLIA: "0x88C3e7da67170E731B261475F3eB73f477355f4f",
  USDC_SEPOLIA: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  WETH_SEPOLIA: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
  ARB_SEPOLIA: "0x9734Fb63E86217EfBC54Bba85571bf173879CAE5",
  LINK_SEPOLIA: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
  UNI_SEPOLIA: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
} as const

export const UNISWAPV2_ADDRESSES = {
  UNISWAP_V2_ROUTER: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",
  UNISWAP_V2_FACTORY: "0xF62c03E08ada871A0bEb309762E260a7a6a880E6",
} as const

export const DEFAULT_CHAIN_ID = SUPPORTED_CHAINS.SEPOLIA.chainId
export const DEFAULT_RPC_URL = SUPPORTED_CHAINS.SEPOLIA.rpcUrl
export const WALLET_CONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ""
