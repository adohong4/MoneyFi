const { ethers } = require("hardhat");
require("dotenv").config();

// npx hardhat run test/SwapToken/swapTokenUsdcArb.js --network sepolia
async function main() {
    const [deployer, user] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    console.log(`User address: ${user.address}`);

    // Địa chỉ contract và token
    const usdcAddress = process.env.USDC_SEPOLIA_ADDRESS;
    const arbAddress = process.env.ARB_SEPOLIA_ADDRESS;
    const strategyAddress = process.env.UNISWAP_V2_USDC_ARB;
    const uniswapRouter = process.env.UNISWAP_V2_ROUTER;
    const uniswapPair = "0x78D0b232670d02f12CD294201cd35b724F1ab0Da";

    if (!usdcAddress || !strategyAddress) {
        throw new Error("Missing required contract addresses in .env");
    }

    // Kết nối contract
    const usdc = await ethers.getContractAt("IERC20", usdcAddress, deployer);
    const arb = await ethers.getContractAt("IERC20", arbAddress, deployer);
    const strategy = await ethers.getContractAt("MoneyFiStrategyUpgradeableUniswapV2", strategyAddress, deployer);
    const pair = await ethers.getContractAt("IUniswapV2Pair", uniswapPair, deployer);
    const uniswapRouterContract = await ethers.getContractAt(
        "contracts/interfaces/externals/uniswap/IUniswapV2Router02.sol:IUniswapV2Router02",
        uniswapRouter,
        deployer
    );

    // Kiểm tra cấu hình strategy
    console.log("\n=== Strategy Config ===");
    console.log("Base token:", await strategy.baseToken());
    console.log("Quote token:", await strategy.quoteToken());
    console.log("Token0:", await strategy.token0());
    console.log("Token1:", await strategy.token1());
    console.log("Uniswap Router:", await strategy.uniswapRouter());
    console.log("Uniswap Factory:", await strategy.uniswapFactory());
    console.log("Uniswap Pair:", await strategy.uniswapPair());
    console.log("Slippage:", (await strategy.slippageWhenSwapAsset()).toString());
    console.log("Minimum swap amount:", ethers.formatUnits(await strategy.minimumSwapAmount(), 6));
    console.log("Emergency stop?", await strategy.emergencyStop());
    console.log("USDC allowance for Uniswap Router:", ethers.formatUnits(
        await usdc.allowance(strategyAddress, uniswapRouter), 6
    ));
    console.log("ARB allowance for Uniswap Router:", ethers.formatUnits(
        await arb.allowance(strategyAddress, uniswapRouter), 18
    ));

    // Set minimumSwapAmount
    console.log("\n=== Setting Minimum Swap Amount ===");
    try {
        const tx = await strategy.connect(deployer).setMinimumSwapAmount(ethers.parseUnits("0.01", 6), { gasLimit: 200000 });
        await tx.wait();
        console.log("Minimum swap amount set to 0.01 USDC, tx:", tx.hash);
        console.log("Minimum swap amount (after):", ethers.formatUnits(await strategy.minimumSwapAmount(), 6));
    } catch (e) {
        console.error("Failed to set minimum swap amount:", e);
        return;
    }

    // Kiểm tra pool reserves
    console.log("\n=== Pool Reserves ===");
    console.log("Pool reserves:", {
        USDC: ethers.formatUnits((await pair.getReserves())[0], 6),
        ARB: ethers.formatUnits((await pair.getReserves())[1], 18),
    });

    // Kiểm tra giá swap USDC → arb
    console.log("\n=== Checking Swap Price ===");
    const amountIn = ethers.parseUnits("1", 6); // 1 USDC
    let amountOutMin = 0n; // Dùng BigInt
    try {
        const amountsOut = await uniswapRouterContract.getAmountsOut(amountIn, [usdcAddress, arbAddress]);
        console.log("amountsOut:", amountsOut.map((a, i) => ethers.formatUnits(a, i === 0 ? 6 : 18)));
        console.log("Expected ARB for 1 USDC:", ethers.formatUnits(amountsOut[1], 18));
        // Tính amountOutMin với 0.5% slippage
        amountOutMin = (amountsOut[1] * 9950n) / 10000n;
        console.log("amountOutMin:", ethers.formatUnits(amountOutMin, 18));
    } catch (e) {
        console.error("Failed to get swap price:", e);
        return;
    }

    // Test swap từ deployer
    console.log("\n=== Testing _swapToken with Deployer's USDC ===");
    const swapAmount = ethers.parseUnits("1", 6); // Swap 1 USDC
    console.log(`Strategy USDC balance before swap: ${ethers.formatUnits(await usdc.balanceOf(strategyAddress), 6)} USDC`);
    console.log(`Strategy ARB balance before swap: ${ethers.formatUnits(await arb.balanceOf(strategyAddress), 18)} ARB`);
    console.log(`Deployer USDC balance: ${ethers.formatUnits(await usdc.balanceOf(deployer.address), 6)} USDC`);

    try {
        // Kiểm tra balance USDC của deployer
        const deployerUsdcBalance = await usdc.balanceOf(deployer.address);
        if (deployerUsdcBalance < swapAmount) {
            throw new Error("Deployer does not have enough USDC to transfer. Get USDC from a faucet.");
        }

        // Chuyển USDC từ deployer vào strategy
        console.log(`Transferring ${ethers.formatUnits(swapAmount, 6)} USDC from deployer to strategy...`);
        await usdc.connect(deployer).approve(strategyAddress, swapAmount, { gasLimit: 100000 });
        await usdc.connect(deployer).transfer(strategyAddress, swapAmount, { gasLimit: 100000 });
        console.log(`Strategy USDC balance after transfer: ${ethers.formatUnits(await usdc.balanceOf(strategyAddress), 6)} USDC`);

        // Approve USDC từ strategy cho Uniswap Router
        console.log("Approving USDC for Uniswap Router...");
        const allowance = await usdc.allowance(strategyAddress, uniswapRouter);
        if (allowance < swapAmount) {
            const tx = await strategy.connect(deployer).approveToken(usdcAddress, uniswapRouter, swapAmount, { gasLimit: 200000 });
            await tx.wait();
            console.log(`Approved ${ethers.formatUnits(swapAmount, 6)} USDC for Uniswap Router`);
        } else {
            console.log("USDC allowance sufficient");
        }

        // Gọi _swapToken
        console.log(`Calling _swapToken with ${ethers.formatUnits(swapAmount, 6)} USDC...`);
        const swapTx = await uniswapRouterContract.connect(deployer).swapExactTokensForTokens(
            swapAmount,
            amountOutMin,
            [usdcAddress, arbAddress],
            strategyAddress,
            Math.floor(Date.now() / 1000) + 60,
            { gasLimit: 500000 }
        );
        await swapTx.wait();
        console.log("Swap successful, tx:", swapTx.hash);

        // Kiểm tra balance sau swap
        console.log(`Strategy USDC balance after swap: ${ethers.formatUnits(await usdc.balanceOf(strategyAddress), 6)} USDC`);
        console.log(`Strategy ARB balance after swap: ${ethers.formatUnits(await arb.balanceOf(strategyAddress), 18)} ARB`);
    } catch (e) {
        console.error("Swap failed:", e);
    }

    // Kiểm tra pool reserves sau swap
    console.log("\n=== Pool Reserves Post-Swap ===");
    console.log("Pool reserves post-swap:", {
        USDC: ethers.formatUnits((await pair.getReserves())[0], 6),
        ARB: ethers.formatUnits((await pair.getReserves())[1], 18),
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });  
