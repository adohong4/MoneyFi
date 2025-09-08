const { ethers, upgrades } = require("hardhat");
const { saveAddress, getAddresses } = require("../contractAddresses");
require("dotenv").config();

// npx hardhat run scripts/deployMoneyFiCrossChainRouter.js --network sepolia
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MoneyFiStargateCrossChain with account:", deployer.address);

    const addresses = getAddresses();
    const fundVaultAddress = addresses.MoneyFiFundVault;
    const controllerAddress = addresses.MoneyFiController;
    const lzEndpoint = process.env.LAYERZERO_ENDPOINT; // LayerZero Endpoint trên Sepolia

    if (!fundVaultAddress || !controllerAddress) {
        throw new Error("MoneyFiFundVault or MoneyFiController address is missing");
    }

    const MoneyFiStargateCrossChain = await ethers.getContractFactory("MoneyFiStargateCrossChain");
    const stargateCrossChain = await upgrades.deployProxy(
        MoneyFiStargateCrossChain,
        [deployer.address, fundVaultAddress, controllerAddress, lzEndpoint],
        { initializer: "initialize", kind: "uups" }
    );

    await stargateCrossChain.waitForDeployment();
    const stargateCrossChainAddress = await stargateCrossChain.getAddress();
    console.log("MoneyFiStargateCrossChain proxy deployed to:", stargateCrossChainAddress);

    saveAddress("MoneyFiStargateCrossChain", stargateCrossChainAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });