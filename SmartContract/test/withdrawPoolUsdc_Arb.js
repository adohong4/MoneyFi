const { ethers } = require("hardhat");
require("dotenv").config();

// npx hardhat run test/withdrawPoolUsdc_Arb.js --network sepolia
async function main() {
    // Lấy tài khoản
    const [deployer, user] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    console.log(`User address: ${user.address}`);

    // Địa chỉ hợp đồng từ .env
    const routerAddress = process.env.MONEYFI_ROUTER || "0x2a64f7a1F0fb00d05Da02F37f1Ee0825CfCecb73";
    const fundVaultAddress = process.env.MONEYFI_FUND_VAULT || "0xecec15AfAE07feE618D60406a3705945c35C34Cc";
    const usdcAddress = process.env.USDC_SEPOLIA_ADDRESS || "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
    const arbAddress = process.env.ARB_SEPOLIA_ADDRESS || "0x9734Fb63E86217EfBC54Bba85571bf173879CAE5";
    const strategyAddress = process.env.UNISWAP_V2_USDC_ARB || "0x9524e890bbB7Fe2CE4B63fcfC493F6523FEFa76d";
    const tokenLpAddress = process.env.MONEYFI_TOKEN_LP || "0x88C3e7da67170E731B261475F3eB73f477355f4f";
    const pairAddress = "0x78D0b232670d02f12CD294201cd35b724F1ab0Da"; // USDC/ARB pair
    const controllerAddress = process.env.MONEYFI_CONTROLLER || "0x95f26cFAd70874e8e4FAF33B9a65634a44b10078";
    const uniswapRouterAddress = process.env.UNISWAP_V2_ROUTER || "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

    // Kiểm tra biến môi trường
    if (!usdcAddress || !arbAddress || !strategyAddress || !routerAddress || !fundVaultAddress || !tokenLpAddress || !controllerAddress) {
        throw new Error("Missing required contract addresses in .env");
    }

    // Kết nối hợp đồng
    const router = await ethers.getContractAt("MoneyFiRouter", routerAddress, user);
    const fundVault = await ethers.getContractAt("MoneyFiFundVault", fundVaultAddress, user);
    const usdc = await ethers.getContractAt("IERC20", usdcAddress, user);
    const arb = await ethers.getContractAt("IERC20", arbAddress, user);
    const strategy = await ethers.getContractAt("MoneyFiStrategyUpgradeableUniswapV2", strategyAddress, user);
    const tokenLp = await ethers.getContractAt("MoneyFiTokenLp", tokenLpAddress, user);
    const pair = await ethers.getContractAt("IUniswapV2Pair", pairAddress, user);
    const controller = await ethers.getContractAt("MoneyFiController", controllerAddress, user);
    const uniswapRouter = await ethers.getContractAt(
        "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol:IUniswapV2Router02",
        uniswapRouterAddress,
        deployer
    );

    // Kiểm tra uniswapPair trong strategy
    const strategyPair = await strategy.uniswapPair();
    console.log(`Uniswap pair in strategy: ${strategyPair}`);
    if (strategyPair.toLowerCase() !== pairAddress.toLowerCase()) {
        throw new Error(`Strategy uniswapPair (${strategyPair}) does not match pool address (${pairAddress}). Cần deploy lại strategy.`);
    }

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

    // 2. Kiểm tra cooldown period
    const nextWithdrawTime = await router.getNextWithdrawRequestTime(user.address);
    const currentTime = Math.floor(Date.now() / 1000);
    console.log(`Next allowed withdraw time: ${new Date(Number(nextWithdrawTime) * 1000).toISOString()}`);
    console.log(`Current time: ${new Date(currentTime * 1000).toISOString()}`);
    if (Number(nextWithdrawTime) > currentTime) {
        throw new Error(`Withdraw is on cooldown until ${new Date(Number(nextWithdrawTime) * 1000).toISOString()}`);
    }

    // 3. Kiểm tra số dư shares của user trong strategy
    const userShares = await strategy.balanceOf(user.address);
    console.log(`User shares in Strategy: ${ethers.formatUnits(userShares, 18)} shares`);
    if (userShares <= 0) {
        throw new Error("User has no shares in the strategy");
    }

    // 4. Kiểm tra số dư USDC trong FundVault của user
    const userDepositInfo = await fundVault.getUserDepositInfor(usdcAddress, user.address);
    console.log("User Deposit Info before withdraw:");
    console.log("  Original Deposit Amount:", ethers.formatUnits(userDepositInfo.originalDepositAmount, 6), "USDC");
    console.log("  Current Deposit Amount:", ethers.formatUnits(userDepositInfo.currentDepositAmount, 6), "USDC");

    // 5. Kiểm tra số dư LP token của user
    const userLpBalance = await tokenLp.balanceOf(user.address);
    console.log(`User mUSDC balance before withdraw: ${ethers.formatUnits(userLpBalance, 6)} mUSDC`);

    // 6. Kiểm tra cấu hình strategy
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

    // 7. Kiểm tra pool reserves
    const [reserve0, reserve1] = await pair.getReserves();
    console.log("Pool reserves before withdraw:", {
        USDC: ethers.formatUnits(reserve0, (await pair.token0()) === usdcAddress ? 6 : 18),
        ARB: ethers.formatUnits(reserve1, (await pair.token0()) === usdcAddress ? 18 : 6),
    });

    // 8. Kiểm tra pool TVL
    const poolTVL = await strategy.totalLiquidWhitelistPool();
    console.log(`Pool TVL: ${ethers.formatUnits(poolTVL, 18)}`);

    // 9. Kiểm tra minimumSwapAmount và expectedAssets
    const minimumSwapAmount = await strategy.minimumSwapAmount();
    console.log(`Minimum swap amount in strategy: ${ethers.formatUnits(minimumSwapAmount, 6)} USDC`);
    const totalAssets = await strategy.totalAssets();
    console.log(`Total assets in strategy: ${ethers.formatUnits(totalAssets, 6)} USDC`);
    const expectedAssets = await strategy.convertToAssets(userShares);
    console.log(`Expected assets for ${ethers.formatUnits(userShares, 18)} shares: ${ethers.formatUnits(expectedAssets, 6)} USDC`);

    // Kiểm tra thanh khoản pool
    const usdcReserve = ethers.formatUnits(reserve0, (await pair.token0()) === usdcAddress ? 6 : 18);
    if (parseFloat(usdcReserve) < parseFloat(ethers.formatUnits(expectedAssets, 6))) {
        console.warn(`Insufficient USDC liquidity in pool (${usdcReserve} USDC) to withdraw ${ethers.formatUnits(expectedAssets, 6)} USDC. Adding liquidity...`);
        try {
            await usdc.connect(deployer).approve(uniswapRouterAddress, ethers.parseUnits("100", 6), { gasLimit: 100000 });
            await arb.connect(deployer).approve(uniswapRouterAddress, ethers.parseUnits("100", 18), { gasLimit: 100000 });
            await uniswapRouter.connect(deployer).addLiquidity(
                usdcAddress,
                arbAddress,
                ethers.parseUnits("100", 6),
                ethers.parseUnits("100", 18),
                0,
                0,
                deployer.address,
                Math.floor(Date.now() / 1000) + 1800,
                { gasLimit: 500000 }
            );
            console.log("Added 100 USDC and 100 ARB to liquidity pool");
        } catch (error) {
            console.error("Failed to add liquidity:", error.message);
            throw new Error("Cannot proceed with withdrawal due to insufficient pool liquidity");
        }
    }

    // Kiểm tra và điều chỉnh minimumSwapAmount nếu cần
    if (expectedAssets < minimumSwapAmount) {
        console.warn(`Warning: Expected assets (${ethers.formatUnits(expectedAssets, 6)} USDC) is less than minimum swap amount (${ethers.formatUnits(minimumSwapAmount, 6)} USDC). Attempting to adjust minimumSwapAmount...`);
        try {
            await strategy.connect(deployer).setMinimumSwapAmount(ethers.parseUnits("0.000001", 6), { gasLimit: 100000 });
            console.log("Minimum swap amount adjusted to 0.000001 USDC");
        } catch (error) {
            console.warn("Failed to adjust minimumSwapAmount:", error.message);
            throw new Error("Withdrawal may fail due to insufficient expected assets compared to minimum swap amount");
        }
    }

    // 10. Chuẩn bị tham số rút tiền
    const withdrawStrategySameChain = [
        {
            strategyAddress: strategyAddress,
            share: userShares / 10n, // Rút 10% shares để thử, điều chỉnh theo nhu cầu
            externalCallData: ethers.getBytes("0x"),
        },
    ];
    const unDistributedWithdraw = [
        {
            tokenAddress: usdcAddress,
            unDistributedAmount: userDepositInfo.currentDepositAmount, // Rút toàn bộ số dư chưa phân phối
        },
    ];
    const isReferral = true; // Đặt true nếu cần referral
    let signature = "";

    // Tạo chữ ký referral nếu cần
    if (isReferral) {
        const nonce = await controller.nonce();
        const signerAddress = await controller.signer();
        const abiCoder = new ethers.AbiCoder();
        const message = ethers.keccak256(
            abiCoder.encode(
                ["address", "uint256", "address", "bool"],
                [signerAddress, nonce, user.address, isReferral]
            )
        );
        const ethSignedMessage = ethers.getBytes(message);
        const signerWallet = new ethers.Wallet(process.env.PRIVATE_KEY || "", ethers.provider);
        signature = await signerWallet.signMessage(ethSignedMessage);
        console.log(`Generated referral signature: ${signature}`);
    }

    // Swap param (nếu muốn swap USDC sang ARB)
    const wantToSwap = false; // Đặt true nếu muốn swap sang ARB
    let swapParam = {
        tokenReceive: ethers.ZeroAddress,
        swapImpl: ethers.ZeroAddress,
        externalCallData: ethers.getBytes("0x"),
        amountOutMin: 0,
        isV3: false,
    };

    if (wantToSwap) {
        // Tạo calldata cho Uniswap V2 swap
        const path = [usdcAddress, arbAddress];
        const amountOutMin = ethers.parseUnits("0.01", 18); // Số lượng ARB tối thiểu
        const deadline = Math.floor(Date.now() / 1000) + 1800;
        const swapCalldata = uniswapRouter.interface.encodeFunctionData("swapExactTokensForTokens", [
            expectedAssets,
            amountOutMin,
            path,
            user.address,
            deadline,
        ]);

        swapParam = {
            tokenReceive: arbAddress,
            swapImpl: uniswapRouterAddress,
            externalCallData: ethers.getBytes(swapCalldata),
            amountOutMin,
            isV3: false, // Sử dụng Uniswap V2
        };
    }

    // 11. Log ABI của hàm để kiểm tra
    const routerInterface = router.interface;
    console.log("ABI of withdrawFundSameChain:", routerInterface.getFunction("withdrawFundSameChain").format());

    // 12. Kiểm tra protocol và referral fee
    const protocolFee = await controller.protocolFee();
    console.log(`Protocol fee: ${Number(protocolFee) / 10000}%`);
    const referralFee = await controller.referralFee();
    console.log(`Referral fee: ${Number(referralFee) / 10000}%`);

    // 13. Kiểm tra lợi nhuận của user
    const userProfit = await strategy.getUserProfit(user.address);
    console.log(`User profit: ${ethers.formatEther(userProfit)} (in wei)`);

    // 14. Kiểm tra số dư USDC và ARB trước khi rút
    const userUsdcBalanceBefore = await usdc.balanceOf(user.address);
    console.log(`User USDC balance before withdraw: ${ethers.formatUnits(userUsdcBalanceBefore, 6)} USDC`);
    const userArbBalanceBefore = await arb.balanceOf(user.address);
    console.log(`User ARB balance before withdraw: ${ethers.formatUnits(userArbBalanceBefore, 18)} ARB`);

    // 15. Thực hiện rút tiền
    console.log("=================================================================");
    console.log(`User withdrawing ${ethers.formatUnits(withdrawStrategySameChain[0].share, 18)} shares from Strategy...`);
    console.log(`Withdrawing ${ethers.formatUnits(unDistributedWithdraw[0].unDistributedAmount, 6)} USDC from FundVault...`);
    console.log("SwapParam:", JSON.stringify(swapParam, null, 2));
    try {
        const withdrawTx = await router.connect(user).withdrawFundSameChain(
            withdrawStrategySameChain,
            unDistributedWithdraw,
            isReferral,
            signature,
            swapParam,
            { gasLimit: 3000000 }
        );
        console.log("Transaction sent:", withdrawTx.hash);
        await withdrawTx.wait();
        console.log("Withdraw successful, tx:", withdrawTx.hash);
    } catch (error) {
        console.error("Withdraw failed:", error);
        if (error.reason) console.error("Reason:", error.reason);
        if (error.data) {
            console.error("Data:", error.data);
            try {
                const iface = new ethers.Interface([
                    "function Error(string)",
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

    // 16. Kiểm tra sau khi rút
    const updatedShares = await strategy.balanceOf(user.address);
    console.log("User shares in Strategy after withdraw:", ethers.formatUnits(updatedShares, 18));

    const updatedTotalAssets = await strategy.totalAssets();
    console.log("Total assets in Strategy after withdraw:", ethers.formatUnits(updatedTotalAssets, 6), "USDC");

    const [reserve0After, reserve1After] = await pair.getReserves();
    console.log("Pool reserves after withdraw:", {
        USDC: ethers.formatUnits(reserve0After, (await pair.token0()) === usdcAddress ? 6 : 18),
        ARB: ethers.formatUnits(reserve1After, (await pair.token0()) === usdcAddress ? 18 : 6),
    });

    const updatedDepositInfo = await fundVault.getUserDepositInfor(usdcAddress, user.address);
    console.log("User Deposit Info after withdraw:");
    console.log("  Original Deposit Amount:", ethers.formatUnits(updatedDepositInfo.originalDepositAmount, 6), "USDC");
    console.log("  Current Deposit Amount:", ethers.formatUnits(updatedDepositInfo.currentDepositAmount, 6), "USDC");

    const updatedLpBalance = await tokenLp.balanceOf(user.address);
    console.log("User mUSDC balance after withdraw:", ethers.formatUnits(updatedLpBalance, 6), "mUSDC");

    const userUsdcBalanceAfter = await usdc.balanceOf(user.address);
    console.log("User USDC balance after withdraw:", ethers.formatUnits(userUsdcBalanceAfter, 6), "USDC");

    const userArbBalanceAfter = await arb.balanceOf(user.address);
    console.log("User ARB balance after withdraw:", ethers.formatUnits(userArbBalanceAfter, 18), "ARB");

    const distributeFee = await fundVault.distributeFee(usdcAddress);
    console.log("Distribute Fee in FundVault:", ethers.formatUnits(distributeFee, 6), "USDC");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });