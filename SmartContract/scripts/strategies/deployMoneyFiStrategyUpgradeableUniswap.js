const { ethers, upgrades } = require("hardhat");
const { saveAddress, getAddresses } = require("../contractAddresses");
require("dotenv").config();

//npx hardhat run scripts/strategies/deployMoneyFiStrategyUpgradeableUniswap.js --network sepolia
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MoneyFiStrategyUpgradeableUniswap with account:", deployer.address);

    // Đọc địa chỉ từ .env và contractAddresses
    const addresses = getAddresses();
    const uni = process.env.UNI_SEPOLIA_ADDRESS; // UNI trên Sepolia
    const link = process.env.LINK_SEPOLIA_ADDRESS; // WETH trên Sepolia
    const uniswapRouter = process.env.UNISWAP_V2_ROUTER;
    const uniswapFactory = process.env.UNISWAP_V2_FACTORY;
    const router = addresses.MoneyFiRouter;
    const crossChainRouter = addresses.MoneyFiCrossChainRouter;

    if (!uni || !link || !uniswapRouter || !uniswapFactory) {
        throw new Error("Missing required addresses in .env");
    }

    // Params cho initialize (sử dụng struct)
    const params = {
        admin: deployer.address,
        baseToken: uni,
        quoteToken: link,
        router: router,
        crossChainRouter: crossChainRouter,
        uniswapRouter: uniswapRouter,
        uniswapFactory: uniswapFactory,
        slippageWhenSwapAsset: 100, // 1% slippage
        minimumSwapAmount: ethers.parseUnits("0.01", 6),
        name: "UniswapV2 UNI/WETH",
        symbol: "MFUNIWE",
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
    console.log("UniswapV2_UNI_LINK proxy deployed to:", strategyAddress);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(strategyAddress);
    console.log("UniswapV2_UNI_LINK_Implementation deployed to:", implementationAddress);

    // Lưu địa chỉ
    saveAddress("UniswapV2_UNI_LINK", strategyAddress);
    saveAddress("UniswapV2_UNI_LINK_Implementation", implementationAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });