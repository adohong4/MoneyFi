// scripts/dex/deployMoneyFiUniSwap.js
const { ethers, upgrades } = require("hardhat");
const { saveAddress } = require("../contractAddresses");
require("dotenv").config();

// npx hardhat run scripts/dex/deployMoneyFiUniSwap.js --network sepolia

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MoneyFiUniSwap with account:", deployer.address);

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

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(uniSwapAddress);
    console.log("MoneyFiUniswap implementation deployed to:", implementationAddress);

    saveAddress("MoneyFiUniswap", uniSwapAddress);
    saveAddress("MoneyFiUniSwap_implementation", implementationAddress);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
