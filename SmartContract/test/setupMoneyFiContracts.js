const { ethers } = require("hardhat");
require("dotenv").config();

// npx hardhat run test/setupMoneyFiContracts.js --network sepolia

async function main() {
    const [deployer] = await ethers.getSigners();
    const usdcAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Địa chỉ USDC trên Sepolia
    const strategyAddress = "0x1214be5E927B4345D28C02534720d91AdE55e3C2"; // MoneyFiStrategyUpgradeableUniswap
    const tokenLpAddress = "0x0bF168574B7C35d7C688217b27b51B075143619b";
    const controllerAddress = "0xB3f3a2D10BA3cfFd7aea35dEbB374ec692396448";

    if (!usdcAddress || !strategyAddress) {
        throw new Error("Missing USDC or Strategy address");
    }

    const controller = await ethers.getContractAt("MoneyFiController", controllerAddress);

    console.log(`Setup script running with deployer: ${deployer.address}`);

    // 1. Thiết lập strategyInternal trong MoneyFiController
    const isStrategyActive = await controller.isStrategyInternalActive(strategyAddress);
    console.log(`Is strategy ${strategyAddress} active? ${isStrategyActive}`);
    if (!isStrategyActive) {
        console.log("Adding strategy to MoneyFiController...");
        const strategyInfo = {
            name: "UniswapStrategy",
            chainId: 11155111,
            isActive: true
        };
        const tx = await controller.connect(deployer).setStrategyInternal(strategyAddress, strategyInfo, { gasLimit: 300000 });
        await tx.wait();
        console.log(`Strategy added, tx: ${tx.hash}`);
    }

    // 2. Thiết lập tokenInternal cho USDC trong MoneyFiController
    const tokenInfo = await controller.getSupportedTokenInternalInfor(usdcAddress);
    console.log(`TokenInternal for USDC active? ${tokenInfo.isActive}`);
    if (!tokenInfo.isActive) {
        console.log(`Setting tokenInternal for USDC ${usdcAddress}...`);
        const newTokenInfo = {
            minDepositAmount: ethers.parseUnits("0.1", 6),
            decimals: 6,
            chainId: 11155111,
            isActive: true,
            lpTokenAddress: tokenLpAddress
        };
        const tx = await controller.connect(deployer).setTokenInfoInternal(usdcAddress, newTokenInfo, { gasLimit: 300000 });
        await tx.wait();
        console.log(`TokenInternal set, tx: ${tx.hash}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });