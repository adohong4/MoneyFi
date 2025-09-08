const { ethers, upgrades } = require("hardhat");
const { saveAddress, getAddresses } = require("../contractAddresses");
require("dotenv").config();

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MoneyFiStrategyUpgradeableStargate with account:", deployer.address);

    const addresses = getAddresses();
    const asset = process.env.USDC_SEPOLIA_ADDRESS; // Thay bằng địa chỉ token USDC hoặc token khác trên Sepolia
    const router = addresses.MoneyFiUniSwap;
    const crossChainRouter = addresses.MoneyFiStargateCrossChain;
    const name = "MoneyFi Stargate Strategy";
    const symbol = "MFSTG";

    if (!router || !crossChainRouter) {
        throw new Error("MoneyFiUniSwap or MoneyFiStargateCrossChain address is missing");
    }

    const MoneyFiStrategyUpgradeableStargate = await ethers.getContractFactory("MoneyFiStrategyUpgradeableStargate");
    const strategy = await upgrades.deployProxy(
        MoneyFiStrategyUpgradeableStargate,
        [deployer.address, asset, router, crossChainRouter, name, symbol],
        { initializer: "initialize", kind: "uups" }
    );

    await strategy.waitForDeployment();
    const strategyAddress = await strategy.getAddress();
    console.log("MoneyFiStrategyUpgradeableStargate proxy deployed to:", strategyAddress);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(strategyAddress);
    console.log("MoneyFiStrategyUpgradeableStargate implementation deployed to:", implementationAddress);

    // Thiết lập thông số Stargate
    const stargateParams = {
        stargateStaking: "0xYourStargateStakingAddress", // Thay bằng địa chỉ Stargate Staking
        stargatePool: process.env.STARGATE_POOL, // Thay bằng địa chỉ Stargate Pool
        stargateRewarder: "0xYourStargateRewarderAddress", // Thay bằng địa chỉ Stargate Rewarder
        stargateLpToken: process.env.STARGATE_LP_TOKEN, // Thay bằng địa chỉ Stargate LP Token
        routerV3: process.env.UNISWAP_V3_ROUTER, // Uniswap V3 Router
        factoryV3: process.env.UNISWAP_V3_FACTORY, // Uniswap V3 Factory
        quoter: process.env.UNISWAP_V3_QUOTER, // Uniswap V3 Quoter
    };

    await strategy.setUp(stargateParams);
    console.log("MoneyFiStrategyUpgradeableStargate set up");

    saveAddress("MoneyFiStrategyUpgradeableStargate", strategyAddress);
    saveAddress("MoneyFiStrategyUpgradeableStargate_Implementation", implementationAddress);

    if (hre.network.name === "sepolia") {
        console.log("Verifying proxy contract...");
        await hre.run("verify:verify", {
            address: strategyAddress,
            constructorArguments: [],
        });
        console.log("Verifying implementation contract...");
        await hre.run("verify:verify", {
            address: implementationAddress,
            constructorArguments: [],
        });
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });