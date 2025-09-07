const { ethers } = require("hardhat");
const { saveAddress } = require("./contractAddresses");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MoneyFiReferral with account:", deployer.address);

    const tokenAddress = "0xF3F2b4815A58152c9BE53250275e8211163268BA"; // USDT trên Sepolia
    const MoneyFiReferral = await ethers.getContractFactory("MoneyFiReferral");
    const referral = await MoneyFiReferral.deploy(deployer.address, deployer.address, deployer.address, tokenAddress);
    await referral.waitForDeployment();
    const referralAddress = await referral.getAddress();
    console.log("MoneyFiReferral deployed to:", referralAddress);

    saveAddress("MoneyFiReferral", referralAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });