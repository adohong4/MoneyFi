const { ethers, upgrades } = require("hardhat");
const { getAddresses, saveAddress } = require("./contractAddresses");

// npx hardhat run scripts/upgradeRouter.js --network sepolia

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Upgrading MoneyFiRouter with account:", deployer.address);

    // Lấy địa chỉ proxy từ file contractAddresses
    const addresses = getAddresses();
    const routerAddress = addresses.MoneyFiRouter;
    if (!routerAddress) {
        throw new Error("MoneyFiRouter address not found in contractAddresses");
    }
    console.log("Upgrading MoneyFiRouter at:", routerAddress);

    // Lấy factory của hợp đồng MoneyFiRouter
    const MoneyFiRouter = await ethers.getContractFactory("MoneyFiRouter");

    // Nâng cấp hợp đồng tại địa chỉ proxy
    console.log(`Upgrading MoneyFiRouter at ${routerAddress}...`);
    const upgradedRouter = await upgrades.upgradeProxy(routerAddress, MoneyFiRouter, {
        kind: "uups",
    });
    await upgradedRouter.waitForDeployment();

    console.log(`MoneyFiRouter upgraded successfully at ${routerAddress}`);
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(routerAddress);
    console.log(`New implementation address: ${implementationAddress}`);

    // Lưu địa chỉ implementation mới
    saveAddress("MoneyFiRouter_Implementation", implementationAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });