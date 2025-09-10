const { ethers } = require("hardhat");
const { getAddresses } = require("../contractAddresses");

// npx hardhat run scripts/SetConfig/setConfig_router.js --network sepolia

async function main() {
    const [deployer] = await ethers.getSigners();
    const addresses = getAddresses();

    const moneyFiRouter = await ethers.getContractAt(
        "MoneyFiRouter",
        addresses.MoneyFiRouter,
        deployer
    );

    console.log("Deployer address:", deployer.address);
    console.log("MoneyFiRouter address:", addresses.MoneyFiRouter);
    console.log("\n=== Setting up MoneyFiRouter Configurations ===");

    // 1. Kiểm tra quyền isAdmin và isDelegateAdmin
    const isAdmin = await moneyFiRouter.isAdmin(deployer.address);
    console.log(`Is ${deployer.address} admin? ${isAdmin}`);

    const isDelegateAdmin = await moneyFiRouter.isDelegateAdmin(deployer.address);
    console.log(`Is ${deployer.address} delegate admin? ${isDelegateAdmin}`);

    // 2. Kiểm tra và set Controller và FundVault
    try {
        const currentController = await moneyFiRouter.moneyFiController();
        const currentFundVault = await moneyFiRouter.moneyFiFundVault();

        if (
            currentController.toLowerCase() !== addresses.MoneyFiController.toLowerCase() ||
            currentFundVault.toLowerCase() !== addresses.MoneyFiFundVault.toLowerCase()
        ) {
            const txUpgrade = await moneyFiRouter.connect(deployer).upgradeControllerAndFundVault(
                addresses.MoneyFiController,
                addresses.MoneyFiFundVault
            );
            await txUpgrade.wait();
            console.log("Set Controller address:", addresses.MoneyFiController);
            console.log("Set FundVault address:", addresses.MoneyFiFundVault);
        } else {
            console.log("Controller already set to:", addresses.MoneyFiController);
            console.log("FundVault already set to:", addresses.MoneyFiFundVault);
        }
    } catch (error) {
        console.error("Failed to set Controller and FundVault:", error.message);
    }

    // 3. Kiểm tra và set CoolDownPeriodWithdrawRequest
    // const COOLDOWN_PERIOD = 3600; // 1 giờ (đơn vị giây)
    // try {
    //     const currentCoolDownPeriod = await moneyFiRouter.coolDownPeriodWithdrawRequest();
    //     if (currentCoolDownPeriod.toString() !== COOLDOWN_PERIOD.toString()) {
    //         const txCoolDown = await moneyFiRouter.connect(deployer).setCoolDownPeriodWithdrawRequest(COOLDOWN_PERIOD);
    //         await txCoolDown.wait();
    //         console.log("Set CoolDownPeriodWithdrawRequest to:", COOLDOWN_PERIOD, "seconds");
    //     } else {
    //         console.log("CoolDownPeriodWithdrawRequest already set to:", COOLDOWN_PERIOD, "seconds");
    //     }
    // } catch (error) {
    //     console.error("Failed to set CoolDownPeriodWithdrawRequest:", error.message);
    // }

    // 4. Kiểm tra trạng thái Pause/Unpause và Unpause nếu cần
    try {
        const isPaused = await moneyFiRouter.paused();
        console.log("Contract Paused Status:", isPaused);
        if (isPaused && isDelegateAdmin) {
            console.log("Unpausing contract...");
            const txUnpause = await moneyFiRouter.connect(deployer).unpause();
            await txUnpause.wait();
            console.log("Contract unpaused");
        } else if (!isPaused) {
            console.log("Contract is already unpaused");
        } else {
            console.warn("Cannot unpause contract: Deployer lacks DELEGATE_ADMIN_ROLE");
        }
    } catch (error) {
        console.error("Failed to check or unpause contract:", error.message);
    }

    // 5. Xác minh các thiết lập
    console.log("\n=== Verifying MoneyFiRouter Configurations ===");
    const controllerAddress = await moneyFiRouter.moneyFiController();
    console.log("Controller address:", controllerAddress,
        controllerAddress.toLowerCase() === addresses.MoneyFiController.toLowerCase() ? "(Correct)" : "(Incorrect)");

    const fundVaultAddress = await moneyFiRouter.moneyFiFundVault();
    console.log("FundVault address:", fundVaultAddress,
        fundVaultAddress.toLowerCase() === addresses.MoneyFiFundVault.toLowerCase() ? "(Correct)" : "(Incorrect)");

    // const coolDownPeriod = await moneyFiRouter.coolDownPeriodWithdrawRequest();
    // console.log("CoolDownPeriodWithdrawRequest:", coolDownPeriod.toString(), "seconds",
    //     coolDownPeriod.toString() === COOLDOWN_PERIOD.toString() ? "(Correct)" : "(Incorrect)");

    const pausedStatus = await moneyFiRouter.paused();
    console.log("Paused Status:", pausedStatus, pausedStatus ? "(Paused)" : "(Unpaused)");

    const nextWithdrawRequestTime = await moneyFiRouter.getNextWithdrawRequestTime(deployer.address);
    console.log("Next Withdraw Request Time for Deployer:",
        new Date(nextWithdrawRequestTime.toNumber() * 1000).toLocaleString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Setup failed:", error.message);
        process.exit(1);
    });