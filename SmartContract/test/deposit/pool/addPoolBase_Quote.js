const { ethers } = require("hardhat");
require("dotenv").config();

// npx hardhat run test/deposit/pool/addPoolBase_Quote.js --network sepolia
async function main() {
    // Lấy tài khoản
    const [deployer, user] = await ethers.getSigners();
    console.log(`Địa chỉ Deployer: ${deployer.address}`);
    console.log(`Địa chỉ User: ${user.address}`);

    // Địa chỉ hợp đồng từ .env và hard-coded
    const routerAddress = process.env.MONEYFI_ROUTER;
    const fundVaultAddress = process.env.MONEYFI_FUND_VAULT;
    const usdcAddress = process.env.USDC_SEPOLIA_ADDRESS;
    const baseTokenAddress = process.env.LINK_SEPOLIA_ADDRESS;
    const strategyAddress = process.env.UNISWAP_V2_LINK_WETH; // Strategy deploy
    const pairAddress = "0x6561cF90FDE56d6ADCcAa818C9bee07E0668d229"; // token/quote pair
    const controllerAddress = process.env.MONEYFI_CONTROLLER;
    const moneyFiUniSwapAddress = process.env.UNISWAP_DEX_ADDRESS; // Địa chỉ MoneyFiUniSwap
    const tokenLpAddress = process.env.MONEYFI_TOKEN_LP;

    // Kiểm tra biến môi trường
    if (!usdcAddress || !baseTokenAddress || !strategyAddress || !routerAddress || !fundVaultAddress || !controllerAddress || !tokenLpAddress) {
        throw new Error("Thiếu địa chỉ hợp đồng trong file .env");
    }

    // Kết nối hợp đồng
    const router = await ethers.getContractAt("MoneyFiRouter", routerAddress, deployer);
    const fundVault = await ethers.getContractAt("MoneyFiFundVault", fundVaultAddress, deployer);
    const usdc = await ethers.getContractAt("IERC20", usdcAddress, deployer);
    const strategy = await ethers.getContractAt("MoneyFiStrategyUpgradeableUniswapV2", strategyAddress, deployer);
    const pair = await ethers.getContractAt("IUniswapV2Pair", pairAddress, deployer);
    const controller = await ethers.getContractAt("MoneyFiController", controllerAddress, deployer);
    const moneyFiUniSwap = await ethers.getContractAt("MoneyFiUniSwap", moneyFiUniSwapAddress, deployer);
    const tokenLp = await ethers.getContractAt("MoneyFiTokenLp", tokenLpAddress, deployer);

    // Kiểm tra cấu hình strategy
    const strategyPair = await strategy.uniswapPair();
    console.log(`Địa chỉ Uniswap Pair trong Strategy: ${strategyPair}`);
    if (strategyPair.toLowerCase() !== pairAddress.toLowerCase()) {
        throw new Error(`Uniswap Pair của Strategy (${strategyPair}) không khớp với địa chỉ pool (${pairAddress})`);
    }

    const baseToken = await strategy.baseToken();
    const quoteToken = await strategy.quoteToken();
    console.log(`Base Token: ${baseToken}, Quote Token: ${quoteToken}`);

    // Kiểm tra slippage và minimum swap amount
    const slippage = await strategy.slippageWhenSwapAsset();
    console.log(`Slippage: ${(Number(slippage) / 10000) * 100}%`);
    const minimumSwapAmount = await strategy.minimumSwapAmount();
    console.log(`Minimum Swap Amount: ${ethers.formatUnits(minimumSwapAmount, 18)} BaseToken`);

    // 1. Kiểm tra dữ liệu đầu vào
    const amount = ethers.parseUnits("4", 6); // 1 USDC
    const depositParam = {
        strategyAddress: strategyAddress,
        depositor: user.address,
        depositedTokenAddress: usdcAddress, // Token deposit là USDC
        amount: amount,
        distributionFee: ethers.parseUnits("0.0", 6), // Phí phân phối = 0
        externalCallData: ethers.getBytes("0x"),
    };

    // Tính amountOutMin cho swap USDC -> base Token
    const uniswapRouter = await ethers.getContractAt(
        "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol:IUniswapV2Router02",
        await moneyFiUniSwap.routerV2(),
        deployer
    );
    const pathUsdcToUni = [usdcAddress, baseTokenAddress];
    const amountsOutUsdcToUni = await uniswapRouter.getAmountsOut(amount, pathUsdcToUni);
    const amountOutMinUni = (amountsOutUsdcToUni[1] * (BigInt(10000) - BigInt(slippage))) / BigInt(10000); // Áp dụng slippage
    console.log(`Dự kiến nhận tối thiểu: ${ethers.formatUnits(amountOutMinUni, 18)} BaseToken`);

    const swapTokenParam = {
        swapContract: moneyFiUniSwapAddress, // Sử dụng MoneyFiUniSwap để swap
        amountOutMin: amountOutMinUni,
        externalCallData: ethers.getBytes("0x"),
        isV3: false, // Sử dụng Uniswap V2
    };

    const avgFee = await controller.averageSystemActionFee();
    console.log(`Phí hệ thống trung bình: ${ethers.formatUnits(avgFee, 18)} BaseToken`);
    if (depositParam.distributionFee > avgFee) {
        throw new Error(
            `Phí phân phối (${ethers.formatUnits(depositParam.distributionFee, 6)} USDC) vượt quá phí hệ thống trung bình (${ethers.formatUnits(avgFee, 18)} UNI)`
        );
    }

    // 2. Kiểm tra trạng thái hợp đồng
    const isRouterPaused = await router.paused();
    console.log(`MoneyFiRouter paused? ${isRouterPaused}`);
    const isVaultPaused = await fundVault.paused();
    console.log(`MoneyFiFundVault paused? ${isVaultPaused}`);
    if (isRouterPaused || isVaultPaused) {
        console.log("Đang bỏ tạm dừng hợp đồng...");
        if (isRouterPaused) {
            await router.connect(deployer).unpause();
            console.log("Đã bỏ tạm dừng MoneyFiRouter");
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
        if (isVaultPaused) {
            await fundVault.connect(deployer).unpause();
            console.log("Đã bỏ tạm dừng MoneyFiFundVault");
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }

    // 3. Kiểm tra số dư USDC trong FundVault của user
    const userDepositInfo = await fundVault.getUserDepositInfor(usdcAddress, user.address);
    console.log("Thông tin deposit của user trước khi thêm thanh khoản:");
    console.log("  Số dư gốc:", ethers.formatUnits(userDepositInfo.originalDepositAmount, 6), "USDC");
    console.log("  Số dư hiện tại:", ethers.formatUnits(userDepositInfo.currentDepositAmount, 6), "USDC");
    if (userDepositInfo.currentDepositAmount < amount) {
        throw new Error("User không đủ USDC trong FundVault");
    }

    // 4. Kiểm tra số dư USDC của FundVault
    const fundVaultUsdcBalance = await usdc.balanceOf(fundVaultAddress);
    console.log("FundVault USDC balance trước khi deposit:", ethers.formatUnits(fundVaultUsdcBalance, 6), "USDC");
    if (fundVaultUsdcBalance < amount) {
        throw new Error("FundVault không đủ USDC");
    }

    // 5. Kiểm tra allowance của FundVault cho Router
    const allowance = await usdc.allowance(fundVaultAddress, routerAddress);
    console.log(`Allowance của FundVault cho Router: ${ethers.formatUnits(allowance, 6)} USDC`);
    if (allowance < amount) {
        console.log(`Phê duyệt ${ethers.formatUnits(amount, 6)} USDC cho Router...`);
        await usdc.connect(deployer).approve(routerAddress, ethers.MaxUint256, { gasLimit: 100000 });
        console.log("Phê duyệt thành công");
    }

    // 6. Kiểm tra trạng thái strategy
    const isStrategyActive = await controller.isStrategyInternalActive(strategyAddress);
    console.log(`Strategy active? ${isStrategyActive}`);
    if (!isStrategyActive) {
        throw new Error("Strategy không hoạt động trong MoneyFiController");
    }
    const underlyingAsset = await strategy.asset();
    console.log(`Strategy underlying asset: ${underlyingAsset}`);
    if (underlyingAsset.toLowerCase() !== baseTokenAddress.toLowerCase()) {
        throw new Error("Strategy underlying asset không khớp với UNI");
    }

    // 7. Kiểm tra pool reserves
    const [reserve0, reserve1] = await pair.getReserves();
    const token0 = await pair.token0();
    const isBaseToken0 = token0.toLowerCase() === baseTokenAddress.toLowerCase();
    console.log("Dự trữ pool trước khi deposit:", {
        baseToken: ethers.formatUnits(isBaseToken0 ? reserve0 : reserve1, 18),
        quoteToken: ethers.formatUnits(isBaseToken0 ? reserve1 : reserve0, 18),
    });

    // 8. Kiểm tra pool TVL để tránh lỗi chia cho 0
    const poolTVL = await strategy.totalLiquidWhitelistPool();
    console.log(`Pool TVL: ${ethers.formatUnits(poolTVL, 18)}`);

    // 10. Thực hiện deposit
    console.log("=================================================================");
    console.log("Deployer đang deposit 1 USDC vào Strategy cho user...");
    try {
        const depositTx = await router
            .connect(deployer)
            .depositFundToStrategySameChainFromOperator(depositParam, swapTokenParam, { gasLimit: 1000000 });
        await depositTx.wait();
        console.log("Deposit thành công, tx:", depositTx.hash);
    } catch (error) {
        console.error("Deposit thất bại:", error.message);
        throw error;
    }

    // 11. Kiểm tra sau deposit
    const shares = await strategy.balanceOf(user.address);
    console.log("Shares của user trong Strategy:", ethers.formatUnits(shares, 18));

    const totalAssets = await strategy.totalAssets();
    console.log("Tổng tài sản trong Strategy:", ethers.formatUnits(totalAssets, 18), "UNI");

    const [reserve0After, reserve1After] = await pair.getReserves();
    console.log("Dự trữ pool sau khi thêm thanh khoản:", {
        baseToken: ethers.formatUnits(isUniToken0 ? reserve0After : reserve1After, 18),
        quoteToken: ethers.formatUnits(isUniToken0 ? reserve1After : reserve0After, 18),
    });

    const updatedDepositInfo = await fundVault.getUserDepositInfor(usdcAddress, user.address);
    console.log("Thông tin deposit của user sau khi thêm thanh khoản:");
    console.log("  Số dư gốc:", ethers.formatUnits(updatedDepositInfo.originalDepositAmount, 6), "USDC");
    console.log("  Số dư hiện tại:", ethers.formatUnits(updatedDepositInfo.currentDepositAmount, 6), "USDC");

    const updatedLpBalance = await tokenLp.balanceOf(user.address);
    console.log("Số dư mUSDC của user sau khi thêm thanh khoản:", ethers.formatUnits(updatedLpBalance, 6), "mUSDC");

    const distributeFee = await fundVault.distributeFee(usdcAddress);
    console.log("Phí phân phối trong FundVault:", ethers.formatUnits(distributeFee, 6), "USDC");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Lỗi:", error.message);
        process.exit(1);
    });