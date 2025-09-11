// scripts/SetConfig/setConfig_MoneyFiUniSwap.js
const { ethers } = require("hardhat");
const { getAddresses } = require("../contractAddresses");
require("dotenv").config();

// npx hardhat run scripts/SetConfig/setConfig_MoneyFiUniSwap.js --network sepolia
async function main() {
    const [deployer] = await ethers.getSigners();
    const addresses = getAddresses();

    // Lấy địa chỉ từ .env
    const uniswapV3Router = process.env.UNISWAP_V3_ROUTER;
    const uniswapV2Router = process.env.UNISWAP_V2_ROUTER;
    const uniswapV3Factory = process.env.UNISWAP_V3_FACTORY;
    const uniswapV2Factory = process.env.UNISWAP_V2_FACTORY;

    // Kiểm tra xem MoneyFiUniSwap address có tồn tại không
    if (!addresses.MoneyFiUniswap) {
        throw new Error("MoneyFiUniSwap address is undefined in contractAddresses.js");
    }

    const moneyFiUniSwap = await ethers.getContractAt(
        "MoneyFiUniSwap",
        addresses.MoneyFiUniswap,
        deployer
    );

    console.log("Deployer address:", deployer.address);
    console.log("MoneyFiUniSwap address:", addresses.MoneyFiUniSwap);
    console.log("\n=== Setting up MoneyFiUniSwap Configurations ===");

    // 1. Kiểm tra quyền ADMIN_ROLE và DELEGATE_ADMIN_ROLE
    const isAdmin = await moneyFiUniSwap.isAdmin(deployer.address);
    console.log(`Is ${deployer.address} admin? ${isAdmin}`);

    const isDelegateAdmin = await moneyFiUniSwap.isDelegateAdmin(deployer.address);
    console.log(`Is ${deployer.address} delegate admin? ${isDelegateAdmin}`);

    // 2. Set RouterV3
    try {
        const currentRouterV3 = await moneyFiUniSwap.routerV3();
        if (currentRouterV3.toLowerCase() !== uniswapV3Router.toLowerCase()) {
            const txRouterV3 = await moneyFiUniSwap.connect(deployer).setRouterV3(uniswapV3Router);
            await txRouterV3.wait();
            console.log("Set RouterV3 address:", uniswapV3Router);
        } else {
            console.log("RouterV3 already set to:", uniswapV3Router);
        }
    } catch (error) {
        console.error("Failed to set RouterV3:", error.message);
    }

    // 3. Set RouterV2
    try {
        const currentRouterV2 = await moneyFiUniSwap.routerV2();
        if (currentRouterV2.toLowerCase() !== uniswapV2Router.toLowerCase()) {
            const txRouterV2 = await moneyFiUniSwap.connect(deployer).setRouterV2(uniswapV2Router);
            await txRouterV2.wait();
            console.log("Set RouterV2 address:", uniswapV2Router);
        } else {
            console.log("RouterV2 already set to:", uniswapV2Router);
        }
    } catch (error) {
        console.error("Failed to set RouterV2:", error.message);
    }

    // 4. Set FactoryV3
    try {
        const currentFactoryV3 = await moneyFiUniSwap.factoryV3();
        if (currentFactoryV3.toLowerCase() !== uniswapV3Factory.toLowerCase()) {
            const txFactoryV3 = await moneyFiUniSwap.connect(deployer).setFactoryV3(uniswapV3Factory);
            await txFactoryV3.wait();
            console.log("Set FactoryV3 address:", uniswapV3Factory);
        } else {
            console.log("FactoryV3 already set to:", uniswapV3Factory);
        }
    } catch (error) {
        console.error("Failed to set FactoryV3:", error.message);
    }

    // 5. Set FactoryV2
    try {
        const currentFactoryV2 = await moneyFiUniSwap.factoryV2();
        if (currentFactoryV2.toLowerCase() !== uniswapV2Factory.toLowerCase()) {
            const txFactoryV2 = await moneyFiUniSwap.connect(deployer).setFactoryV2(uniswapV2Factory);
            await txFactoryV2.wait();
            console.log("Set FactoryV2 address:", uniswapV2Factory);
        } else {
            console.log("FactoryV2 already set to:", uniswapV2Factory);
        }
    } catch (error) {
        console.error("Failed to set FactoryV2:", error.message);
    }

    // 6. Set PoolFee
    const targetPoolFee = 1000; // Pool fee bạn muốn thiết lập
    try {
        const currentPoolFee = await moneyFiUniSwap.poolFee();
        // Chuyển BigNumber sang số nguyên
        if (Number(currentPoolFee) !== targetPoolFee) {
            const txPoolFee = await moneyFiUniSwap.connect(deployer).setPoolFee(targetPoolFee);
            await txPoolFee.wait();
            console.log("Set PoolFee:", targetPoolFee);
        } else {
            console.log("PoolFee already set to:", targetPoolFee);
        }
    } catch (error) {
        console.error("Failed to set PoolFee:", error.message);
    }

    // 7. Xác minh cấu hình
    console.log("\n=== Verifying MoneyFiUniSwap Configurations ===");
    const routerV3 = await moneyFiUniSwap.routerV3();
    console.log("RouterV3 address:", routerV3, routerV3.toLowerCase() === uniswapV3Router.toLowerCase() ? "(Correct)" : "(Incorrect)");

    const routerV2 = await moneyFiUniSwap.routerV2();
    console.log("RouterV2 address:", routerV2, routerV2.toLowerCase() === uniswapV2Router.toLowerCase() ? "(Correct)" : "(Incorrect)");

    const factoryV3 = await moneyFiUniSwap.factoryV3();
    console.log("FactoryV3 address:", factoryV3, factoryV3.toLowerCase() === uniswapV3Factory.toLowerCase() ? "(Correct)" : "(Incorrect)");

    const factoryV2 = await moneyFiUniSwap.factoryV2();
    console.log("FactoryV2 address:", factoryV2, factoryV2.toLowerCase() === uniswapV2Factory.toLowerCase() ? "(Correct)" : "(Incorrect)");

    const poolFee = await moneyFiUniSwap.poolFee();
    console.log("PoolFee:", Number(poolFee), Number(poolFee) === targetPoolFee ? "(Correct)" : "(Incorrect)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Setup failed:", error.message);
        process.exit(1);
    });