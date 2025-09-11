const { ethers } = require("hardhat");
require("dotenv").config();

// npx hardhat run test/excute/testDepositToStrategy.test.js --network sepolia
async function main() {
    const [deployer, user] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    console.log(`User address: ${user.address}`);

    const routerAddress = process.env.MONEYFI_ROUTER;
    const fundVaultAddress = process.env.MONEYFI_FUND_VAULT;
    const usdcAddress = process.env.USDC_SEPOLIA_ADDRESS;
    const wethAddress = process.env.WETH_SEPOLIA_ADDRESS;
    const strategyAddress = process.env.MONEYFI_STRATEGY_UPGRADEABLE_UNISWAP;
    const tokenLpAddress = process.env.MONEYFI_TOKEN_LP;
    const pairAddress = "0x72e46e15ef83c896de44B1874B4AF7dDAB5b4F74";
    const controllerAddress = process.env.MONEYFI_CONTROLLER;

    if (!usdcAddress || !strategyAddress || !routerAddress || !fundVaultAddress || !tokenLpAddress || !controllerAddress) {
        throw new Error("Missing required contract addresses in .env");
    }

    // Sử dụng contract factory để đảm bảo ABI mới nhất
    const MoneyFiRouter = await ethers.getContractFactory("MoneyFiRouter");
    const router = MoneyFiRouter.attach(routerAddress).connect(deployer);
    const fundVault = await ethers.getContractAt("MoneyFiFundVault", fundVaultAddress, deployer);
    const usdc = await ethers.getContractAt("IERC20", usdcAddress, deployer);
    const weth = await ethers.getContractAt("IERC20", wethAddress, deployer);
    const strategy = await ethers.getContractAt("MoneyFiStrategyUpgradeableUniswap", strategyAddress, deployer);
    console.log("Strategy address:", strategy);

    const tokenLp = await ethers.getContractAt("MoneyFiTokenLp", tokenLpAddress, deployer);
    const pair = await ethers.getContractAt("IUniswapV2Pair", pairAddress, deployer);
    const controller = await ethers.getContractAt("MoneyFiController", controllerAddress, deployer);

    // Kiểm tra mã hợp đồng
    const routerCode = await ethers.provider.getCode(routerAddress);
    console.log("Router contract code exists?", routerCode !== "0x");

    // Kiểm tra quyền OPERATOR_ROLE
    const isOperator = await controller.isOperator(deployer.address);
    console.log(`Is ${deployer.address} operator? ${isOperator}`);

    // Kiểm tra lpTokenAddress
    const tokenInfo = await controller.getSupportedTokenInternalInfor(usdcAddress);
    console.log("Token Info for USDC:", {
        isActive: tokenInfo.isActive,
        minDepositAmount: ethers.formatUnits(tokenInfo.minDepositAmount, 6),
        lpTokenAddress: tokenInfo.lpTokenAddress,
    });
    if (tokenInfo.lpTokenAddress === ethers.ZeroAddress) {
        console.log("Adding USDC to supported tokens...");
        await controller.connect(deployer).addSupportedToken(
            usdcAddress,
            ethers.parseUnits("0.1", 6),
            tokenLpAddress,
            true
        );
        console.log("Added USDC with LP token:", tokenLpAddress);
    }

    // Kiểm tra số dư USDC của FundVault và Router
    const vaultBalance = await usdc.balanceOf(fundVaultAddress);
    console.log(`FundVault USDC balance: ${ethers.formatUnits(vaultBalance, 6)} USDC`);
    const routerBalance = await usdc.balanceOf(routerAddress);
    console.log(`Router USDC balance: ${ethers.formatUnits(routerBalance, 6)} USDC`);
    if (vaultBalance < ethers.parseUnits("2", 6)) {
        console.log("Transferring USDC to FundVault...");
        await usdc.connect(deployer).transfer(fundVaultAddress, ethers.parseUnits("10", 6));
        console.log("Transferred 10 USDC to FundVault");
    }

    // Kiểm tra số dư mUSDC của user
    const lpBalance = await tokenLp.balanceOf(user.address);
    console.log(`User mUSDC balance: ${ethers.formatUnits(lpBalance, 6)} mUSDC`);
    if (lpBalance < ethers.parseUnits("2", 6)) {
        console.log("Depositing USDC to mint mUSDC for user...");
        await fundVault.connect(deployer).depositFund(usdcAddress, user.address, ethers.parseUnits("2", 6));
        console.log("Minted 2 mUSDC for user");
    }

    // Kiểm tra cấu hình strategy
    const isActive = await controller.isStrategyInternalActive(strategyAddress);
    console.log(`Strategy active? ${isActive}`);
    if (!isActive) {
        console.log("Activating strategy...");
        await controller.connect(deployer).addStrategy(strategyAddress);
    }

    const underlyingAsset = await strategy.asset();
    console.log(`Strategy underlying asset: ${underlyingAsset}`);
    if (underlyingAsset.toLowerCase() !== usdcAddress.toLowerCase()) {
        throw new Error("Strategy underlying asset does not match USDC");
    }

    // Kiểm tra Uniswap pool
    const [reserve0, reserve1] = await pair.getReserves();
    console.log("Pool reserves:", {
        USDC: ethers.formatUnits(reserve0, 6),
        WETH: ethers.formatUnits(reserve1, 18),
    });

    // Kiểm tra cấu hình Uniswap trong strategy
    console.log("Uniswap Router:", await strategy.uniswapRouter());
    console.log("Uniswap Pair:", await strategy.uniswapPair());

    // Tham số deposit
    const depositParam = {
        strategyAddress: strategyAddress,
        depositor: user.address,
        depositedTokenAddress: usdcAddress,
        amount: ethers.parseUnits("2", 6),
        distributionFee: ethers.parseUnits("0.0", 6),
        externalCallData: ethers.getBytes("0x"),
    };
    const swapTokenParam = {
        swapContract: "0x0000000000000000000000000000000000000000",
        amountOutMin: 0,
        externalCallData: ethers.getBytes("0x"),
        isV3: false,
    };

    // Thực hiện deposit
    console.log("Depositing 2 USDC...");
    try {
        const depositTx = await router
            .connect(deployer)
            .depositFundToStrategySameChainFromOperator(depositParam, swapTokenParam, { gasLimit: 1000000 });
        console.log("Transaction sent, waiting for confirmation...");
        await depositTx.wait();
        console.log("Deposit successful, tx:", depositTx.hash);
    } catch (error) {
        console.error("Deposit failed:", error);
        throw error;
    }

    // Thêm vào cuối script test
    console.log("Post-deposit balances:");
    console.log("Strategy USDC balance:", ethers.formatUnits(await usdc.balanceOf(strategyAddress), 6));
    console.log("Strategy WETH balance:", ethers.formatUnits(await weth.balanceOf(strategyAddress), 18)); // weth=0xfFf99...
    console.log("Strategy LP balance:", ethers.formatUnits(await pair.balanceOf(strategyAddress), 18));
    console.log("Pool reserves post:", {
        USDC: ethers.formatUnits(await pair.token0() === usdcAddress ? (await pair.getReserves())[0] : (await pair.getReserves())[1], 6),
        WETH: ethers.formatUnits(await pair.token0() !== usdcAddress ? (await pair.getReserves())[0] : (await pair.getReserves())[1], 18)
    });
    console.log("Strategy emergencyStop?", await strategy.emergencyStop());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });