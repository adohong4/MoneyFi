const { ethers } = require("hardhat");
const { expect } = require("chai");


// npx hardhat test test/excute/MoneyFiSystemDeposit.test.js --network sepolia

describe("MoneyFi Deposit Test", function () {
    this.timeout(100000); // Tăng timeout lên 100 giây

    let deployer, user;
    let moneyFiRouter, moneyFiFundVault, moneyFiTokenLp, moneyFiController, usdc;
    const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Địa chỉ USDC trên Sepolia
    const TOKEN_LP_ADDRESS = "0x7d66cE2d182f58e5477043a0B805ED3D52af5f7a"; // Thay bằng địa chỉ MoneyFiTokenLp mới
    const AMOUNT_TO_DEPOSIT = ethers.parseUnits("1", 6); // 1 USDC (6 decimals)

    before(async function () {
        // Lấy tài khoản
        [deployer, user] = await ethers.getSigners();
        console.log("Deployer address:", deployer.address);
        console.log("User address:", user.address);

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
            "0xc9fb98df97385d00E59c69eb54C8B9716711B84b",
            deployer
        );
        usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS, deployer);

        // Kiểm tra quyền DELEGATE_ADMIN_ROLE
        // const DELEGATE_ADMIN_ROLE = await moneyFiController.isDelegateAdmin();
        // const hasRole = await moneyFiController.hasRole(DELEGATE_ADMIN_ROLE, deployer.address);
        // console.log(`Deployer có DELEGATE_ADMIN_ROLE không? ${hasRole}`);
        // if (!hasRole) {
        //     console.log("Cấp quyền DELEGATE_ADMIN_ROLE cho deployer...");
        //     await moneyFiController.connect(deployer).grantRole(DELEGATE_ADMIN_ROLE, deployer.address);
        //     await new Promise((resolve) => setTimeout(resolve, 5000)); // Đợi 5 giây
        //     console.log("Đã cấp quyền thành công!");
        // }

        // Kiểm tra số dư USDC của user
        const userBalance = await usdc.balanceOf(user.address);
        console.log(`Số dư USDC của user: ${ethers.formatUnits(userBalance, 6)} USDC`);
        expect(userBalance).to.be.gte(AMOUNT_TO_DEPOSIT, "User không đủ USDC để test");

        // Kiểm tra trạng thái pause của contract
        const isRouterPaused = await moneyFiRouter.paused();
        const isVaultPaused = await moneyFiFundVault.paused();
        console.log(`MoneyFiRouter paused? ${isRouterPaused}`);
        console.log(`MoneyFiFundVault paused? ${isVaultPaused}`);
        if (isRouterPaused) {
            await moneyFiRouter.connect(deployer).unpause();
            console.log("Đã unpause MoneyFiRouter!");
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Đợi 5 giây
        }
        if (isVaultPaused) {
            await moneyFiFundVault.connect(deployer).unpause();
            console.log("Đã unpause MoneyFiFundVault!");
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Đợi 5 giây
        }

        // Kiểm tra decimals của MoneyFiTokenLp
        const lpDecimals = await moneyFiTokenLp.decimals();
        console.log(`Decimals của MoneyFiTokenLp: ${lpDecimals}`);
        expect(lpDecimals).to.equal(6, "Decimals của MoneyFiTokenLp phải là 6");

        // Kiểm tra cấu hình token USDC trong MoneyFiController
        const tokenInfo = await moneyFiController.getSupportedTokenInternalInfor(USDC_ADDRESS);
        console.log("Token info:", tokenInfo);
        expect(tokenInfo.isActive).to.be.true;
        expect(tokenInfo.lpTokenAddress).to.equal(TOKEN_LP_ADDRESS);
    });

    it("should deposit USDC and mint LP token correctly", async function () {
        // Cấu hình token USDC trong MoneyFiController
        try {
            await moneyFiController
                .connect(deployer)
                .setTokenInfoInternal(USDC_ADDRESS, {
                    minDepositAmount: ethers.parseUnits("0.1", 6),
                    decimals: 6,
                    chainId: 11155111,
                    isActive: true,
                    lpTokenAddress: TOKEN_LP_ADDRESS,
                });
            console.log("Cấu hình USDC thành công!");
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Đợi 5 giây
        } catch (error) {
            console.error("Lỗi khi gọi setTokenInfoInternal:", error);
            throw error;
        }

        // Kiểm tra tokenInfo trong MoneyFiController
        const tokenInfo = await moneyFiController.getSupportedTokenInternalInfor(USDC_ADDRESS);
        console.log("Token info:", tokenInfo);
        expect(tokenInfo.isActive).to.be.true;
        expect(tokenInfo.lpTokenAddress).to.equal(TOKEN_LP_ADDRESS);

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

        // Kiểm tra allowance
        const allowanceAfter = await usdc.allowance(user.address, moneyFiRouter.target);
        console.log(`Allowance sau khi approve: ${ethers.formatUnits(allowanceAfter, 6)} USDC`);
        expect(allowanceAfter).to.be.gte(AMOUNT_TO_DEPOSIT, "Allowance không đủ sau khi approve");

        // Kiểm tra số dư LP token trước khi deposit
        const lpBalanceBefore = await moneyFiTokenLp.balanceOf(user.address);
        console.log(`Số dư LP token trước: ${ethers.formatUnits(lpBalanceBefore, 6)} mUSDC`);

        // Kiểm tra số dư USDC của user trước khi deposit
        const userUsdcBalanceBefore = await usdc.balanceOf(user.address);
        console.log(`Số dư USDC của user trước: ${ethers.formatUnits(userUsdcBalanceBefore, 6)} USDC`);

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

        // Parse sự kiện DepositFundVault bằng ABI chính xác
        const fundVaultInterface = new ethers.Interface([
            "event DepositFundVault(address indexed tokenAddress, address indexed receiver, uint256 depositAmount, uint256 actualDepositAmount, uint256 depositedAt)",
        ]);
        const depositVaultEvent = receipt.logs.find((log) => {
            try {
                const parsedLog = fundVaultInterface.parseLog({
                    topics: log.topics,
                    data: log.data,
                });
                return parsedLog?.name === "DepositFundVault";
            } catch {
                return false;
            }
        });
        expect(depositVaultEvent).to.not.be.undefined, "Sự kiện DepositFundVault không được emit";
        console.log("Sự kiện DepositFundVault:", depositVaultEvent);

        // Kiểm tra số dư USDC của FundVault
        const fundVaultUsdcBalance = await usdc.balanceOf(moneyFiFundVault.target);
        expect(fundVaultUsdcBalance).to.equal(AMOUNT_TO_DEPOSIT);
        console.log(`Số dư USDC của FundVault: ${ethers.formatUnits(fundVaultUsdcBalance, 6)} USDC`);

        // Kiểm tra số dư LP token của user
        const lpBalanceAfter = await moneyFiTokenLp.balanceOf(user.address);
        expect(lpBalanceAfter).to.equal(lpBalanceBefore + AMOUNT_TO_DEPOSIT);
        console.log(`Số dư LP token sau: ${ethers.formatUnits(lpBalanceAfter, 6)} mUSDC`);

        // Kiểm tra số dư USDC của user sau khi deposit
        const userUsdcBalanceAfter = await usdc.balanceOf(user.address);
        console.log(`Số dư USDC của user sau: ${ethers.formatUnits(userUsdcBalanceAfter, 6)} USDC`);
        expect(userUsdcBalanceAfter).to.equal(userUsdcBalanceBefore - AMOUNT_TO_DEPOSIT);

        // Kiểm tra thông tin deposit trong FundVault
        const userDepositInfo = await moneyFiFundVault.getUserDepositInfor(USDC_ADDRESS, user.address);
        expect(userDepositInfo.originalDepositAmount).to.equal(AMOUNT_TO_DEPOSIT);
        expect(userDepositInfo.currentDepositAmount).to.equal(AMOUNT_TO_DEPOSIT);
        console.log(`Thông tin deposit của user:`, userDepositInfo);
    });
});