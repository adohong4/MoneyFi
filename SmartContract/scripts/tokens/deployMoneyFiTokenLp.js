const { ethers, upgrades } = require("hardhat");
const { saveAddress, getAddresses } = require("../contractAddresses");
// npx hardhat run scripts/tokens/deployMoneyFiTokenLp.js --network sepolia
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MoneyFiTokenLp with account:", deployer.address);

    const addresses = getAddresses();
    const fundVaultAddress = addresses.MoneyFiFundVault;
    console.log("fundVaultAddress:", fundVaultAddress);
    if (!fundVaultAddress) throw new Error("MoneyFiFundVault not deployed");

    const MoneyFiTokenLp = await ethers.getContractFactory("MoneyFiTokenLp");
    const tokenLp = await upgrades.deployProxy(
        MoneyFiTokenLp,
        [fundVaultAddress, deployer.address, "MoneyUSDC", "mUSDC", 6],
        { initializer: "initialize" }
    );
    await tokenLp.waitForDeployment();
    const tokenLpAddress = await tokenLp.getAddress();
    console.log("MoneyFiTokenLp deployed to:", tokenLpAddress);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(tokenLpAddress);
    console.log("MoneyFiTokenLp implementation deployed to:", implementationAddress);

    // Lưu địa chỉ
    saveAddress("MoneyFiTokenLp", tokenLpAddress);
    saveAddress("MoneyFiTokenLp_Implementation", implementationAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });