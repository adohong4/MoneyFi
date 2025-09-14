export const CONTRACT_ADDRESSES = {
  // MoneyFi System Contracts
  MoneyFiController: "0x95f26cFAd70874e8e4FAF33B9a65634a44b10078",
  MoneyFiFundVault: "0xecec15AfAE07feE618D60406a3705945c35C34Cc",
  MoneyFiTokenLp: "0x88C3e7da67170E731B261475F3eB73f477355f4f",
  MoneyFiRouter: "0x2a64f7a1F0fb00d05Da02F37f1Ee0825CfCecb73",
  MoneyFiReferral: "0xA567d2536fC0C6a95A19582db98a68Fe5cf21D76",
  MoneyFiCrossChainRouter: "0xB5C2cFA406Cc99F9164A32EcE5c405e319aBd7eF",

  // Strategies
  MoneyFiStrategyUpgradeableUniswap: "0xd2F0271dD08C331BdEFf475d7345e3590480e1Cf",
  MoneyFiStrategyUpgradeableUniswapV2: "0xAFE224801f88A36958D0Ea49704E920aD35AaDf2",

  // Tokens
  USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // USDC on Sepolia
} as const

export const SEPOLIA_CHAIN_ID = 11155111

export const SEPOLIA_CONFIG = {
  chainId: SEPOLIA_CHAIN_ID,
  name: "Sepolia",
  currency: "ETH",
  explorerUrl: "https://sepolia.etherscan.io",
  rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/JehibbYhz7RXwY9jhJ8pG",
}
