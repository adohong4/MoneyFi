const { ethers } = require("hardhat");
require("dotenv").config();

// npx hardhat test test/excute/UniSwap.js --network sepolia
// USDC + WETH Sepolia
const USDC_ADDRESS = process.env.USDC_SEPOLIA_ADDRESS; // USDC (6 decimals)
const WETH_ADDRESS = process.env.WETH_SEPOLIA_ADDRESS; // WETH (18 decimals)
const MONEYFI_UNISWAP_ADDRESS = "0x1a185652bC1F56CB460873C36F7Ae0912E56Fbd0";

async function main() {
    const [deployer, user] = await ethers.getSigners();

    console.log("Deployer:", deployer.address);
    console.log("User:", user.address);

    const uniSwapAddress = MONEYFI_UNISWAP_ADDRESS;
    console.log("MoneyFiUniSwap address:", uniSwapAddress);

    const uniSwap = await ethers.getContractAt("MoneyFiUniSwap", uniSwapAddress, user);
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS, user);
    const weth = await ethers.getContractAt("IERC20", WETH_ADDRESS, user);

    // --- Balance trước swap ---
    const usdcBefore = await usdc.balanceOf(user.address);
    const wethBefore = await weth.balanceOf(user.address);

    console.log("USDC balance before:", ethers.formatUnits(usdcBefore, 6));
    console.log("WETH balance before:", ethers.formatEther(wethBefore));

    // --- Approve USDC cho contract ---
    const amountIn = ethers.parseUnits("1", 6); // swap 1 USDC
    const approveTx = await usdc.approve(uniSwapAddress, amountIn);
    await approveTx.wait();
    console.log("✅ Approved 1 USDC for MoneyFiUniSwap");

    // --- Swap ---
    const tx = await uniSwap.swapToken(
        USDC_ADDRESS,
        WETH_ADDRESS,
        amountIn,
        0, // amountOutMin = 0 (test, nên dùng slippage trong thực tế)
        user.address,
        true, // dùng V3
        "0x"
    );

    console.log("⏳ Swapping...");
    const receipt = await tx.wait();
    console.log("✅ Swap tx hash:", receipt.hash);

    // --- Balance sau swap ---
    const usdcAfter = await usdc.balanceOf(user.address);
    const wethAfter = await weth.balanceOf(user.address);

    console.log("USDC balance after:", ethers.formatUnits(usdcAfter, 6));
    console.log("WETH balance after:", ethers.formatEther(wethAfter));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
