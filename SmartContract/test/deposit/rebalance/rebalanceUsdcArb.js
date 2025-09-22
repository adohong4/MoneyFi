const { ethers } = require("hardhat");
require("dotenv").config();

// npx hardhat run test/deposit/rebalance/rebalanceUsdcArb.js --network sepolia
async function main() {
    // Lấy tài khoản
    const [deployer, user] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    console.log(`User address: ${user.address}`);

    // Địa chỉ hợp đồng từ .env
    const routerAddress = process.env.MONEYFI_ROUTER || "0x2a64f7a1F0fb00d05Da02F37f1Ee0825CfCecb73";
    const fundVaultAddress = process.env.MONEYFI_FUND_VAULT || "0xecec15AfAE07feE618D60406a3705945c35C34Cc";
    const usdcAddress = process.env.USDC_SEPOLIA_ADDRESS || "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
    const arbAddress = process.env.ARB_SEPOLIA_ADDRESS
    const strategyAddress = process.env.UNISWAP_V2_USDC_ARB || "0x9524e890bbB7Fe2CE4B63fcfC493F6523FEFa76d";
    const controllerAddress = process.env.MONEYFI_CONTROLLER || "0x95f26cFAd70874e8e4FAF33B9a65634a44b10078";
    const pairAddress = "0x78D0b232670d02f12CD294201cd35b724F1ab0Da"; // USDC/ARB pair
    const uniswapRouterAddress = process.env.UNISWAP_V2_ROUTER || "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

    // Kiểm tra biến môi trường
    if (!usdcAddress || !strategyAddress || !routerAddress || !fundVaultAddress || !controllerAddress) {
        throw new Error("Missing required contract addresses in .env");
    }

    // Kết nối hợp đồng
    const router = await ethers.getContractAt("MoneyFiRouter", routerAddress, user);
    const fundVault = await ethers.getContractAt("MoneyFiFundVault", fundVaultAddress, user);
    const usdc = await ethers.getContractAt("IERC20", usdcAddress, user);
    const arb = await ethers.getContractAt("IERC20", arbAddress, user);
    const strategy = await ethers.getContractAt("MoneyFiStrategyUpgradeableUniswapV2", strategyAddress, user);
    const controller = await ethers.getContractAt("MoneyFiController", controllerAddress, user);
    const pair = await ethers.getContractAt("IUniswapV2Pair", pairAddress, user);
    const uniswapRouter = await ethers.getContractAt(
        "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol:IUniswapV2Router02",
        uniswapRouterAddress,
        deployer
    );

    // 1. Kiểm tra trạng thái hợp đồng
    const isRouterPaused = await router.paused();
    console.log(`MoneyFiRouter paused? ${isRouterPaused}`);
    const isVaultPaused = await fundVault.paused();
    console.log(`MoneyFiFundVault paused? ${isVaultPaused}`);
    if (isRouterPaused || isVaultPaused) {
        console.log("Unpausing contracts...");
        if (isRouterPaused) {
            await router.connect(deployer).unpause({ gasLimit: 100000 });
            console.log("Unpaused MoneyFiRouter");
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
        if (isVaultPaused) {
            await fundVault.connect(deployer).unpause({ gasLimit: 100000 });
            console.log("Unpaused MoneyFiFundVault");
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }

    // 3. Kiểm tra cấu hình strategy
    const isStrategyActive = await controller.isStrategyInternalActive(strategyAddress);
    console.log(`Strategy active? ${isStrategyActive}`);
    if (!isStrategyActive) {
        throw new Error("Strategy is not active in MoneyFiController");
    }
    const underlyingAsset = await strategy.asset();
    console.log(`Strategy underlying asset: ${underlyingAsset}`);
    if (underlyingAsset.toLowerCase() !== usdcAddress.toLowerCase()) {
        throw new Error("Strategy underlying asset does not match USDC");
    }

    // 4. Kiểm tra số dư shares của user trong strategy
    const userShares = await strategy.balanceOf(user.address);
    console.log(`User shares in Strategy: ${ethers.formatUnits(userShares, 18)} shares`);
    if (userShares <= ethers.parseUnits("0.0000000000000001", 18)) { // Kiểm tra shares tối thiểu
        throw new Error("User shares are too low to rebalance");
    }

    // 5. Kiểm tra số dư USDC trong FundVault của user
    const userDepositInfo = await fundVault.getUserDepositInfor(usdcAddress, user.address);
    console.log("User Deposit Info before rebalance:");
    console.log("  Original Deposit Amount:", ethers.formatUnits(userDepositInfo.originalDepositAmount, 6), "USDC");
    console.log("  Current Deposit Amount:", ethers.formatUnits(userDepositInfo.currentDepositAmount, 6), "USDC");

    // 6. Kiểm tra lợi nhuận của user
    const userProfit = await strategy.getUserProfit(user.address);
    console.log(`User profit: ${ethers.formatEther(userProfit)} (in wei)`);

    // 7. Kiểm tra pool TVL và reserves
    const poolTVL = await strategy.totalLiquidWhitelistPool();
    console.log(`Pool TVL: ${ethers.formatUnits(poolTVL, 18)}`);
    const [reserve0, reserve1] = await pair.getReserves();
    console.log("Pool reserves before rebalance:", {
        USDC: ethers.formatUnits(reserve0, (await pair.token0()) === usdcAddress ? 6 : 18),
        ARB: ethers.formatUnits(reserve1, (await pair.token0()) === usdcAddress ? 18 : 6),
    });

    // 8. Kiểm tra total assets và expected assets
    const totalAssets = await strategy.totalAssets();
    console.log(`Total assets in strategy: ${ethers.formatUnits(totalAssets, 6)} USDC`);
    const expectedAssets = await strategy.convertToAssets(userShares);
    console.log(`Expected assets for ${ethers.formatUnits(userShares, 18)} shares: ${ethers.formatUnits(expectedAssets, 6)} USDC`);

    // 9. Kiểm tra minimumSwapAmount
    const minimumSwapAmount = await strategy.minimumSwapAmount();
    console.log(`Minimum swap amount in strategy: ${ethers.formatUnits(minimumSwapAmount, 6)} USDC`);
    if (expectedAssets < minimumSwapAmount) {
        console.warn(`Expected assets (${ethers.formatUnits(expectedAssets, 6)} USDC) is less than minimum swap amount (${ethers.formatUnits(minimumSwapAmount, 6)} USDC). Adjusting minimumSwapAmount...`);
        try {
            await strategy.connect(deployer).setMinimumSwapAmount(ethers.parseUnits("0.000001", 6), { gasLimit: 100000 });
            console.log("Minimum swap amount adjusted to 0.000001 USDC");
            await new Promise((resolve) => setTimeout(resolve, 5000));
        } catch (error) {
            console.warn("Failed to adjust minimumSwapAmount:", error.message);
            throw new Error("Cannot proceed with rebalance due to minimum swap amount constraint");
        }
    }

    // 10. Kiểm tra thanh khoản pool
    const usdcReserve = ethers.formatUnits(reserve0, (await pair.token0()) === usdcAddress ? 6 : 18);
    // if (parseFloat(usdcReserve) < parseFloat(ethers.formatUnits(expectedAssets, 6))) {
    //     console.warn(`Insufficient USDC liquidity in pool (${usdcReserve} USDC) to rebalance ${ethers.formatUnits(expectedAssets, 6)} USDC. Adding liquidity...`);
    //     try {
    //         await usdc.connect(deployer).approve(uniswapRouterAddress, ethers.parseUnits("100", 6), { gasLimit: 100000 });
    //         await arb.connect(deployer).approve(uniswapRouterAddress, ethers.parseUnits("100", 18), { gasLimit: 100000 });
    //         await uniswapRouter.connect(deployer).addLiquidity(
    //             usdcAddress,
    //             arbAddress,
    //             ethers.parseUnits("100", 6),
    //             ethers.parseUnits("100", 18),
    //             0,
    //             0,
    //             deployer.address,
    //             Math.floor(Date.now() / 1000) + 1800,
    //             { gasLimit: 500000 }
    //         );
    //         console.log("Added 100 USDC and 100 ARB to liquidity pool");
    //         await new Promise((resolve) => setTimeout(resolve, 5000));
    //     } catch (error) {
    //         console.error("Failed to add liquidity:", error.message);
    //         throw new Error("Cannot proceed with rebalance due to insufficient pool liquidity");
    //     }
    // }

    // 11. Kiểm tra protocol và referral fee
    const protocolFee = await controller.protocolFee();
    console.log(`Protocol fee: ${Number(protocolFee) / 10000}%`);
    const referralFee = await controller.referralFee();
    console.log(`Referral fee: ${Number(referralFee) / 10000}%`);

    // 12. Kiểm tra averageSystemActionFee
    const averageSystemActionFee = await controller.averageSystemActionFee();
    console.log(`Average system action fee: ${ethers.formatUnits(averageSystemActionFee, 18)}`);
    let rebalanceFee = ethers.parseUnits("0.01", 6); // Phí rebalance, ví dụ 0.01 USDC
    if (rebalanceFee > averageSystemActionFee) {
        console.warn(`Rebalance fee (${ethers.formatUnits(rebalanceFee, 6)} USDC) exceeds average system action fee (${ethers.formatUnits(averageSystemActionFee, 18)}). Adjusting rebalance fee...`);
        rebalanceFee = averageSystemActionFee;
        console.log(`Adjusted rebalance fee: ${ethers.formatUnits(rebalanceFee, 18)}`);
    }

    // 13. Chuẩn bị tham số rebalance
    const isReferral = true; // Đặt true nếu cần referral
    const rebalanceParam = {
        strategyAddress: strategyAddress,
        userAddress: user.address,
        rebalancesFee: rebalanceFee,
        isReferral: isReferral,
    };

    // 14. Kiểm tra số dư USDC trước khi rebalance
    const userUsdcBalanceBefore = await usdc.balanceOf(user.address);
    console.log(`User USDC balance before rebalance: ${ethers.formatUnits(userUsdcBalanceBefore, 6)} USDC`);

    // 15. Thực hiện rebalance
    console.log("=================================================================");
    console.log(`User rebalancing ${ethers.formatUnits(userShares, 18)} shares from Strategy...`);
    console.log(`Rebalance fee: ${ethers.formatUnits(rebalanceFee, 6)} USDC`);
    console.log(`Is referral: ${isReferral}`);
    try {
        const rebalanceTx = await router.connect(deployer).rebalanceFundSameChain(
            rebalanceParam,
            { gasLimit: 5000000 } // Tăng gas limit để đảm bảo
        );
        console.log("Transaction sent:", rebalanceTx.hash);
        await rebalanceTx.wait();
        console.log("Rebalance successful, tx:", rebalanceTx.hash);
    } catch (error) {
        console.error("Rebalance failed:", error);
        if (error.reason) console.error("Reason:", error.reason);
        if (error.data) {
            console.error("Data:", error.data);
            try {
                const iface = new ethers.Interface([
                    "function Error(string)",
                    "function InvalidRebalanceAmount()",
                    "function InvalidShare()",
                    "function InvalidSupportedTokenInternal()",
                    "function InsufficientLiquidity()",
                    "function MinimumSwapAmountNotMet()"
                ]);
                const decodedError = iface.parseError(error.data);
                console.error("Decoded error:", decodedError);
            } catch (decodeError) {
                console.error("Failed to decode error:", decodeError);
            }
        }
        throw error;
    }

    // 16. Kiểm tra sau khi rebalance
    const updatedShares = await strategy.balanceOf(user.address);
    console.log("User shares in Strategy after rebalance:", ethers.formatUnits(updatedShares, 18));

    const updatedTotalAssets = await strategy.totalAssets();
    console.log("Total assets in Strategy after rebalance:", ethers.formatUnits(updatedTotalAssets, 6), "USDC");

    const updatedDepositInfo = await fundVault.getUserDepositInfor(usdcAddress, user.address);
    console.log("User Deposit Info after rebalance:");
    console.log("  Original Deposit Amount:", ethers.formatUnits(updatedDepositInfo.originalDepositAmount, 6), "USDC");
    console.log("  Current Deposit Amount:", ethers.formatUnits(updatedDepositInfo.currentDepositAmount, 6), "USDC");

    const userUsdcBalanceAfter = await usdc.balanceOf(user.address);
    console.log("User USDC balance after rebalance:", ethers.formatUnits(userUsdcBalanceAfter, 6), "USDC");

    const distributeFee = await fundVault.distributeFee(usdcAddress);
    console.log("Distribute Fee in FundVault:", ethers.formatUnits(distributeFee, 6), "USDC");

    const rebalanceFeeInVault = await fundVault.rebalanceFee(usdcAddress);
    console.log("Rebalance Fee in FundVault:", ethers.formatUnits(rebalanceFeeInVault, 6), "USDC");

    const protocolFeeInVault = await fundVault.totalProtocolFee(usdcAddress);
    console.log("Protocol Fee in FundVault:", ethers.formatUnits(protocolFeeInVault, 6), "USDC");

    const referralFeeInVault = await fundVault.referralFee(usdcAddress);
    console.log("Referral Fee in FundVault:", ethers.formatUnits(referralFeeInVault, 6), "USDC");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });