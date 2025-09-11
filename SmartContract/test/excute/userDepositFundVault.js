const { ethers } = require("hardhat");
const { expect } = require("chai");
require("dotenv").config();


// npx hardhat test test/excute/userDepositFundVault.js --network sepolia

describe("MoneyFi Deposit Test", function () {
    this.timeout(100000); // Tăng timeout lên 100 giây

    let deployer, user;
    let moneyFiRouter, moneyFiFundVault, moneyFiTokenLp, moneyFiController, usdc;
    const USDC_ADDRESS = process.env.USDC_SEPOLIA_ADDRESS; // Địa chỉ USDC trên Sepolia
    const TOKEN_LP_ADDRESS = process.env.MONEYFI_TOKEN_LP; // Thay bằng địa chỉ MoneyFiTokenLp mới
    const AMOUNT_TO_DEPOSIT = ethers.parseUnits("10", 6); //  USDC (6 decimals)

    before(async function () {
        // Lấy tài khoản
        [deployer, user] = await ethers.getSigners();
        console.log("Deployer address:", deployer.address);
        console.log("User address:", user.address);

        // Kết nối tới các contract đã deploy
        moneyFiRouter = await ethers.getContractAt(
            "MoneyFiRouter",
            process.env.MONEYFI_ROUTER,
            deployer
        );
        moneyFiFundVault = await ethers.getContractAt(
            "MoneyFiFundVault",
            process.env.MONEYFI_FUND_VAULT,
            deployer
        );
        moneyFiTokenLp = await ethers.getContractAt(
            "MoneyFiTokenLp",
            TOKEN_LP_ADDRESS,
            deployer
        );
        moneyFiController = await ethers.getContractAt(
            "MoneyFiController",
            process.env.MONEYFI_CONTROLLER,
            deployer
        );
        usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS, deployer);

        // Kiểm tra số dư USDC của user
        const userBalance = await usdc.balanceOf(user.address);
        console.log(`Số dư USDC của user: ${ethers.formatUnits(userBalance, 6)} USDC`);
        expect(userBalance).to.be.gte(AMOUNT_TO_DEPOSIT, "User không đủ USDC để test");
    });

    it("should deposit USDC and mint LP token correctly", async function () {
        // Reset và approve USDC cho MoneyFiRouter
        try {
            await usdc.connect(user).approve(moneyFiRouter.target, 0);
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Đợi 5 giây
            const approveTx = await usdc.connect(user).approve(moneyFiRouter.target, AMOUNT_TO_DEPOSIT);
            await approveTx.wait();
            console.log("Đã approve USDC cho MoneyFiRouter");
        } catch (error) {
            console.error("Lỗi khi approve USDC:", error);
            throw error;
        }

        // Thực hiện deposit
        let tx, receipt;
        try {
            const depositParam = {
                tokenAddress: USDC_ADDRESS,
                amount: AMOUNT_TO_DEPOSIT,
            };
            tx = await moneyFiRouter.connect(user).depositFund(depositParam);
            receipt = await tx.wait();
            console.log("Deposit transaction hash:", tx.hash);
        } catch (error) {
            console.error("Lỗi khi gọi depositFund:", error);
            throw error;
        }
    });
});