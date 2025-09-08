require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.26", // Hỗ trợ các hợp đồng yêu cầu 0.8.26 (QuickSwap, IMoneyFiCBridgePool)
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "cancun",
        },
      },
      {
        version: "0.8.24", // Hỗ trợ Balancer, Uniswap, và các thư viện external
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "cancun",
        },
      },
      {
        version: "0.8.22", // Hỗ trợ Stargate và OpenZeppelin UUPSUpgradeable
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "paris",
        },
      },
      {
        version: "0.8.21", // Hỗ trợ OpenZeppelin ERC1967Utils
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "paris",
        },
      },
      {
        version: "0.8.20", // Hỗ trợ các hợp đồng của bạn (như MoneyFiStargateCrossChain.sol)
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "paris",
        },
      },
    ],
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [
        process.env.PRIVATE_KEY,
        process.env.PRIVATE_KEY_USER2
      ],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};