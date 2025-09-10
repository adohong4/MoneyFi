const { ethers } = require("hardhat");
const { getAddresses } = require("../contractAddresses");


// npx hardhat run scripts/SetConfig/setConfig_FundVault.js --network sepolia
async function main() {
    const [deployer] = await ethers.getSigners();
    const addresses = getAddresses();

    const moneyFiFundVault = await ethers.getContractAt(
        "MoneyFiFundVault",
        addresses.MoneyFiFundVault,
        deployer
    );

    console.log("Deployer address:", deployer.address);
    console.log("MoneyFiFundVault address:", addresses.MoneyFiFundVault);
    console.log("\n=== Setting up MoneyFiFundVault Configurations ===");

    // 1. Kiểm tra quyền ADMIN_ROLE và DELEGATE_ADMIN_ROLE
    const isAdmin = await moneyFiFundVault.isAdmin(deployer.address);
    console.log(`Is ${deployer.address} admin? ${isAdmin}`);

    const isDelegateAdmin = await moneyFiFundVault.isDelegateAdmin(deployer.address);
    console.log(`Is ${deployer.address} delegate admin? ${isDelegateAdmin}`);

    // 2. Set Controller
    try {
        const currentController = await moneyFiFundVault.controller();
        if (currentController !== addresses.MoneyFiController) {
            const txController = await moneyFiFundVault.connect(deployer).setController(addresses.MoneyFiController);
            await txController.wait();
            console.log("Set Controller address:", addresses.MoneyFiController);
        } else {
            console.log("Controller already set to:", addresses.MoneyFiController);
        }
    } catch (error) {
        console.error("Failed to set Controller:", error.message);
    }

    // 3. Set FeeTo (sử dụng deployer.address làm ví dụ, bạn có thể thay đổi)
    const feeToAddress = deployer.address; // Thay bằng địa chỉ mong muốn nếu cần
    try {
        const currentFeeTo = await moneyFiFundVault.feeTo();
        if (currentFeeTo !== feeToAddress) {
            const txFeeTo = await moneyFiFundVault.connect(deployer).setFeeTo(feeToAddress);
            await txFeeTo.wait();
            console.log("Set FeeTo address:", feeToAddress);
        } else {
            console.log("FeeTo already set to:", feeToAddress);
        }
    } catch (error) {
        console.error("Failed to set FeeTo:", error.message);
    }

    // 5. Xác minh các thiết lập
    console.log("\n=== Verifying MoneyFiFundVault Configurations ===");
    const controllerAddress = await moneyFiFundVault.controller();
    console.log("Controller address:", controllerAddress, controllerAddress === addresses.MoneyFiController ? "(Correct)" : "(Incorrect)");

    const feeTo = await moneyFiFundVault.feeTo();
    console.log("FeeTo address:", feeTo, feeTo === feeToAddress ? "(Correct)" : "(Incorrect)");

    const pausedStatus = await moneyFiFundVault.paused();
    console.log("Paused Status:", pausedStatus, pausedStatus ? "(Paused)" : "(Unpaused)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Setup failed:", error.message);
        process.exit(1);
    });