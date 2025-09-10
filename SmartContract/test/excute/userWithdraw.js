const { ethers } = require("hardhat");
require("dotenv").config();

// npx hardhat run scripts/userWithdraw.js --network sepolia
async function main() {
    const [deployer, user] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    console.log(`User address: ${user.address}`);

    // Địa chỉ hợp đồng từ .env
    const routerAddress = process.env.MONEYFI_ROUTER;
    const fundVaultAddress = process.env.MONEYFI_FUND_VAULT;
    const usdcAddress = process.env.USDC_SEPOLIA_ADDRESS;
    const tokenLpAddress = process.env.MONEYFI_TOKEN_LP;
    const controllerAddress = process.env.MONEYFI_CONTROLLER;

    // Kiểm tra biến môi trường
    if (!usdcAddress || !routerAddress || !fundVaultAddress || !tokenLpAddress || !controllerAddress) {
        throw new Error("Missing required contract addresses in .env");
    }

    // Khởi tạo hợp đồng
    const MoneyFiRouter = await ethers.getContractFactory("MoneyFiRouter");
    const router = MoneyFiRouter.attach(routerAddress).connect(user); // User thực hiện rút
    const fundVault = await ethers.getContractAt("MoneyFiFundVault", fundVaultAddress, deployer);
    const usdc = await ethers.getContractAt("IERC20", usdcAddress, deployer);
    const tokenLp = await ethers.getContractAt("IERC20", tokenLpAddress, deployer); // Sử dụng IERC20 cho mUSDC
    const controller = await ethers.getContractAt("MoneyFiController", controllerAddress, deployer);

    // Kiểm tra mã hợp đồng
    const routerCode = await ethers.provider.getCode(routerAddress);
    console.log("Router contract code exists?", routerCode !== "0x");

    // Kiểm tra trạng thái paused của Router và FundVault
    const isRouterPaused = await router.paused();
    const isFundVaultPaused = await fundVault.paused();
    console.log(`Router paused? ${isRouterPaused}`);
    console.log(`FundVault paused? ${isFundVaultPaused}`);
    if (isRouterPaused || isFundVaultPaused) {
        throw new Error("Router or FundVault is paused");
    }

    // Kiểm tra số dư USDC và mUSDC của user
    const userUsdcBalance = await usdc.balanceOf(user.address);
    console.log(`User USDC balance: ${ethers.formatUnits(userUsdcBalance, 6)} USDC`);
    const userLpBalance = await tokenLp.balanceOf(user.address);
    console.log(`User mUSDC balance: ${ethers.formatUnits(userLpBalance, 6)} mUSDC`);

    // Kiểm tra số dư USDC trong FundVault
    const vaultBalance = await usdc.balanceOf(fundVaultAddress);
    console.log(`FundVault USDC balance: ${ethers.formatUnits(vaultBalance, 6)} USDC`);

    // Kiểm tra thông tin token USDC trong Controller
    const tokenInfo = await controller.getSupportedTokenInternalInfor(usdcAddress);
    console.log("Token Info for USDC:", {
        isActive: tokenInfo.isActive,
        minDepositAmount: ethers.formatUnits(tokenInfo.minDepositAmount, 6),
        lpTokenAddress: tokenInfo.lpTokenAddress,
    });
    if (!tokenInfo.isActive || tokenInfo.lpTokenAddress === ethers.ZeroAddress) {
        throw new Error("USDC is not supported or LP token is not configured");
    }

    // Kiểm tra allowance của mUSDC cho FundVault
    const withdrawAmount = ethers.parseUnits("2", 6); // Rút 2 USDC
    const allowance = await tokenLp.allowance(user.address, fundVaultAddress);
    console.log(`mUSDC allowance for FundVault: ${ethers.formatUnits(allowance, 6)} mUSDC`);
    if (allowance < withdrawAmount) {
        console.log("Approving mUSDC for FundVault...");
        await tokenLp.connect(user).approve(fundVaultAddress, withdrawAmount);
        console.log(`Approved ${ethers.formatUnits(withdrawAmount, 6)} mUSDC for FundVault`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // Kiểm tra thời gian cooldown rút tiền
    const nextWithdrawTime = await router.getNextWithdrawRequestTime(user.address);
    const currentTime = Math.floor(Date.now() / 1000);
    console.log(`Next withdraw allowed time: ${nextWithdrawTime}, Current time: ${currentTime}`);
    if (nextWithdrawTime > currentTime) {
        throw new Error(`Withdraw cooldown not met. Wait until ${new Date(nextWithdrawTime * 1000).toLocaleString()}`);
    }

    // Tham số rút tiền
    const withdrawStrategySameChains = []; // Không rút từ strategy
    const unDistributedWithdraw = [
        {
            tokenAddress: usdcAddress,
            unDistributedAmount: withdrawAmount, // Rút 2 USDC từ undistributed fund
        }
    ];
    const isReferral = false; // Không sử dụng referral
    const signature = "0x"; // Không cần chữ ký
    const swapParam = {
        swapImpl: ethers.ZeroAddress, // Không swap
        tokenReceive: ethers.ZeroAddress, // Nhận USDC trực tiếp
        amountOutMin: 0,
        externalCallData: "0x", // Chuỗi rỗng
        isV3: false,
    };

    // Kiểm tra số dư mUSDC và USDC
    if (userLpBalance < withdrawAmount) {
        throw new Error(`User does not have enough mUSDC to withdraw ${ethers.formatUnits(withdrawAmount, 6)} USDC`);
    }
    if (vaultBalance < withdrawAmount) {
        throw new Error(`FundVault does not have enough USDC to withdraw ${ethers.formatUnits(withdrawAmount, 6)} USDC`);
    }

    // Thực hiện rút tiền
    console.log(`Withdrawing ${ethers.formatUnits(withdrawAmount, 6)} USDC from undistributed fund...`);
    try {
        const withdrawTx = await router
            .connect(user)
            .withdrawFundSameChain(
                withdrawStrategySameChains,
                unDistributedWithdraw,
                isReferral,
                signature,
                swapParam,
                { gasLimit: 300000 }
            );
        console.log("Transaction sent, waiting for confirmation...");
        const receipt = await withdrawTx.wait();
        console.log("Withdraw successful, tx:", withdrawTx.hash);
    } catch (error) {
        console.error("Withdraw failed:", error);
        throw error;
    }

    // Kiểm tra số dư sau khi rút
    const finalUsdcBalance = await usdc.balanceOf(user.address);
    console.log(`User USDC balance after withdraw: ${ethers.formatUnits(finalUsdcBalance, 6)} USDC`);
    const finalLpBalance = await tokenLp.balanceOf(user.address);
    console.log(`User mUSDC balance after withdraw: ${ethers.formatUnits(finalLpBalance, 6)} mUSDC`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });