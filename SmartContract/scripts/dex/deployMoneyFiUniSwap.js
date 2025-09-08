// scripts/dex/deployMoneyFiUniSwap.js
const { ethers, upgrades } = require("hardhat");
const { saveAddress } = require("../contractAddresses");
require("dotenv").config();

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MoneyFiUniSwap with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    const uniswapV3Router = process.env.UNISWAP_V3_ROUTER;
    const uniswapV2Router = process.env.UNISWAP_V2_ROUTER;
    const uniswapV3Factory = process.env.UNISWAP_V3_FACTORY;
    const uniswapV2Factory = process.env.UNISWAP_V2_FACTORY;

    const MoneyFiUniSwap = await ethers.getContractFactory("MoneyFiUniSwap");
    const uniSwap = await upgrades.deployProxy(
        MoneyFiUniSwap,
        [
            uniswapV3Router,
            uniswapV2Router,
            uniswapV3Factory,
            uniswapV2Factory,
            deployer.address
        ],
        { initializer: "initialize" }
    );

    await uniSwap.waitForDeployment();
    const uniSwapAddress = await uniSwap.getAddress();
    console.log("MoneyFiUniSwap deployed to (proxy):", uniSwapAddress);

    saveAddress("MoneyFiUniSwap", uniSwapAddress);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
