const { ethers } = require("hardhat");
const { getAddresses } = require("../contractAddresses");
// npx hardhat run scripts/SetConfig/checkConfig_Controller.js --network sepolia

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
    console.log("\n=== Verifying MoneyFiController Configurations ===");

    // 1. Kiểm tra quyền DELEGATE_ADMIN_ROLE và DEFAULT_ADMIN_ROLE
    const isDelegateAdmin = await moneyFiController.isDelegateAdmin(deployer.address);
    console.log(`Is ${deployer.address} delegate admin? ${isDelegateAdmin}`);


    // 2. Kiểm tra Protocol Fee
    const protocolFee = await moneyFiController.protocolFee();
    console.log("Protocol Fee:", protocolFee.toString(), "(in percentage, 10000 = 100%)");

    // 3. Kiểm tra Nonce
    const nonce = await moneyFiController.nonce();
    console.log("Nonce:", nonce.toString());

    // 4. Kiểm tra Router
    const routerAddress = await moneyFiController.router();
    console.log("Router address:", routerAddress, routerAddress === addresses.MoneyFiRouter ? "(Correct)" : "(Incorrect)");

    // 5. Kiểm tra CrossChainRouter
    const crossChainRouterAddress = await moneyFiController.crossChainRouter();
    console.log("CrossChainRouter address:", crossChainRouterAddress, crossChainRouterAddress === addresses.MoneyFiCrossChainRouter ? "(Correct)" : "(Incorrect)");

    // 6. Kiểm tra Signer
    const signerAddress = await moneyFiController.signer();
    console.log("Signer address:", signerAddress);

    // 7. Kiểm tra HotWallet
    const hotWalletAddress = await moneyFiController.hotWallet();
    console.log("HotWallet address:", hotWalletAddress);

    // 8. Kiểm tra Average System Action Fee
    const averageSystemActionFee = await moneyFiController.averageSystemActionFee();
    console.log("Average System Action Fee:", ethers.formatUnits(averageSystemActionFee, 18), "ETH");

    // 9. Kiểm tra Referral Fee
    const referralFee = await moneyFiController.referralFee();
    console.log("Referral Fee:", referralFee.toString(), "(in percentage of protocol fee, 10000 = 100%)");

    // 10. Kiểm tra Enable Referral Signature
    const isEnableReferralSignature = await moneyFiController.isEnableReferralSignature();
    console.log("Enable Referral Signature:", isEnableReferralSignature);

    // 11. Kiểm tra Token Info Internal (USDC)
    const tokenInfoInternal = await moneyFiController.getSupportedTokenInternalInfor(USDC_ADDRESS);
    console.log("Token Info Internal (USDC):");
    console.log("  lpTokenAddress:", tokenInfoInternal.lpTokenAddress, tokenInfoInternal.lpTokenAddress === addresses.MoneyFiTokenLp ? "(Correct)" : "(Incorrect)");
    console.log("  minDepositAmount:", ethers.formatUnits(tokenInfoInternal.minDepositAmount, 6), "USDC");
    console.log("  decimals:", tokenInfoInternal.decimals.toString());
    console.log("  chainId:", tokenInfoInternal.chainId.toString());
    console.log("  isActive:", tokenInfoInternal.isActive);

    // 12. Kiểm tra Token Support Internal Active (USDC)
    const isTokenSupportInternalActive = await moneyFiController.isTokenSupportInternalActive(USDC_ADDRESS);
    console.log("Is Token Support Internal Active (USDC):", isTokenSupportInternalActive);

    // 13. Kiểm tra Strategy Internal (Uniswap Strategy)
    console.log("==============================================================");
    const strategyInternal = await moneyFiController.strategyInternal(addresses.MoneyFiStrategyUpgradeableUniswap);
    console.log("Strategy Internal (Uniswap Strategy):");
    console.log("  name:", strategyInternal.name);
    console.log("  chainId:", strategyInternal.chainId.toString());
    console.log("  isActive:", strategyInternal.isActive);
    console.log("Is Strategy Internal Active:", await moneyFiController.isStrategyInternalActive(addresses.MoneyFiStrategyUpgradeableUniswap));

    const strategyInternalETH = await moneyFiController.strategyInternal(addresses.MoneyFiStrategyUpgradeableUniswapV2);
    console.log("Strategy Internal (Uniswap Strategy V2):");
    console.log("  name:", strategyInternalETH.name);
    console.log("  chainId:", strategyInternalETH.chainId.toString());
    console.log("  isActive:", strategyInternalETH.isActive);
    console.log("Is Strategy Internal ETH:", await moneyFiController.isStrategyInternalActive(addresses.MoneyFiStrategyUpgradeableUniswapV2));

    const strategyInternalARB = await moneyFiController.strategyInternal(addresses.UniswapV2_USDC_ARB);
    console.log("Strategy Internal (Uniswap Strategy USDC/ ARB):");
    console.log("  name:", strategyInternalARB.name);
    console.log("  chainId:", strategyInternalARB.chainId.toString());
    console.log("  isActive:", strategyInternalARB.isActive);
    console.log("Is Strategy Internal ARB:", await moneyFiController.isStrategyInternalActive(addresses.UniswapV2_USDC_ARB));
    console.log("==============================================================");

    // 14. Kiểm tra Strategy External (Uniswap Strategy)
    const strategyExternal = await moneyFiController.strategyExternal(addresses.MoneyFiStrategyUpgradeableUniswap);
    console.log("Strategy External (Uniswap Strategy):");
    console.log("  underlyingAsset:", strategyExternal.underlyingAsset, strategyExternal.underlyingAsset === USDC_ADDRESS ? "(Correct)" : "(Incorrect)");
    console.log("  isActive:", strategyExternal.isActive);
    console.log("Is Strategy External Active:", await moneyFiController.isStrategyExternalActive(addresses.MoneyFiStrategyUpgradeableUniswap));

    // 15. Kiểm tra Max Percent Liquidity Strategy (USDC)
    const maxPercentLiquidity = await moneyFiController.maxPercentLiquidityStrategyToken(USDC_ADDRESS);
    console.log("Max Percent Liquidity Strategy (USDC):", maxPercentLiquidity.toString(), "(in percentage, 10000 = 100%)");

    // 16. Kiểm tra Max Deposit Value (USDC)
    const maxDepositValue = await moneyFiController.maxDepositValueToken(USDC_ADDRESS);
    console.log("Max Deposit Value (USDC):", ethers.formatUnits(maxDepositValue, 6), "USDC");

    // 17. Kiểm tra Valid Underlying Asset Strategy External
    const isValidUnderlyingAsset = await moneyFiController.isValidUnderlyingAssetStrategyExternal(
        addresses.MoneyFiStrategyUpgradeableUniswap,
        USDC_ADDRESS
    );
    console.log("Is Valid Underlying Asset for Strategy External (USDC):", isValidUnderlyingAsset);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Verification failed:", error.message);
        process.exit(1);
    });