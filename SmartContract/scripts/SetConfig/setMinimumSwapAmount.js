// scripts/SetConfig/setMinimumSwapAmount_StrategyUniLink.js
const { ethers } = require("hardhat");
require("dotenv").config();

// npx hardhat run scripts/SetConfig/setMinimumSwapAmount_StrategyUniLink.js --network sepolia
async function main() {
    const [deployer] = await ethers.getSigners();

    const strategyAddress = process.env.UNISWAP_V2_UNI_LINK; // Strategy UNI/LINK từ .env
    const targetMinimumSwapAmount = ethers.parseUnits("0.000001", 18); // 0.000001 UNI (điều chỉnh nếu cần)

    const strategy = await ethers.getContractAt("MoneyFiStrategyUpgradeableUniswapV2", strategyAddress, deployer);

    console.log("Deployer address:", deployer.address);
    console.log("Strategy address:", strategyAddress);
    console.log("\n=== Setting up Minimum Swap Amount in Strategy ===");

    // 1. Kiểm tra quyền DELEGATE_ADMIN_ROLE
    const isDelegateAdmin = await strategy.isDelegateAdmin(deployer.address);
    console.log(`Is ${deployer.address} delegate admin? ${isDelegateAdmin}`);

    // 2. Kiểm tra minimumSwapAmount hiện tại
    const currentMinimumSwapAmount = await strategy.minimumSwapAmount();
    console.log("Current Minimum Swap Amount:", ethers.formatUnits(currentMinimumSwapAmount, 18), "UNI");

    // 3. Set Minimum Swap Amount nếu khác
    try {
        if (currentMinimumSwapAmount !== targetMinimumSwapAmount) {
            const tx = await strategy.connect(deployer).setMinimumSwapAmount(targetMinimumSwapAmount);
            await tx.wait();
            console.log("Set Minimum Swap Amount to:", ethers.formatUnits(targetMinimumSwapAmount, 18), "UNI");
        } else {
            console.log("Minimum Swap Amount already set to:", ethers.formatUnits(targetMinimumSwapAmount, 18), "UNI");
        }
    } catch (error) {
        console.error("Failed to set Minimum Swap Amount:", error.message);
    }

    // 4. Xác minh thiết lập
    console.log("\n=== Verifying Minimum Swap Amount ===");
    const newMinimumSwapAmount = await strategy.minimumSwapAmount();
    console.log("New Minimum Swap Amount:", ethers.formatUnits(newMinimumSwapAmount, 18), "UNI", newMinimumSwapAmount === targetMinimumSwapAmount ? "(Correct)" : "(Incorrect)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Setup failed:", error.message);
        process.exit(1);
    });