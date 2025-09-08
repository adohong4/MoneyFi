const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("MoneyFi Info Print with Role Checks", function () {
    this.timeout(100000); // Timeout 100 giây để đảm bảo mạng Sepolia không bị lỗi

    let deployer, user;
    let moneyFiRouter, moneyFiFundVault, moneyFiTokenLp, moneyFiController, usdc;
    const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Địa chỉ USDC trên Sepolia
    const TOKEN_LP_ADDRESS = "0x7d66cE2d182f58e5477043a0B805ED3D52af5f7a"; // Địa chỉ MoneyFiTokenLp
    const CONTROLLER_ADDRESS = "0xc9fb98df97385d00E59c69eb54C8B9716711B84b"; // Địa chỉ MoneyFiController

    before(async function () {
        // Lấy tài khoản
        [deployer, user] = await ethers.getSigners();

        // Kết nối tới các contract đã deploy
        moneyFiRouter = await ethers.getContractAt(
            "MoneyFiRouter",
            "0xc55156145e5e445F492AC65a563Ac347A07a017a",
            deployer
        );
        moneyFiFundVault = await ethers.getContractAt(
            "MoneyFiFundVault",
            "0xd885A2aFf2EE5C2B6b7a7736e6f4aBCaE721244a",
            deployer
        );
        moneyFiTokenLp = await ethers.getContractAt(
            "MoneyFiTokenLp",
            TOKEN_LP_ADDRESS,
            deployer
        );
        moneyFiController = await ethers.getContractAt(
            "MoneyFiController",
            CONTROLLER_ADDRESS,
            deployer
        );
        usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS, deployer);
    });

    it("should print current information and roles of deployer and user", async function () {
        // 1. In địa chỉ của deployer và user
        console.log("=== Địa chỉ ===");
        console.log("Deployer address:", deployer.address);
        console.log("User address:", user.address);

        // 2. In số dư USDC
        console.log("\n=== Số dư USDC ===");
        const deployerUsdcBalance = await usdc.balanceOf(deployer.address);
        console.log(`Số dư USDC của deployer: ${ethers.formatUnits(deployerUsdcBalance, 6)} USDC`);
        const userUsdcBalance = await usdc.balanceOf(user.address);
        console.log(`Số dư USDC của user: ${ethers.formatUnits(userUsdcBalance, 6)} USDC`);

        // 3. In số dư LP token (mUSDC)
        console.log("\n=== Số dư LP token (mUSDC) ===");
        const deployerLpBalance = await moneyFiTokenLp.balanceOf(deployer.address);
        console.log(`Số dư mUSDC của deployer: ${ethers.formatUnits(deployerLpBalance, 6)} mUSDC`);
        const userLpBalance = await moneyFiTokenLp.balanceOf(user.address);
        console.log(`Số dư mUSDC của user: ${ethers.formatUnits(userLpBalance, 6)} mUSDC`);

        // 4. In thông tin deposit của user trong MoneyFiFundVault
        console.log("\n=== Thông tin deposit của user trong MoneyFiFundVault ===");
        const userDepositInfo = await moneyFiFundVault.getUserDepositInfor(USDC_ADDRESS, user.address);
        console.log("Original Deposit Amount:", ethers.formatUnits(userDepositInfo.originalDepositAmount, 6), "USDC");
        console.log("Current Deposit Amount:", ethers.formatUnits(userDepositInfo.currentDepositAmount, 6), "USDC");
        console.log("Updated At (timestamp):", userDepositInfo.updatedAt.toString());

        // 5. In quyền của deployer trong MoneyFiController
        console.log("\n=== Quyền của Deployer trong MoneyFiController ===");
        const isAdminDeployer = await moneyFiController.isAdmin(deployer.address);
        console.log(`Is ${deployer.address} admin? ${isAdminDeployer}`);
        const isDelegateAdminDeployer = await moneyFiController.isDelegateAdmin(deployer.address);
        console.log(`Is ${deployer.address} delegate admin? ${isDelegateAdminDeployer}`);
        const isOperatorDeployer = await moneyFiController.isOperator(deployer.address);
        console.log(`Is ${deployer.address} operator? ${isOperatorDeployer}`);
        const isSignerDeployer = await moneyFiController.isSigner(deployer.address);
        console.log(`Is ${deployer.address} signer? ${isSignerDeployer}`);

        // 6. In quyền của user trong MoneyFiController
        console.log("\n=== Quyền của User trong MoneyFiController ===");
        const isAdminUser = await moneyFiController.isAdmin(user.address);
        console.log(`Is ${user.address} admin? ${isAdminUser}`);
        const isDelegateAdminUser = await moneyFiController.isDelegateAdmin(user.address);
        console.log(`Is ${user.address} delegate admin? ${isDelegateAdminUser}`);
        const isOperatorUser = await moneyFiController.isOperator(user.address);
        console.log(`Is ${user.address} operator? ${isOperatorUser}`);
        const isSignerUser = await moneyFiController.isSigner(user.address);
        console.log(`Is ${user.address} signer? ${isSignerUser}`);

        // 7. In trạng thái pause của contract
        console.log("\n=== Trạng thái pause ===");
        const isRouterPaused = await moneyFiRouter.paused();
        console.log(`MoneyFiRouter paused? ${isRouterPaused}`);
        const isVaultPaused = await moneyFiFundVault.paused();
        console.log(`MoneyFiFundVault paused? ${isVaultPaused}`);

        // 8. In allowance của user cho MoneyFiRouter
        console.log("\n=== Allowance ===");
        const allowance = await usdc.allowance(user.address, moneyFiRouter.target);
        console.log(`Allowance của user cho MoneyFiRouter: ${ethers.formatUnits(allowance, 6)} USDC`);

        // 9. In cấu hình token USDC trong MoneyFiController
        console.log("\n=== Cấu hình token USDC trong MoneyFiController ===");
        const tokenInfo = await moneyFiController.getSupportedTokenInternalInfor(USDC_ADDRESS);
        console.log("Token Info:");
        console.log("  Min Deposit Amount:", ethers.formatUnits(tokenInfo.minDepositAmount, 6), "USDC");
        console.log("  Decimals:", tokenInfo.decimals.toString());
        console.log("  Chain ID:", tokenInfo.chainId.toString());
        console.log("  Is Active:", tokenInfo.isActive);
        console.log("  LP Token Address:", tokenInfo.lpTokenAddress);

        // 10. In decimals của MoneyFiTokenLp
        console.log("\n=== Decimals của MoneyFiTokenLp ===");
        const lpDecimals = await moneyFiTokenLp.decimals();
        console.log(`Decimals của MoneyFiTokenLp: ${lpDecimals}`);
    });
});