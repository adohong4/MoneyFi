const { ethers } = require("hardhat");
const { getAddresses } = require("../contractAddresses");

// npx hardhat run scripts/SetConfig/setConfig_Strategy.js --network sepolia

async function main() {
    const [deployer] = await ethers.getSigners();
    const addresses = getAddresses();

    // Kết nối với hợp đồng UniswapV2_LINK_WETH
    const strategy = await ethers.getContractAt(
        "MoneyFiStrategyUpgradeableUniswapV2",
        addresses.UniswapV2_UNI_LINK,
        deployer
    );

    console.log("Deployer address:", deployer.address);
    console.log("MoneyFiStrategyUpgradeableUniswapV2 address:", addresses.UniswapV2_UNI_LINK);
    console.log("\n=== Setting up MoneyFiStrategyUpgradeableUniswapV2 Configurations ===");

    // 2. Kiểm tra và set minimumSwapAmount
    try {
        const currentMinimumSwapAmount = await strategy.minimumSwapAmount();
        const newMinimumSwapAmount = ethers.parseUnits("0.00000001", 18); // Ví dụ: 0,00001 USDC, điều chỉnh theo ý bạn

        console.log("Current minimumSwapAmount:", ethers.formatUnits(currentMinimumSwapAmount, 18));
        console.log("Desired minimumSwapAmount:", ethers.formatUnits(newMinimumSwapAmount, 18));
    } catch (error) {
        console.error("Failed to set minimumSwapAmount:", error.message);
    }

    // 3. Xác minh thiết lập
    console.log("\n=== Verifying MoneyFiStrategyUpgradeableUniswapV2 Configurations ===");
    const updatedMinimumSwapAmount = await strategy.minimumSwapAmount();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Setup failed:", error.message);
        process.exit(1);
    });