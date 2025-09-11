const { ethers } = require("hardhat");
const { getAddresses } = require("../contractAddresses");

// npx hardhat run scripts/SetConfig/setController.test.js --network sepolia
async function main() {
    const [deployer] = await ethers.getSigners();
    const addresses = getAddresses();

    const moneyFiController = await ethers.getContractAt(
        "MoneyFiController",
        addresses.MoneyFiController,
        deployer
    );

    console.log("Deployer address:", deployer.address);
    console.log("MoneyFiController address:", addresses.MoneyFiController);

    // 1. Kiểm tra và cấp quyền onlyDelegateAdmin nếu cần
    const isDelegateAdmin = await moneyFiController.isDelegateAdmin(deployer.address);
    console.log(`Is ${deployer.address} delegate admin? ${isDelegateAdmin}`);

    // 2. Set Router
    // try {
    //     const txRouter = await moneyFiController.connect(deployer).setRouter(addresses.MoneyFiRouter);
    //     await txRouter.wait();
    //     console.log("Set Router address:", addresses.MoneyFiRouter);
    // } catch (error) {
    //     console.error("Failed to set Router:", error.message);
    // }

    // // 3. Set CrossChainRouter
    // try {
    //     const txCrossChainRouter = await moneyFiController.connect(deployer).setCrossChainRouter(addresses.MoneyFiCrossChainRouter);
    //     await txCrossChainRouter.wait();
    //     console.log("Set CrossChainRouter address:", addresses.MoneyFiCrossChainRouter);
    // } catch (error) {
    //     console.error("Failed to set CrossChainRouter:", error.message);
    // }

    // 4. Set Strategy Internal (Uniswap Strategy)
    // try {
    //     const txStrategy = await moneyFiController.connect(deployer).setStrategyInternal(
    //         addresses.UniswapV2_UNI_LINK,
    //         {
    //             name: "UniswapV2 UNI/LINK",
    //             chainId: 11155111, // Sepolia chain ID
    //             isActive: true,
    //         }
    //     );
    //     await txStrategy.wait();
    //     console.log("Set StrategyInternal for Uniswap Strategy");
    // } catch (error) {
    //     console.error("Failed to set StrategyInternal:", error.message);
    // }

    // 5. Set Dex Internal (Uniswap Dex)
    try {
        const txDex = await moneyFiController.connect(deployer).setDexInternalSwap(
            {
                name: "Dex Uniswap",
                chainId: 11155111, // Sepolia chain ID
                isActive: true,
            },
            addresses.MoneyFiUniswap
        );
        await txDex.wait();
        console.log("Set DexInternal for Uniswap ");
    } catch (error) {
        console.error("Failed to set DexInternal:", error.message);
    }

    // 6. Xác minh lại các thiết lập
    console.log("\nVerifying configurations...");
    const routerAddress = await moneyFiController.router();
    console.log("Router address:", routerAddress);
    const crossChainRouterAddress = await moneyFiController.crossChainRouter();
    console.log("CrossChainRouter address:", crossChainRouterAddress);
    const isStrategyActive = await moneyFiController.isStrategyInternalActive(addresses.UniswapV2_UNI_LINK);
    console.log("Is Uniswap Strategy Active:", isStrategyActive);
    const isDexActive = await moneyFiController.isDexSwapInternalActive(addresses.MoneyFiUniswap);
    console.log("Is Uniswap Dex Active:", isDexActive);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });