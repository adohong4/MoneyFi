const { ethers } = require("hardhat");
const { getAddresses } = require("../scripts/contractAddresses");

// npx hardhat run test/checkPoolInfor.js --network sepolia

async function main() {
    // Lấy signer (deployer)
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    // Lấy địa chỉ từ contractAddresses
    const addresses = getAddresses();
    const strategyAddress = addresses.UniswapV2_USDC_WETH; // Địa chỉ pool USDC/LINK
    console.log("Checking pool USDC/LINK at address:", strategyAddress);

    // Kết nối với hợp đồng MoneyFiStrategyUpgradeableUniswap
    const strategy = await ethers.getContractAt(
        "MoneyFiStrategyUpgradeableUniswap",
        strategyAddress,
        deployer
    );

    console.log("\n=== Checking MoneyFiStrategyUpgradeableUniswap Configurations ===");

    // Kiểm tra baseToken và quoteToken để xác minh pool USDC/LINK
    const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // USDC trên Sepolia
    const LINK_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // LINK trên Sepolia
    const baseTokenAddress = await strategy.baseToken();
    const quoteTokenAddress = await strategy.quoteToken();

    console.log("BaseToken address:", baseTokenAddress);
    console.log("QuoteToken address:", quoteTokenAddress);

    // Xác minh pool là USDC/LINK
    if (
        baseTokenAddress.toLowerCase() !== USDC_ADDRESS.toLowerCase() ||
        quoteTokenAddress.toLowerCase() !== LINK_ADDRESS.toLowerCase()
    ) {
        console.warn("Warning: This pool may not be USDC/LINK as expected!");
    } else {
        console.log("Confirmed: Pool is USDC/LINK");
    }

    // Xác định decimals cho baseToken (USDC: 6, LINK: 18)
    let decimals = 18; // Mặc định
    if (baseTokenAddress.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
        decimals = 6;
        console.log("BaseToken is USDC, using 6 decimals");
    } else {
        const tokenContract = await ethers.getContractAt(
            ["function decimals() view returns (uint8)"],
            baseTokenAddress,
            deployer
        );
        decimals = await tokenContract.decimals();
        console.log(`BaseToken decimals fetched: ${decimals}`);
    }

    // Kiểm tra minimumSwapAmount
    try {
        const minimumSwapAmount = await strategy.minimumSwapAmount();
        console.log(
            "Current minimumSwapAmount:",
            ethers.formatUnits(minimumSwapAmount, decimals),
            baseTokenAddress.toLowerCase() === USDC_ADDRESS.toLowerCase() ? "USDC" : "tokens"
        );
    } catch (error) {
        console.error("Failed to fetch minimumSwapAmount:", error.message);
    }

    // Kiểm tra slippageWhenSwapAsset
    try {
        const slippageWhenSwapAsset = await strategy.slippageWhenSwapAsset();
        // Slippage được lưu dưới dạng bps (1% = 100 bps), chuyển đổi sang phần trăm
        console.log(
            "Current slippageWhenSwapAsset:",
            ethers.formatUnits(slippageWhenSwapAsset, 2),
            "%"
        );
    } catch (error) {
        console.error("Failed to fetch slippageWhenSwapAsset:", error.message);
    }

    console.log("\n=== Verification Complete ===");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Check failed:", error.message);
        process.exit(1);
    });