const { ethers, upgrades } = require("hardhat");
const { saveAddress, getAddresses } = require("../contractAddresses");
require("dotenv").config();

// npx hardhat run scripts/strategies/deployMoneyFiStartegyUniLink.js --network sepolia
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MoneyFiStrategyUpgradeableUniswapV2 for UNI/LINK with account:", deployer.address);

    // Đọc địa chỉ từ .env và contractAddresses
    const addresses = getAddresses();
    const uni = process.env.UNI_SEPOLIA_ADDRESS; // UNI trên Sepolia
    const link = process.env.LINK_SEPOLIA_ADDRESS; // LINK trên Sepolia
    const uniswapRouter = process.env.UNISWAP_V2_ROUTER;
    const uniswapFactory = process.env.UNISWAP_V2_FACTORY;
    const router = addresses.MoneyFiRouter;
    const crossChainRouter = addresses.MoneyFiCrossChainRouter;

    const nameParam = "MoneyFi UniswapV2 UNI/LINK";
    const symbolParam = "MFUWV2-UNI-LINK";
    const minimumSwapAmount = ethers.parseUnits("0.01", 18); // 0.01 UNI hoặc LINK (giả sử 18 decimals)
    const slippageWhenSwapAsset = 50; // 0.5% slippage

    // Kiểm tra các địa chỉ cần thiết
    if (!uni || !link || !uniswapRouter || !uniswapFactory || !router || !crossChainRouter) {
        throw new Error("Missing required addresses in .env or contractAddresses");
    }

    // Params cho initialize (sử dụng struct)
    const params = {
        admin: deployer.address,
        baseToken: uni, // UNI là baseToken
        quoteToken: link, // LINK là quoteToken
        router: router,
        crossChainRouter: crossChainRouter,
        uniswapRouter: uniswapRouter,
        uniswapFactory: uniswapFactory,
        slippageWhenSwapAsset: slippageWhenSwapAsset,
        minimumSwapAmount: minimumSwapAmount,
        name: nameParam,
        symbol: symbolParam,
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
    console.log("MoneyFiStrategyUpgradeableUniswapV2 UNI/LINK proxy deployed to:", strategyAddress);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(strategyAddress);
    console.log("MoneyFiStrategyUpgradeableUniswapV2 UNI/LINK implementation deployed to:", implementationAddress);

    // Lưu địa chỉ
    saveAddress("MoneyFiStrategyUpgradeableUniswapV2_UNI_LINK", strategyAddress);
    saveAddress("MoneyFiStrategyUpgradeableUniswapV2_UNI_LINK_Implementation", implementationAddress);

    // Kiểm tra cấu hình sau deploy
    console.log("=== Post-Deploy Checks ===");
    console.log("Base token:", await strategy.baseToken());
    console.log("Quote token:", await strategy.quoteToken());
    console.log("Uniswap Router:", await strategy.uniswapRouter());
    console.log("Uniswap Factory:", await strategy.uniswapFactory());
    console.log("Uniswap Pair:", await strategy.uniswapPair());
    console.log("Slippage:", (await strategy.slippageWhenSwapAsset()).toString());
    console.log("Minimum swap amount:", ethers.formatUnits(await strategy.minimumSwapAmount(), 18));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });