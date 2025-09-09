const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // Mock USDC (6 decimals)
    const USDCMock = await ethers.getContractFactory("ERC20Mock");
    const usdc = await USDCMock.deploy("Mock USDC", "mUSDC", 6);
    await usdc.waitForDeployment();
    console.log("Mock USDC deployed at:", await usdc.getAddress());

    // Mock WETH (18 decimals)
    const WETHMock = await ethers.getContractFactory("ERC20Mock");
    const weth = await WETHMock.deploy("Mock WETH", "mWETH", 18);
    await weth.waitForDeployment();
    console.log("Mock WETH deployed at:", await weth.getAddress());

    // Mint cho deployer
    await usdc.mint(deployer.address, ethers.parseUnits("100000", 6));
    await weth.mint(deployer.address, ethers.parseUnits("100000", 18));

    console.log("✅ Minted mock tokens for deployer");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
