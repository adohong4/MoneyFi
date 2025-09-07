const { ethers, upgrades } = require("hardhat");
const { saveAddress, getAddresses } = require("./contractAddresses");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MoneyFiFundVault with account:", deployer.address);

    const addresses = getAddresses();
    const controllerAddress = addresses.MoneyFiController;
    if (!controllerAddress) throw new Error("MoneyFiController not deployed");

    const MoneyFiFundVault = await ethers.getContractFactory("MoneyFiFundVault");
    const fundVault = await upgrades.deployProxy(
        MoneyFiFundVault,
        [deployer.address, controllerAddress, deployer.address],
        { initializer: "initialize" }
    );
    await fundVault.waitForDeployment();
    const fundVaultAddress = await fundVault.getAddress();
    console.log("MoneyFiFundVault deployed to:", fundVaultAddress);

    saveAddress("MoneyFiFundVault", fundVaultAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });