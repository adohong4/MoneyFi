const { ethers } = require("hardhat");
const { getAddresses } = require("./contractAddresses");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Configuring contracts with account:", deployer.address);

    const addresses = getAddresses();
    const controllerAddress = addresses.MoneyFiController;
    const routerAddress = addresses.MoneyFiRouter;
    const crossChainRouterAddress = addresses.MoneyFiCrossChainRouter;
    const tokenLpAddress = addresses.MoneyFiTokenLp;
    const strategyAddress = addresses.MoneyFiStartegyUpgradeableAerodrome;
    if (!controllerAddress || !routerAddress || !crossChainRouterAddress || !tokenLpAddress || !strategyAddress)
        throw new Error("Some contracts not deployed");

    const MoneyFiController = await ethers.getContractFactory("MoneyFiController");
    const controller = MoneyFiController.attach(controllerAddress);

    console.log("Configuring MoneyFiController...");
    await controller.setRouter(routerAddress);
    await controller.setCrossChainRouter(crossChainRouterAddress);
    await controller.setSigner(deployer.address);
    await controller.setTokenInfoInternal(
        "0xF3F2b4815A58152c9BE53250275e8211163268BA", // USDT trên Sepolia
        {
            minDepositAmount: ethers.parseUnits("10", 6), // 10 USDT
            decimals: 6,
            chainId: 11155111, // Sepolia chain ID
            isActive: true,
            lpTokenAddress: tokenLpAddress
        }
    );
    await controller.setStrategyInternal(strategyAddress, {
        isActive: true
    });

    console.log("Configuration completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });