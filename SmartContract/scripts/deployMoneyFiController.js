const { ethers, upgrades } = require("hardhat");
const { saveAddress } = require("./contractAddresses");

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

    saveAddress("MoneyFiController", controllerAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });