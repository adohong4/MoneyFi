const { ethers, upgrades } = require("hardhat");
const { saveAddress, getAddresses } = require("./contractAddresses");

// npx hardhat run scripts/deployMoneyFiRouter.js --network sepolia

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MoneyFiRouter with account:", deployer.address);

    const addresses = getAddresses();
    const controllerAddress = addresses.MoneyFiController;
    const fundVaultAddress = addresses.MoneyFiFundVault;
    if (!controllerAddress || !fundVaultAddress)
        throw new Error("MoneyFiController or MoneyFiFundVault not deployed");
    console.log("Using MoneyFiController at:", controllerAddress);
    console.log("Using MoneyFiFundVault at:", fundVaultAddress);

    const MoneyFiRouter = await ethers.getContractFactory("MoneyFiRouter");
    const router = await upgrades.deployProxy(
        MoneyFiRouter,
        [deployer.address, controllerAddress, fundVaultAddress],
        { initializer: "initialize" }
    );
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();
    console.log("MoneyFiRouter deployed to:", routerAddress);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(routerAddress);
    console.log("MoneyFiRouter implementation deployed to:", implementationAddress);

    // Lưu địa chỉ
    saveAddress("MoneyFiRouter", routerAddress);
    saveAddress("MoneyFiRouter_Implementation", implementationAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });