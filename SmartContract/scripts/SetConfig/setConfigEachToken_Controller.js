const { ethers } = require("hardhat");
const { getAddresses } = require("../contractAddresses");

// npx hardhat run scripts/SetConfig/setConfigEachToken_Controller.js --network sepolia

async function main() {
    const [deployer] = await ethers.getSigners();
    const addresses = getAddresses();

    // Địa chỉ token
    const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // USDC trên Sepolia
    const BASETOKEN_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // Link trên Sepolia

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

    // 4. Cập nhật Max Percent Liquidity Strategy cho BaseToken
    const maxPercentLiquidity = 100; // 1% (100/10000)
    await moneyFiController.connect(deployer).setMaxPercentLiquidityStrategyToken(BASETOKEN_ADDRESS, maxPercentLiquidity);
    console.log(`Đã cập nhật maxPercentLiquidityStrategyToken cho BaseToken: ${maxPercentLiquidity}%`);

    // 5. Cập nhật Max Deposit Value cho USDC
    // const maxDepositValueUsdc = ethers.parseUnits("1000", 6); // 1000 USDC
    // await moneyFiController.connect(deployer).setMaxDepositValue(USDC_ADDRESS, maxDepositValueUsdc);
    // console.log(`Đã cập nhật maxDepositValueToken cho USDC: ${ethers.formatUnits(maxDepositValueUsdc, 6)} USDC`);

    // 6. Cập nhật Max Deposit Value cho BaseToken
    const maxDepositValueUni = ethers.parseUnits("0.001", 18); // 0.001 BaseToken, decimal 18
    await moneyFiController.connect(deployer).setMaxDepositValue(BASETOKEN_ADDRESS, maxDepositValueUni);
    console.log(`Đã cập nhật maxDepositValueToken cho BaseToken: ${ethers.formatUnits(maxDepositValueUni, 18)} BaseToken`);

    // 9. Xác minh cấu hình
    console.log("\nXác minh cấu hình...");

    const maxPercentUsdc = await moneyFiController.maxPercentLiquidityStrategyToken(USDC_ADDRESS);
    console.log(`maxPercentLiquidityStrategyToken[USDC]: ${maxPercentUsdc}%`);

    const maxPercentUni = await moneyFiController.maxPercentLiquidityStrategyToken(BASETOKEN_ADDRESS);
    console.log(`maxPercentLiquidityStrategyToken[BaseToken]: ${maxPercentUni}%`);

    const maxDepositUsdc = await moneyFiController.maxDepositValueToken(USDC_ADDRESS);
    console.log(`maxDepositValueToken[USDC]: ${ethers.formatUnits(maxDepositUsdc, 6)} USDC`);

    const maxDepositUni = await moneyFiController.maxDepositValueToken(BASETOKEN_ADDRESS);
    console.log(`maxDepositValueToken[BaseToken]: ${ethers.formatUnits(maxDepositUni, 18)} BaseToken`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Lỗi:", error.message);
        process.exit(1);
    });