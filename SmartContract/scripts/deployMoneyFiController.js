const { ethers, upgrades } = require("hardhat");
const { saveAddress } = require("./contractAddresses");

// npx hardhat run scripts/deployMoneyFiController.js --network sepolia

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MoneyFiController with account:", deployer.address);

    const MoneyFiController = await ethers.getContractFactory("MoneyFiController");
    const protocolFee = ethers.parseUnits("100", 0); // 1% (100/10000)
    const controller = await upgrades.deployProxy(
        MoneyFiController,
        [deployer.address, protocolFee],
        { initializer: "initialize" }
    );
    await controller.waitForDeployment();
    const controllerAddress = await controller.getAddress();
    console.log("MoneyFiController deployed to:", controllerAddress);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(controllerAddress);
    console.log("MoneyFiRouter implementation deployed to:", implementationAddress);

    // Lưu địa chỉ
    saveAddress("MoneyFiController", controllerAddress);
    saveAddress("MoneyFiController_Implementation", implementationAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });