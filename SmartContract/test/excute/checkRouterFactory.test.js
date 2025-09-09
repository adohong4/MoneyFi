// scripts/dex/checkRouterFactory.js
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    const uniSwapAddress = process.env.MONEYFI_UNISWAP || "0x1a185652bC1F56CB460873C36F7Ae0912E56Fbd0";
    const uniSwap = await ethers.getContractAt("MoneyFiUniSwap", uniSwapAddress);
    console.log("proxy:", uniSwapAddress);
    console.log("routerV3:", await uniSwap.routerV3());
    console.log("routerV2:", await uniSwap.routerV2());
    console.log("factoryV3:", await uniSwap.factoryV3());
    console.log("factoryV2:", await uniSwap.factoryV2());
}
main().catch(console.error);
