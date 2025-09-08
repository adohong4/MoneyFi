const { ethers } = require("hardhat");
const { getAddresses } = require("./contractAddresses");

async function main() {
    const [deployer] = await ethers.getSigners();
    const addresses = getAddresses();
    const moneyFiController = await ethers.getContractAt(
        "MoneyFiController",
        "0xc9fb98df97385d00E59c69eb54C8B9716711B84b",
        deployer
    );
    const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

    console.log("address Token...", addresses.MoneyFiTokenLp);

    await moneyFiController.connect(deployer).setTokenInfoInternal(
        USDC_ADDRESS,
        {
            minDepositAmount: ethers.parseUnits("0.1", 6),
            decimals: 6,
            chainId: 11155111,
            isActive: true,
            lpTokenAddress: addresses.MoneyFiTokenLp,
        }
    );
    console.log("set Token lpTokenAddress in MoneyFiController");

    // Xác minh
    const tokenInfo = await moneyFiController.getSupportedTokenInternalInfor(USDC_ADDRESS);
    console.log("Token info after update:", tokenInfo);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });