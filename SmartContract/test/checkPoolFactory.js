const { ethers } = require("hardhat");
require("dotenv").config();

// npx hardhat run test/checkPoolFactory.js --network sepolia
async function checkPool() {
    // Chỉ định rõ artifact bằng fully qualified name
    const factory = await ethers.getContractAt(
        "contracts/interfaces/dex/IUniswapV2Factory.sol:IUniswapV2Factory",
        process.env.UNISWAP_V2_FACTORY
    );
    const pair = await factory.getPair(process.env.USDC_SEPOLIA_ADDRESS, process.env.WETH_SEPOLIA_ADDRESS);
    console.log("USDC/WETH pool from factory:", pair);

    const pairMoi = await factory.getPair(process.env.UNI_SEPOLIA_ADDRESS, process.env.LINK_SEPOLIA_ADDRESS);
    console.log("Uni/Link pool from factory:", pairMoi);

    const pairUsdcArb = await factory.getPair(process.env.USDC_SEPOLIA_ADDRESS, process.env.ARB_SEPOLIA_ADDRESS);
    console.log("USDC/ARB pool from factory:", pairUsdcArb);

    const pairLinkWEth = await factory.getPair(process.env.LINK_SEPOLIA_ADDRESS, process.env.WETH_SEPOLIA_ADDRESS);
    console.log("Link/Weth pool from factory:", pairLinkWEth);
}

checkPool()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });