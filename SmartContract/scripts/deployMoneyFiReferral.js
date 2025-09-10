const { ethers, upgrades } = require("hardhat");
const { saveAddress } = require("./contractAddresses");
// npx hardhat run scripts/deployMoneyFiReferral.js --network sepolia
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MoneyFiReferral with account:", deployer.address);

    const tokenAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // USDC trên Sepolia
    const MoneyFiReferral = await ethers.getContractFactory("MoneyFiReferral");
    const referral = await upgrades.deployProxy(
        MoneyFiReferral,
        [deployer.address, deployer.address, deployer.address, tokenAddress],
        { initializer: "initialize" }
    );
    await referral.waitForDeployment();
    const referralAddress = await referral.getAddress();
    console.log("MoneyFiReferral deployed to:", referralAddress);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(referralAddress);
    console.log("MoneyFiReferral implementation deployed to:", implementationAddress);

    // Lưu địa chỉ
    saveAddress("MoneyFiReferral", referralAddress);
    saveAddress("MoneyFiReferral_Implementation", implementationAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });