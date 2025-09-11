const { ethers, upgrades } = require("hardhat");
const { saveAddress, getAddresses } = require("../contractAddresses");
require("dotenv").config();

// npx hardhat run scripts/strategies/deployMoneyFiStrategyUpgradeableUniswapV2.js --network sepolia
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MoneyFiStrategyUpgradeableUniswapV2 with account:", deployer.address);

    // Đọc địa chỉ từ .env và contractAddresses
    const addresses = getAddresses();
    const usdc = process.env.USDC_SEPOLIA_ADDRESS; // USDC trên Sepolia
    const weth = process.env.WETH_SEPOLIA_ADDRESS; // WETH trên Sepolia
    const arb = process.env.ARB_SEPOLIA_ADDRESS; // ARB trên Sepolia

    const uniswapRouter = process.env.UNISWAP_V2_ROUTER;
    const uniswapFactory = process.env.UNISWAP_V2_FACTORY;
    const router = addresses.MoneyFiRouter;
    const crossChainRouter = addresses.MoneyFiCrossChainRouter;

    if (!usdc || !weth || !uniswapRouter || !uniswapFactory || !router || !crossChainRouter) {
        throw new Error("Missing required addresses in .env or contractAddresses");
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
        slippageWhenSwapAsset: 50, // 0.5% slippage (giảm từ 2% để tránh lỗi slippage)
        name: "MoneyFi UniswapV2 USDC/WETH",
        symbol: "MFUWV2",
    };

    // Deploy proxy
    const Strategy = await ethers.getContractFactory("MoneyFiStrategyUpgradeableUniswapV2");
    const strategy = await upgrades.deployProxy(
        Strategy,
        [params], // Truyền struct dưới dạng object
        { initializer: "initialize", kind: "uups" }
    );

    await strategy.waitForDeployment();
    const strategyAddress = await strategy.getAddress();
    console.log("MoneyFiStrategyUpgradeableUniswapV2 proxy deployed to:", strategyAddress);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(strategyAddress);
    console.log("MoneyFiStrategyUpgradeableUniswapV2 implementation deployed to:", implementationAddress);

    // Lưu địa chỉ
    saveAddress("MoneyFiStrategyUpgradeableUniswapV2", strategyAddress);
    saveAddress("MoneyFiStrategyUpgradeableUniswapV2_Implementation", implementationAddress);

    // Kiểm tra cấu hình sau deploy
    console.log("=== Post-Deploy Checks ===");
    console.log("Base token:", await strategy.baseToken());
    console.log("Quote token:", await strategy.quoteToken());
    console.log("Uniswap Router:", await strategy.uniswapRouter());
    console.log("Uniswap Factory:", await strategy.uniswapFactory());
    console.log("Uniswap Pair:", await strategy.uniswapPair());
    console.log("Slippage:", (await strategy.slippageWhenSwapAsset()).toString());
    console.log("Minimum swap amount:", ethers.formatUnits(await strategy.minimumSwapAmount(), 6));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });