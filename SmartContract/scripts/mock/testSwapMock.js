const { ethers } = require("hardhat");
require("dotenv").config();

// npx hardhat run scripts/mock/testSwapMock.js --network sepolia
const USDC_ADDRESS = process.env.USDC_MOCK_ADDRESS;
const WETH_ADDRESS = process.env.WETH_MOCK_ADDRESS;
const MONEYFI_UNISWAP_ADDRESS = "0x1a185652bC1F56CB460873C36F7Ae0912E56Fbd0";

async function main() {
    const [user] = await ethers.getSigners();
    console.log("User:", user.address);

    const uniSwap = await ethers.getContractAt("MoneyFiUniSwap", MONEYFI_UNISWAP_ADDRESS, user);
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS, user);
    const weth = await ethers.getContractAt("IERC20", WETH_ADDRESS, user);
    console.log("UniSwap contract at:", MONEYFI_UNISWAP_ADDRESS);
    console.log("USDC contract at:", USDC_ADDRESS);
    console.log("WETH contract at:", WETH_ADDRESS);

    // Balance trước swap
    console.log("USDC before:", ethers.formatUnits(await usdc.balanceOf(user.address), 6));
    console.log("WETH before:", ethers.formatUnits(await weth.balanceOf(user.address), 18));

    // Approve
    const amountIn = ethers.parseUnits("100", 6);
    await (await usdc.approve(MONEYFI_UNISWAP_ADDRESS, amountIn)).wait();

    // Swap
    const tx = await uniSwap.swapToken(
        USDC_ADDRESS,
        WETH_ADDRESS,
        amountIn,
        0,
        user.address,
        true,
        "0x"
    );
    await tx.wait();

    // Balance sau swap
    console.log("USDC after:", ethers.formatUnits(await usdc.balanceOf(user.address), 6));
    console.log("WETH after:", ethers.formatUnits(await weth.balanceOf(user.address), 18));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
