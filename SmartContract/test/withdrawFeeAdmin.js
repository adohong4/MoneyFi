// npx hardhat run test/withdrawFeeAdmin.js --network sepolia
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    // Lấy tài khoản
    const [admin] = await ethers.getSigners();
    console.log(`Admin address: ${admin.address}`);

    // Địa chỉ hợp đồng từ .env
    const fundVaultAddress = process.env.MONEYFI_FUND_VAULT || "0xecec15AfAE07feE618D60406a3705945c35C34Cc";
    const usdcAddress = process.env.USDC_SEPOLIA_ADDRESS || "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

    // Kiểm tra biến môi trường
    if (!fundVaultAddress || !usdcAddress) {
        throw new Error("Missing required contract addresses in .env");
    }

    // Kết nối hợp đồng
    const fundVault = await ethers.getContractAt("MoneyFiFundVault", fundVaultAddress, admin);
    const usdc = await ethers.getContractAt("IERC20", usdcAddress, admin);

    // Giả định USDC có 6 decimals
    const USDC_DECIMALS = 6;
    const USDC_SYMBOL = "USDC";

    // Kiểm tra trạng thái hợp đồng FundVault
    const isVaultPaused = await fundVault.paused();
    console.log(`MoneyFiFundVault paused? ${isVaultPaused}`);
    if (isVaultPaused) {
        console.log("Unpausing FundVault...");
        try {
            await fundVault.unpause({ gasLimit: 100000 });
            console.log("Unpaused MoneyFiFundVault");
            await new Promise((resolve) => setTimeout(resolve, 5000));
        } catch (error) {
            console.error("Failed to unpause FundVault:", error.message);
            throw error;
        }
    }

    // Kiểm tra địa chỉ feeTo
    const feeTo = await fundVault.feeTo();
    console.log(`Fee will be transferred to: ${feeTo}`);
    if (feeTo === ethers.ZeroAddress) {
        throw new Error("FeeTo address is not set in MoneyFiFundVault");
    }

    // Hàm kiểm tra và rút phí
    async function withdrawFee(feeType, withdrawFunction) {
        console.log(`\n=== Withdrawing ${feeType} for USDC ===`);

        // Kiểm tra số dư phí
        let feeAmount;
        if (feeType === "Protocol Fee") {
            feeAmount = await fundVault.totalProtocolFee(usdcAddress);
        } else if (feeType === "Distribute Fee") {
            feeAmount = await fundVault.distributeFee(usdcAddress);
        } else if (feeType === "Rebalance Fee") {
            feeAmount = await fundVault.rebalanceFee(usdcAddress);
        } else if (feeType === "Referral Fee") {
            feeAmount = await fundVault.referralFee(usdcAddress);
        } else if (feeType === "Withdraw Fee") {
            feeAmount = await fundVault.withdrawFee(usdcAddress);
        }

        console.log(`${feeType}: ${ethers.formatUnits(feeAmount, USDC_DECIMALS)} ${USDC_SYMBOL}`);

        if (feeAmount > 0) {
            // Kiểm tra số dư USDC của FundVault
            const vaultBalance = await usdc.balanceOf(fundVaultAddress);
            console.log(`FundVault USDC balance: ${ethers.formatUnits(vaultBalance, USDC_DECIMALS)} ${USDC_SYMBOL}`);
            if (vaultBalance < feeAmount) {
                console.warn(`Insufficient USDC balance in FundVault to withdraw ${feeType}`);
                return;
            }

            // Kiểm tra allowance
            const allowance = await usdc.allowance(fundVaultAddress, feeTo);
            if (allowance < feeAmount) {
                console.log(`Approving USDC for feeTo...`);
                try {
                    await usdc.connect(admin).approve(feeTo, feeAmount, { gasLimit: 100000 });
                    console.log(`Approved ${ethers.formatUnits(feeAmount, USDC_DECIMALS)} USDC for feeTo`);
                } catch (error) {
                    console.error(`Failed to approve USDC for feeTo:`, error.message);
                    throw error;
                }
            }

            // Rút phí
            try {
                console.log(`Withdrawing ${feeType}...`);
                const tx = await withdrawFunction([usdcAddress], { gasLimit: 500000 });
                console.log(`Transaction sent: ${tx.hash}`);
                await tx.wait();
                console.log(`${feeType} withdrawn successfully, tx: ${tx.hash}`);

                // Kiểm tra số dư sau khi rút
                const feeToBalanceAfter = await usdc.balanceOf(feeTo);
                console.log(`FeeTo USDC balance after withdraw: ${ethers.formatUnits(feeToBalanceAfter, USDC_DECIMALS)} ${USDC_SYMBOL}`);
            } catch (error) {
                console.error(`Failed to withdraw ${feeType}:`, error.message);
                if (error.reason) console.error("Reason:", error.reason);
                if (error.data) console.error("Data:", error.data);
                throw error;
            }
        } else {
            console.log(`No ${feeType} available for ${USDC_SYMBOL}`);
        }
    }

    // Rút từng loại phí
    await withdrawFee("Protocol Fee", fundVault.withdrawProtocolFee);
    await withdrawFee("Distribute Fee", fundVault.withdrawDistributeFee);
    await withdrawFee("Rebalance Fee", fundVault.withdrawRebalanceFee);
    await withdrawFee("Referral Fee", fundVault.withdrawReferralFee);
    await withdrawFee("Withdraw Fee", fundVault.withdrawWithdrawalFee);

    console.log("\n=== USDC Fee Withdrawal Completed ===");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });