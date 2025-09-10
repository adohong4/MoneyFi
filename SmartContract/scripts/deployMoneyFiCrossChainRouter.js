const { ethers, upgrades } = require("hardhat");
const { saveAddress, getAddresses } = require("./contractAddresses");
// npx hardhat run scripts/deployMoneyFiCrossChainRouter.js --network sepolia
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MoneyFiCrossChainRouter with account:", deployer.address);

    const addresses = getAddresses();
    const controllerAddress = addresses.MoneyFiController;
    const fundVaultAddress = addresses.MoneyFiFundVault;
    if (!controllerAddress || !fundVaultAddress)
        throw new Error("MoneyFiController or MoneyFiFundVault not deployed");

    const MoneyFiCrossChainRouter = await ethers.getContractFactory("MoneyFiCrossChainRouter");
    const crossChainRouter = await upgrades.deployProxy(
        MoneyFiCrossChainRouter,
        [deployer.address, controllerAddress, fundVaultAddress],
        { initializer: "initialize" }
    );
    await crossChainRouter.waitForDeployment();
    const crossChainRouterAddress = await crossChainRouter.getAddress();
    console.log("MoneyFiCrossChainRouter deployed to:", crossChainRouterAddress);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(crossChainRouterAddress);
    console.log("MoneyFiCrossChainRouter implementation deployed to:", implementationAddress);

    // Lưu địa chỉ
    saveAddress("MoneyFiCrossChainRouter", crossChainRouterAddress);
    saveAddress("MoneyFiCrossChainRouter_Implementation", implementationAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });