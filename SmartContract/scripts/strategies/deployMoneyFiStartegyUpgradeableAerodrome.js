const { ethers, upgrades } = require("hardhat");
const { saveAddress, getAddresses } = require("../contractAddresses");
require("dotenv").config();

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MoneyFiStartegyUpgradeableAerodrome with account:", deployer.address);

    const addresses = getAddresses();
    const routerAddress = addresses.MoneyFiRouter;
    const crossChainRouterAddress = addresses.MoneyFiCrossChainRouter;
    if (!routerAddress || !crossChainRouterAddress)
        throw new Error("MoneyFiRouter or MoneyFiCrossChainRouter not deployed");

    const baseToken = "0xF3F2b4815A58152c9BE53250275e8211163268BA"; // USDT trên Sepolia
    const qouteToken = "0xF3F2b4815A58152c9BE53250275e8211163268BA"; // USDC trên Sepolia
    const slippageWhenSwapAsset = 50; // 0.05% slippage

    const MoneyFiStartegyUpgradeableAerodrome = await ethers.getContractFactory("MoneyFiStartegyUpgradeableAerodrome");
    const strategy = await upgrades.deployProxy(
        MoneyFiStartegyUpgradeableAerodrome,
        [
            deployer.address,
            baseToken,
            qouteToken,
            routerAddress,
            crossChainRouterAddress,
            slippageWhenSwapAsset,
            "MoneyFi Aerodrome Strategy",
            "MFAS"
        ],
        { initializer: "initialize" }
    );
    await strategy.waitForDeployment();
    const strategyAddress = await strategy.getAddress();
    console.log("MoneyFiStartegyUpgradeableAerodrome deployed to:", strategyAddress);

    saveAddress("MoneyFiStartegyUpgradeableAerodrome", strategyAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });