// scripts/dex/checkPools.js
const { ethers } = require("hardhat");
require("dotenv").config();

const USDC = "0x68194a729C2450ad26072b3D33ADaCbcef39D574";
const WETH = process.env.WETH_SEPOLIA_ADDRESS;
const UNI = process.env.MONEYFI_UNISWAP || "0x1a185652bC1F56CB460873C36F7Ae0912E56Fbd0";

async function main() {
    const uniSwap = await ethers.getContractAt("MoneyFiUniSwap", UNI);
    const factoryV3 = await ethers.getContractAt("IUniswapV3Factory", await uniSwap.factoryV3());
    const fees = [100, 500, 3000, 10000];
    for (const f of fees) {
        try {
            const pool = await factoryV3.getPool(USDC, WETH, f);
            console.log(`fee ${f} -> pool:`, pool);
        } catch (e) {
            console.log(`fee ${f} -> error:`, e.message);
        }
    }
}
main().catch(console.error);
