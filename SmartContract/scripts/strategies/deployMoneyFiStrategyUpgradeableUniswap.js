const { ethers, upgrades } = require("hardhat");
const { saveAddress, getAddresses } = require("../contractAddresses");
require("dotenv").config();

//npx hardhat run scripts/strategies/deployMoneyFiStrategyUpgradeableUniswap.js --network sepolia
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MoneyFiStrategyUpgradeableUniswap with account:", deployer.address);

    // Đọc địa chỉ từ .env và contractAddresses
    const addresses = getAddresses();
    const usdc = process.env.USDC_SEPOLIA_ADDRESS; // USDC trên Sepolia
    const weth = process.env.WETH_SEPOLIA_ADDRESS; // WETH trên Sepolia
    const uniswapRouter = process.env.UNISWAP_V2_ROUTER;
    const uniswapFactory = process.env.UNISWAP_V2_FACTORY;
    const router = addresses.MoneyFiRouter;
    const crossChainRouter = addresses.MoneyFiCrossChainRouter;

    if (!usdc || !weth || !uniswapRouter || !uniswapFactory) {
        throw new Error("Missing required addresses in .env");
    }

    // Params cho initialize (sử dụng struct)
    const params = {
        admin: deployer.address,
        baseToken: usdc,
        quoteToken: weth,
        router: router,
        crossChainRouter: crossChainRouter,
        uniswapRouter: uniswapRouter,
        uniswapFactory: uniswapFactory,
        slippageWhenSwapAsset: 200, // 2% slippage
        name: "MoneyFi Uniswap USDC/WETH",
        symbol: "MFUW",
    };

    // Deploy proxy
    const Strategy = await ethers.getContractFactory("MoneyFiStrategyUpgradeableUniswap");
    const strategy = await upgrades.deployProxy(
        Strategy,
        [params],
        { initializer: "initialize", kind: "uups" }
    );

    await strategy.waitForDeployment();
    const strategyAddress = await strategy.getAddress();
    console.log("MoneyFiStrategyUpgradeableUniswap proxy deployed to:", strategyAddress);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(strategyAddress);
    console.log("MoneyFiStrategyUpgradeableUniswap implementation deployed to:", implementationAddress);

    // Lưu địa chỉ
    saveAddress("MoneyFiStrategyUpgradeableUniswap", strategyAddress);
    saveAddress("MoneyFiStrategyUpgradeableUniswap_Implementation", implementationAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });