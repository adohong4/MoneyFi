const { ethers } = require("hardhat");
require("dotenv").config();

// npx hardhat run test/deposit/pool/addPoolUsdc_Eth.js --network sepolia

async function main() {
    // Lấy tài khoản
    const [deployer, user] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    console.log(`User address: ${user.address}`);

    // Địa chỉ hợp đồng từ .env
    const routerAddress = process.env.MONEYFI_ROUTER;
    const fundVaultAddress = process.env.MONEYFI_FUND_VAULT;
    const usdcAddress = process.env.USDC_SEPOLIA_ADDRESS;
    const strategyAddress = process.env.MONEYFI_STRATEGY_UPGRADEABLE_UNISWAP_V2;
    const tokenLpAddress = process.env.MONEYFI_TOKEN_LP;
    const pairAddress = "0x72e46e15ef83c896de44B1874B4AF7dDAB5b4F74";
    const controllerAddress = process.env.MONEYFI_CONTROLLER;
    const wethAddress = process.env.WETH_SEPOLIA_ADDRESS;

    // Kiểm tra biến môi trường
    if (!usdcAddress || !strategyAddress || !routerAddress || !fundVaultAddress || !tokenLpAddress || !controllerAddress) {
        throw new Error("Missing required contract addresses in .env");
    }

    // Kết nối hợp đồng
    const router = await ethers.getContractAt("MoneyFiRouter", routerAddress, deployer);
    const fundVault = await ethers.getContractAt("MoneyFiFundVault", fundVaultAddress, deployer);
    const usdc = await ethers.getContractAt("IERC20", usdcAddress, deployer);
    const strategy = await ethers.getContractAt("MoneyFiStrategyUpgradeableUniswapV2", strategyAddress, deployer);
    const tokenLp = await ethers.getContractAt("MoneyFiTokenLp", tokenLpAddress, deployer);
    const pair = await ethers.getContractAt("IUniswapV2Pair", pairAddress, deployer);
    const controller = await ethers.getContractAt("MoneyFiController", controllerAddress, deployer);

    // Kiểm tra uniswapPair trong strategy (quan trọng để xác nhận pool đúng)
    const strategyPair = await strategy.uniswapPair();
    console.log(`Uniswap pair in strategy: ${strategyPair}`);
    if (strategyPair.toLowerCase() !== pairAddress.toLowerCase()) {
        throw new Error(`Strategy uniswapPair (${strategyPair}) does not match pool address (${pairAddress}). Cần deploy lại strategy.`);
    }

    // 1. Kiểm tra dữ liệu đầu vào
    const amount = ethers.parseUnits("1", 6); // 1 USDC
    const depositParam = {
        strategyAddress: strategyAddress,
        depositor: user.address,
        depositedTokenAddress: usdcAddress,
        amount: amount,
        distributionFee: ethers.parseUnits("0.0", 6),
        externalCallData: ethers.getBytes("0x"),
    };
    const swapTokenParam = {
        swapContract: "0x0000000000000000000000000000000000000000",
        amountOutMin: 0,
        externalCallData: ethers.getBytes("0x"),
        isV3: false,
    };

    // Kiểm tra depositParam
    if (depositParam.strategyAddress === ethers.ZeroAddress) {
        throw new Error("Invalid strategy address");
    }
    if (depositParam.depositor === ethers.ZeroAddress) {
        throw new Error("Invalid depositor address");
    }
    if (depositParam.depositedTokenAddress === ethers.ZeroAddress) {
        throw new Error("Invalid deposited token address");
    }
    if (depositParam.amount <= 0) {
        throw new Error("Deposit amount must be greater than 0");
    }
    const avgFee = await controller.averageSystemActionFee();
    console.log(`Average system action fee: ${ethers.formatUnits(avgFee, 6)} USDC`);
    if (depositParam.distributionFee > avgFee) {
        throw new Error(
            `Distribution fee (${ethers.formatUnits(depositParam.distributionFee, 6)} USDC) exceeds average system action fee (${ethers.formatUnits(avgFee, 6)} USDC)`
        );
    }

    // 2. Kiểm tra trạng thái hợp đồng
    const isRouterPaused = await router.paused();
    console.log(`MoneyFiRouter paused? ${isRouterPaused}`);
    const isVaultPaused = await fundVault.paused();
    console.log(`MoneyFiFundVault paused? ${isVaultPaused}`);
    if (isRouterPaused || isVaultPaused) {
        console.log("Unpausing contracts...");
        if (isRouterPaused) {
            await router.connect(deployer).unpause();
            console.log("Unpaused MoneyFiRouter");
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
        if (isVaultPaused) {
            await fundVault.connect(deployer).unpause();
            console.log("Unpaused MoneyFiFundVault");
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }

    // 3. Kiểm tra số dư USDC trong FundVault của user
    const userDepositInfo = await fundVault.getUserDepositInfor(usdcAddress, user.address);
    console.log("User Deposit Info before deposit:");
    console.log("  Original Deposit Amount:", ethers.formatUnits(userDepositInfo.originalDepositAmount, 6), "USDC");
    console.log("  Current Deposit Amount:", ethers.formatUnits(userDepositInfo.currentDepositAmount, 6), "USDC");
    if (userDepositInfo.currentDepositAmount < amount) {
        throw new Error("Insufficient USDC balance in FundVault for user");
    }

    // 4. Kiểm tra số dư USDC của FundVault
    const fundVaultUsdcBalance = await usdc.balanceOf(fundVaultAddress);
    console.log("FundVault USDC balance before deposit:", ethers.formatUnits(fundVaultUsdcBalance, 6), "USDC");
    if (fundVaultUsdcBalance < amount) {
        throw new Error("Insufficient USDC balance in FundVault");
    }

    // 5. Kiểm tra allowance của FundVault cho Router (không cần approve vì FundVault dùng safeTransfer, không cần allowance)
    const allowance = await usdc.allowance(fundVaultAddress, routerAddress);
    console.log(`Allowance of FundVault for Router: ${ethers.formatUnits(allowance, 6)} USDC`);
    // Bỏ phần approve vì FundVault không có hàm approve, và transferFundToRouter dùng safeTransfer (không cần allowance)

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
    console.log("Pool reserves before deposit:", {
        USDC: ethers.formatUnits(reserve0, 6),
        WETH: ethers.formatUnits(reserve1, 18),
    });

    // 8. Thực hiện deposit
    console.log("=================================================================");
    console.log("Deployer depositing 1 USDC to Strategy for user...");
    try {
        const depositTx = await router
            .connect(deployer)
            .depositFundToStrategySameChainFromOperator(depositParam, swapTokenParam, { gasLimit: 500000 });
        await depositTx.wait();
        console.log("Deposit successful, tx:", depositTx.hash);
    } catch (error) {
        console.error("Deposit failed:", error);
        throw error;
    }

    // Các phần kiểm tra sau deposit giữ nguyên như script gốc
    const shares = await strategy.balanceOf(user.address);
    console.log("User shares in Strategy:", ethers.formatUnits(shares, 18));

    const totalAssets = await strategy.totalAssets();
    console.log("Total assets in Strategy:", ethers.formatUnits(totalAssets, 6), "USDC");

    const [reserve0After, reserve1After] = await pair.getReserves();
    console.log("Pool reserves after deposit:", {
        USDC: ethers.formatUnits(reserve0After, 6),
        WETH: ethers.formatUnits(reserve1After, 18),
    });

    const updatedDepositInfo = await fundVault.getUserDepositInfor(usdcAddress, user.address);
    console.log("User Deposit Info after deposit:");
    console.log("  Original Deposit Amount:", ethers.formatUnits(updatedDepositInfo.originalDepositAmount, 6), "USDC");
    console.log("  Current Deposit Amount:", ethers.formatUnits(updatedDepositInfo.currentDepositAmount, 6), "USDC");

    const updatedLpBalance = await tokenLp.balanceOf(user.address);
    console.log("User mUSDC balance after deposit:", ethers.formatUnits(updatedLpBalance, 6), "mUSDC");

    const distributeFee = await fundVault.distributeFee(usdcAddress);
    console.log("Distribute Fee in FundVault:", ethers.formatUnits(distributeFee, 6), "USDC");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });