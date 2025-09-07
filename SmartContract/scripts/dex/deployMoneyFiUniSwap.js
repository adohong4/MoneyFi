const { ethers } = require("hardhat");
const { saveAddress } = require("../contractAddresses");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MoneyFiUniSwap with account:", deployer.address);

    const uniswapV3Router = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; // Uniswap V3 Router trên Sepolia
    const uniswapV2Router = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router trên Sepolia
    const uniswapV3Factory = "0x1F98431c8aD98523631AE4a59f267346ea31F984"; // Uniswap V3 Factory trên Sepolia
    const uniswapV2Factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; // Uniswap V2 Factory trên Sepolia

    const MoneyFiUniSwap = await ethers.getContractFactory("MoneyFiUniSwap");
    const uniSwap = await MoneyFiUniSwap.deploy(
        uniswapV3Router,
        uniswapV2Router,
        uniswapV3Factory,
        uniswapV2Factory,
        deployer.address
    );
    await uniSwap.waitForDeployment();
    const uniSwapAddress = await uniSwap.getAddress();
    console.log("MoneyFiUniSwap deployed to:", uniSwapAddress);

    saveAddress("MoneyFiUniSwap", uniSwapAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });