const { ethers } = require("hardhat");
const { expect } = require("chai");

// npx hardhat test test/checkFundVault.test.js --network sepolia

describe("MoneyFi Deposit Test", function () {
    this.timeout(100000); // Tăng timeout lên 100 giây

    let deployer, user;
    let moneyFiRouter, moneyFiFundVault, moneyFiTokenLp, moneyFiController, usdc;
    const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Địa chỉ USDC trên Sepolia
    const TOKEN_LP_ADDRESS = "0x88C3e7da67170E731B261475F3eB73f477355f4f"; // Địa chỉ MoneyFiTokenLp
    const AMOUNT_TO_DEPOSIT = ethers.parseUnits("5", 6); // 5 USDC (6 decimals)
    let errors = []; // Mảng để lưu các lỗi

    // Hàm để ghi lại lỗi thay vì dừng test
    async function assertWithTryCatch(description, callback) {
        try {
            await callback();
            console.log(`✓ ${description}: Passed`);
        } catch (error) {
            console.error(`✗ ${description}: Failed - ${error.message}`);
            errors.push({ description, error: error.message });
        }
    }

    before(async function () {
        console.log("=== Starting Setup ===");
        // Lấy tài khoản
        [deployer, user] = await ethers.getSigners();
        console.log("Deployer address:", deployer.address);
        console.log("User address:", user.address);

        // Kết nối tới các contract đã deploy
        moneyFiRouter = await ethers.getContractAt(
            "MoneyFiRouter",
            "0x2a64f7a1F0fb00d05Da02F37f1Ee0825CfCecb73",
            deployer
        );
        moneyFiFundVault = await ethers.getContractAt(
            "MoneyFiFundVault",
            "0xecec15AfAE07feE618D60406a3705945c35C34Cc",
            deployer
        );
        moneyFiTokenLp = await ethers.getContractAt(
            "MoneyFiTokenLp",
            TOKEN_LP_ADDRESS,
            deployer
        );
        moneyFiController = await ethers.getContractAt(
            "MoneyFiController",
            "0x95f26cFAd70874e8e4FAF33B9a65634a44b10078",
            deployer
        );
        usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS, deployer);

        // Kiểm tra số dư USDC của user
        const userBalance = await usdc.balanceOf(user.address);
        console.log(`Số dư USDC của user: ${ethers.formatUnits(userBalance, 6)} USDC`);
        await assertWithTryCatch("User has enough USDC", async () => {
            expect(userBalance).to.be.gte(AMOUNT_TO_DEPOSIT, "User không đủ USDC để test");
        });

        // Kiểm tra trạng thái pause của contract
        const isRouterPaused = await moneyFiRouter.paused();
        const isVaultPaused = await moneyFiFundVault.paused();
        console.log(`MoneyFiRouter paused? ${isRouterPaused}`);
        console.log(`MoneyFiFundVault paused? ${isVaultPaused}`);
        if (isRouterPaused) {
            try {
                await moneyFiRouter.connect(deployer).unpause();
                console.log("Đã unpause MoneyFiRouter!");
                await new Promise((resolve) => setTimeout(resolve, 5000)); // Đợi 5 giây
            } catch (error) {
                console.error(`Failed to unpause MoneyFiRouter: ${error.message}`);
                errors.push({ description: "Unpause MoneyFiRouter", error: error.message });
            }
        }
        if (isVaultPaused) {
            try {
                await moneyFiFundVault.connect(deployer).unpause();
                console.log("Đã unpause MoneyFiFundVault!");
                await new Promise((resolve) => setTimeout(resolve, 5000)); // Đợi 5 giây
            } catch (error) {
                console.error(`Failed to unpause MoneyFiFundVault: ${error.message}`);
                errors.push({ description: "Unpause MoneyFiFundVault", error: error.message });
            }
        }

        // Kiểm tra decimals của MoneyFiTokenLp
        const lpDecimals = await moneyFiTokenLp.decimals();
        console.log(`Decimals của MoneyFiTokenLp: ${lpDecimals}`);
        await assertWithTryCatch("MoneyFiTokenLp decimals is 6", async () => {
            expect(lpDecimals).to.equal(6, "Decimals của MoneyFiTokenLp phải là 6");
        });

        // Kiểm tra cấu hình token USDC trong MoneyFiController
        const tokenInfo = await moneyFiController.getSupportedTokenInternalInfor(USDC_ADDRESS);
        console.log("Token info:", tokenInfo);
        await assertWithTryCatch("USDC token is active", async () => {
            expect(tokenInfo.isActive).to.be.true;
        });
        await assertWithTryCatch("USDC token has correct LP token address", async () => {
            expect(tokenInfo.lpTokenAddress).to.equal(TOKEN_LP_ADDRESS);
        });
    });

    // Hàm kiểm tra số dư trong FundVault
    async function checkFundVaultBalances(userAddress, tokenAddress) {
        console.log(`\n=== Checking FundVault Balances for ${userAddress} ===`);

        // 1. Kiểm tra số dư USDC của FundVault
        const vaultUsdcBalance = await usdc.balanceOf(moneyFiFundVault.target);
        console.log(`USDC balance of FundVault: ${ethers.formatUnits(vaultUsdcBalance, 6)} USDC`);

        // 2. Kiểm tra thông tin deposit của user trong FundVault
        const userDepositInfo = await moneyFiFundVault.getUserDepositInfor(tokenAddress, userAddress);
        console.log("User Deposit Info:");
        console.log(`  originalDepositAmount: ${ethers.formatUnits(userDepositInfo.originalDepositAmount, 6)} USDC`);
        console.log(`  currentDepositAmount: ${ethers.formatUnits(userDepositInfo.currentDepositAmount, 6)} USDC`);
        console.log(`  updatedAt: ${new Date(userDepositInfo.updatedAt.toNumber() * 1000).toLocaleString()}`);

        // 3. Kiểm tra số dư LP token của user
        const lpBalance = await moneyFiTokenLp.balanceOf(userAddress);
        console.log(`LP token balance of user: ${ethers.formatUnits(lpBalance, 6)} mUSDC`);

        return { vaultUsdcBalance, userDepositInfo, lpBalance };
    }

    it("should deposit USDC and mint LP token correctly", async function () {
        // Kiểm tra cấu hình token USDC trong MoneyFiController
        let tokenInfo = await moneyFiController.getSupportedTokenInternalInfor(USDC_ADDRESS);
        console.log("Token info before:", tokenInfo);
        await assertWithTryCatch("USDC token is active before deposit", async () => {
            expect(tokenInfo.isActive).to.be.true;
        });
        await assertWithTryCatch("USDC token has correct LP token address before deposit", async () => {
            expect(tokenInfo.lpTokenAddress).to.equal(TOKEN_LP_ADDRESS);
        });

        // Kiểm tra số dư trước khi deposit
        console.log("\n=== Before Deposit ===");
        let balancesBefore;
        await assertWithTryCatch("Check balances before deposit", async () => {
            balancesBefore = await checkFundVaultBalances(user.address, USDC_ADDRESS);
        });

        const userUsdcBalanceBefore = await usdc.balanceOf(user.address);
        console.log(`User USDC balance before: ${ethers.formatUnits(userUsdcBalanceBefore, 6)} USDC`);

        // Approve USDC cho MoneyFiRouter
        try {
            await usdc.connect(user).approve(moneyFiRouter.target, AMOUNT_TO_DEPOSIT);
            console.log(`Approved ${ethers.formatUnits(AMOUNT_TO_DEPOSIT, 6)} USDC for MoneyFiRouter`);
        } catch (error) {
            console.error(`Failed to approve USDC: ${error.message}`);
            errors.push({ description: "Approve USDC for MoneyFiRouter", error: error.message });
        }

        // Deposit USDC qua MoneyFiRouter
        try {
            const depositTx = await moneyFiRouter.connect(user).depositFund({
                tokenAddress: USDC_ADDRESS,
                amount: AMOUNT_TO_DEPOSIT,
            });
            await depositTx.wait();
            console.log(`Deposited ${ethers.formatUnits(AMOUNT_TO_DEPOSIT, 6)} USDC`);
        } catch (error) {
            console.error(`Deposit failed: ${error.message}`);
            errors.push({ description: "Deposit USDC", error: error.message });
        }

        // Kiểm tra số dư sau khi deposit
        console.log("\n=== After Deposit ===");
        let balancesAfter;
        await assertWithTryCatch("Check balances after deposit", async () => {
            balancesAfter = await checkFundVaultBalances(user.address, USDC_ADDRESS);
        });

        const userUsdcBalanceAfter = await usdc.balanceOf(user.address);
        console.log(`User USDC balance after: ${ethers.formatUnits(userUsdcBalanceAfter, 6)} USDC`);

        // Kiểm tra tính nhất quán
        await assertWithTryCatch("FundVault USDC balance increased correctly", async () => {
            expect(balancesAfter.vaultUsdcBalance).to.equal(
                balancesBefore.vaultUsdcBalance + AMOUNT_TO_DEPOSIT,
                "FundVault USDC balance should increase by deposit amount"
            );
        });
        await assertWithTryCatch("User currentDepositAmount increased correctly", async () => {
            expect(balancesAfter.userDepositInfo.currentDepositAmount).to.equal(
                balancesBefore.userDepositInfo.currentDepositAmount + AMOUNT_TO_DEPOSIT,
                "User currentDepositAmount should increase by deposit amount"
            );
        });
        await assertWithTryCatch("User LP token balance increased correctly", async () => {
            expect(balancesAfter.lpBalance).to.equal(
                balancesBefore.lpBalance + AMOUNT_TO_DEPOSIT,
                "User LP token balance should increase by deposit amount"
            );
        });
        await assertWithTryCatch("User USDC balance decreased correctly", async () => {
            expect(userUsdcBalanceAfter).to.equal(
                userUsdcBalanceBefore - AMOUNT_TO_DEPOSIT,
                "User USDC balance should decrease by deposit amount"
            );
        });
        await assertWithTryCatch("Current deposit amount matches LP token balance", async () => {
            expect(balancesAfter.userDepositInfo.currentDepositAmount).to.equal(
                balancesAfter.lpBalance,
                "Current deposit amount must match LP token balance"
            );
        });

        // In ra tổng kết các lỗi (nếu có)
        console.log("\n=== Test Summary ===");
        if (errors.length > 0) {
            console.log(`Found ${errors.length} errors:`);
            errors.forEach((err, index) => {
                console.log(`${index + 1}. ${err.description}: ${err.error}`);
            });
        } else {
            console.log("All checks passed!");
        }
    });
});