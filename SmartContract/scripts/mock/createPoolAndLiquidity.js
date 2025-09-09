const { ethers } = require("hardhat");
require("dotenv").config();

const NONFUNGIBLE_POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"; // Uniswap V3 Sepolia
const FEE = 3000; // 0.3%

// Hàm tính sqrtPriceX96
function encodePriceSqrt(reserve1, reserve0) {
    const bn = require("bignumber.js");
    return BigInt(
        new bn(reserve1.toString())
            .div(reserve0.toString())
            .sqrt()
            .multipliedBy(new bn(2).pow(96))
            .integerValue(3)
            .toFixed()
    );
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const USDC_ADDRESS = process.env.USDC_MOCK_ADDRESS;
    const WETH_ADDRESS = process.env.WETH_MOCK_ADDRESS;

    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS, deployer);
    const weth = await ethers.getContractAt("IERC20", WETH_ADDRESS, deployer);

    const positionManager = await ethers.getContractAt(
        "INonfungiblePositionManager",
        NONFUNGIBLE_POSITION_MANAGER,
        deployer
    );

    // Approve
    await (await usdc.approve(NONFUNGIBLE_POSITION_MANAGER, ethers.MaxUint256)).wait();
    await (await weth.approve(NONFUNGIBLE_POSITION_MANAGER, ethers.MaxUint256)).wait();
    console.log("✅ Approved tokens for PositionManager");

    // Giá 1 WETH = 1000 USDC
    const sqrtPriceX96 = encodePriceSqrt(
        1000n * 10n ** 6n, // USDC (decimals=6)
        1n * 10n ** 18n   // WETH (decimals=18)
    );
    console.log("SqrtPriceX96:", sqrtPriceX96.toString());

    // Tạo pool
    const txPool = await positionManager.createAndInitializePoolIfNecessary(
        USDC_ADDRESS,
        WETH_ADDRESS,
        FEE,
        sqrtPriceX96
    );
    const pool = await txPool.wait();
    console.log("Pool init tx:", pool.hash);
    console.log("✅ Pool created & initialized");

    // Add liquidity
    const params = {
        token0: USDC_ADDRESS < WETH_ADDRESS ? USDC_ADDRESS : WETH_ADDRESS,
        token1: USDC_ADDRESS < WETH_ADDRESS ? WETH_ADDRESS : USDC_ADDRESS,
        fee: FEE,
        tickLower: -887220,
        tickUpper: 887220,
        amount0Desired: ethers.parseUnits("10000", 6),
        amount1Desired: ethers.parseUnits("10", 18),
        amount0Min: 0,
        amount1Min: 0,
        recipient: deployer.address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10,
    };

    const txMint = await positionManager.mint(params);
    const receipt = await txMint.wait();
    console.log("✅ Liquidity added, tx:", receipt.hash);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

// $  npx hardhat run scripts/mock/createPoolAndLiquidity.js --network sepolia
