const { ethers } = require("hardhat");
const { getAddresses } = require("../contractAddresses");

// npx hardhat run scripts/SetConfig/functionSet_Controller.js --network sepolia

async function main() {
    const [deployer] = await ethers.getSigners();
    const addresses = getAddresses();
    const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

    const moneyFiController = await ethers.getContractAt(
        "MoneyFiController",
        addresses.MoneyFiController,
        deployer
    );

    console.log("Deployer address:", deployer.address);
    console.log("MoneyFiController address:", addresses.MoneyFiController);

    // // 1. Set Token Info Internal (USDC)
    // await moneyFiController.connect(deployer).setTokenInfoInternal(
    //     USDC_ADDRESS,
    //     {
    //         minDepositAmount: ethers.parseUnits("0.1", 6),
    //         decimals: 6,
    //         chainId: 11155111, // Sepolia chain ID
    //         isActive: true,
    //         lpTokenAddress: addresses.MoneyFiTokenLp,
    //     }
    // );
    // console.log("Set TokenInfoInternal for USDC");

    // // 2. Set Router
    // await moneyFiController.connect(deployer).setRouter(addresses.MoneyFiRouter);
    // console.log("Set Router address:", addresses.MoneyFiRouter);

    // // 3. Set CrossChainRouter
    // await moneyFiController.connect(deployer).setCrossChainRouter(addresses.MoneyFiCrossChainRouter);
    // console.log("Set CrossChainRouter address:", addresses.MoneyFiCrossChainRouter);

    // // 4. Set Signer (sử dụng deployer address làm signer tạm thời, bạn có thể thay đổi)
    // await moneyFiController.connect(deployer).setSigner(deployer.address);
    // console.log("Set Signer address:", deployer.address);

    // // 5. Set HotWallet (sử dụng deployer address làm hotWallet tạm thời, bạn có thể thay đổi)
    // await moneyFiController.connect(deployer).setHotWallet(deployer.address);
    // console.log("Set HotWallet address:", deployer.address);

    // // 6. Set Strategy Internal (Uniswap Strategy)
    // await moneyFiController.connect(deployer).setStrategyInternal(
    //     addresses.MoneyFiStrategyUpgradeableUniswap,
    //     {
    //         name: "UniswapV2 USDC/ARB Strategy",
    //         chainId: 11155111,
    //         isActive: true,
    //     }
    // );
    // console.log("Set StrategyInternal for Uniswap Strategy");

    // // 8. Set Referral Fee (ví dụ: 10% của protocol fee)
    // const referralFee = ethers.parseUnits("100", 0); // 1% (100/10000)
    // await moneyFiController.connect(deployer).setReferralFee(referralFee);
    // console.log("Set Referral Fee:", referralFee.toString());

    // // 9. Enable Referral Signature
    // await moneyFiController.connect(deployer).setEnableReferralSignature(true);
    // console.log("Enabled Referral Signature");

    // 10. Set Max Percent Liquidity Strategy for USDC
    const maxPercentLiquidity = ethers.parseUnits("10000", 0); // 50% (5000/10000)
    await moneyFiController.connect(deployer).setMaxPercentLiquidityStrategy(USDC_ADDRESS, maxPercentLiquidity);
    console.log("Set Max Percent Liquidity Strategy for USDC:", maxPercentLiquidity.toString());

    // // 11. Set Max Deposit Value for USDC
    // const maxDepositValue = ethers.parseUnits("1000", 6); // 1000 USDC
    // await moneyFiController.connect(deployer).setMaxDepositValue(USDC_ADDRESS, maxDepositValue);
    // console.log("Set Max Deposit Value for USDC:", maxDepositValue.toString());

    // // 12. Set Average System Action Fee (ví dụ: 0.01 ETH)
    // const averageSystemActionFee = ethers.parseUnits("0.01", 18);
    // await moneyFiController.connect(deployer).setAverageSystemActionFee(averageSystemActionFee);
    // console.log("Set Average System Action Fee:", averageSystemActionFee.toString());

    // Xác minh một số thông tin
    console.log("\nVerifying configurations...");
    const tokenInfo = await moneyFiController.getSupportedTokenInternalInfor(USDC_ADDRESS);
    console.log("Token Info for USDC:", tokenInfo);
    const isStrategyActive = await moneyFiController.isStrategyInternalActive(addresses.MoneyFiStrategyUpgradeableUniswap);
    console.log("Is Uniswap Strategy Active:", isStrategyActive);
    const routerAddress = await moneyFiController.router();
    console.log("Router address:", routerAddress);
    const crossChainRouterAddress = await moneyFiController.crossChainRouter();
    console.log("CrossChainRouter address:", crossChainRouterAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });