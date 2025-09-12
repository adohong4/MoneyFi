const { ethers } = require("hardhat");
const { getAddresses } = require("../contractAddresses");

// npx hardhat run scripts/SetConfig/setConfigEachToken_Controller.js --network sepolia

async function main() {
    const [deployer] = await ethers.getSigners();
    const addresses = getAddresses();

    // Địa chỉ token
    const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // USDC trên Sepolia
    const UNI_ADDRESS = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"; // UNI trên Sepolia

    // Kết nối MoneyFiController
    const moneyFiController = await ethers.getContractAt(
        "MoneyFiController",
        addresses.MoneyFiController,
        deployer
    );

    console.log("Deployer address:", deployer.address);
    console.log("MoneyFiController address:", addresses.MoneyFiController);


    // 3. Cập nhật Max Percent Liquidity Strategy cho USDC
    // const maxPercentLiquidityUsdc = 10000; // 100% (10000/10000)
    // await moneyFiController.connect(deployer).setMaxPercentLiquidityStrategyToken(USDC_ADDRESS, maxPercentLiquidityUsdc);
    // console.log(`Đã cập nhật maxPercentLiquidityStrategyToken cho USDC: ${maxPercentLiquidityUsdc}%`);

    // 4. Cập nhật Max Percent Liquidity Strategy cho UNI
    const maxPercentLiquidityUni = 100; // 1% (100/10000)
    await moneyFiController.connect(deployer).setMaxPercentLiquidityStrategyToken(UNI_ADDRESS, maxPercentLiquidityUni);
    console.log(`Đã cập nhật maxPercentLiquidityStrategyToken cho UNI: ${maxPercentLiquidityUni}%`);

    // 5. Cập nhật Max Deposit Value cho USDC
    // const maxDepositValueUsdc = ethers.parseUnits("1000", 6); // 1000 USDC
    // await moneyFiController.connect(deployer).setMaxDepositValue(USDC_ADDRESS, maxDepositValueUsdc);
    // console.log(`Đã cập nhật maxDepositValueToken cho USDC: ${ethers.formatUnits(maxDepositValueUsdc, 6)} USDC`);

    // 6. Cập nhật Max Deposit Value cho UNI
    const maxDepositValueUni = ethers.parseUnits("0.001", 18); // 0.001 UNI
    await moneyFiController.connect(deployer).setMaxDepositValue(UNI_ADDRESS, maxDepositValueUni);
    console.log(`Đã cập nhật maxDepositValueToken cho UNI: ${ethers.formatUnits(maxDepositValueUni, 18)} UNI`);

    // 9. Xác minh cấu hình
    console.log("\nXác minh cấu hình...");

    const maxPercentUsdc = await moneyFiController.maxPercentLiquidityStrategyToken(USDC_ADDRESS);
    console.log(`maxPercentLiquidityStrategyToken[USDC]: ${maxPercentUsdc}%`);

    const maxPercentUni = await moneyFiController.maxPercentLiquidityStrategyToken(UNI_ADDRESS);
    console.log(`maxPercentLiquidityStrategyToken[UNI]: ${maxPercentUni}%`);

    const maxDepositUsdc = await moneyFiController.maxDepositValueToken(USDC_ADDRESS);
    console.log(`maxDepositValueToken[USDC]: ${ethers.formatUnits(maxDepositUsdc, 6)} USDC`);

    const maxDepositUni = await moneyFiController.maxDepositValueToken(UNI_ADDRESS);
    console.log(`maxDepositValueToken[UNI]: ${ethers.formatUnits(maxDepositUni, 18)} UNI`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Lỗi:", error.message);
        process.exit(1);
    });