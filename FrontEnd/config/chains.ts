export interface ChainConfig {
  id: number
  name: string
  symbol: string
  rpcUrl: string
  blockExplorer: string
  icon: string
}

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    id: 1,
    name: "Ethereum",
    symbol: "ETH",
    rpcUrl: "https://mainnet.infura.io/v3/",
    blockExplorer: "https://etherscan.io",
    icon: "/ethereum-abstract.png",
  },
  {
    id: 56,
    name: "BNB Smart Chain",
    symbol: "BNB",
    rpcUrl: "https://bsc-dataseed.binance.org/",
    blockExplorer: "https://bscscan.com",
    icon: "/bnb.jpg",
  },
  {
    id: 42161,
    name: "Arbitrum One",
    symbol: "ARB",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorer: "https://arbiscan.io",
    icon: "/arbitrum-abstract.png",
  },
  {
    id: 8453,
    name: "Base",
    symbol: "BASE",
    rpcUrl: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
    icon: "/foundational-structure.png",
  },
  {
    id: 1116,
    name: "Core DAO",
    symbol: "CORE",
    rpcUrl: "https://rpc.coredao.org/",
    blockExplorer: "https://scan.coredao.org",
    icon: "/core.jpg",
  },
]
