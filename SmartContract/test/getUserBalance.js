const { ethers } = require("hardhat");
const { getAddresses } = require("../scripts/contractAddresses");
require("dotenv").config();

// npx hardhat run test/getUserBalance.js --network sepolia

async function main() {
    const [deployer, user] = await ethers.getSigners();
    console.log(`Fetching balance for user: ${user.address}`);

    // Đọc địa chỉ từ .env và contractAddresses
    const addresses = getAddresses();
    const usdcAddress = process.env.USDC_SEPOLIA_ADDRESS;
    const wethAddress = process.env.WETH_SEPOLIA_ADDRESS;
    const linkAddress = process.env.LINK_SEPOLIA_ADDRESS;
    const arbAddress = process.env.ARB_SEPOLIA_ADDRESS; // Thêm cho ARB
    const fundVaultAddress = addresses.MoneyFiFundVault;
    const usdcWethStrategyAddress = "0xf85684015cBe22B669bFb6efE278c8F72c048969"; // UNISWAP_V2_USDC_WETH
    const usdcLinkStrategyAddress = "0x3187d2b296fe836519d35081460d5655716d33f9"; // UNISWAP_V2_USDC_LINK
    const usdcArbStrategyAddress = "0xf19Bd3FdB85169223Bbd085cC91043Bf676633Cf"; // Thay bằng địa chỉ thực tế của UNISWAP_V2_USDC_ARB strategy
    const uniswapRouterAddress = process.env.UNISWAP_V2_ROUTER;

    // Kiểm tra địa chỉ
    if (!usdcAddress) throw new Error("USDC_SEPOLIA_ADDRESS is not defined in .env");
    if (!wethAddress) throw new Error("WETH_SEPOLIA_ADDRESS is not defined in .env");
    if (!linkAddress) throw new Error("LINK_SEPOLIA_ADDRESS is not defined in .env");
    if (!arbAddress) throw new Error("ARB_SEPOLIA_ADDRESS is not defined in .env"); // Thêm kiểm tra
    if (!fundVaultAddress) throw new Error("MoneyFiFundVault is not defined in contractAddresses");
    if (!usdcWethStrategyAddress) throw new Error("UNISWAP_V2_USDC_WETH is not defined");
    if (!usdcLinkStrategyAddress) throw new Error("UNISWAP_V2_USDC_LINK is not defined");
    if (!usdcArbStrategyAddress) throw new Error("UNISWAP_V2_USDC_ARB is not defined"); // Thêm kiểm tra
    if (!uniswapRouterAddress) throw new Error("UNISWAP_V2_ROUTER is not defined in .env");

    // Kết nối hợp đồng
    const usdc = await ethers.getContractAt("IERC20", usdcAddress, user);
    const fundVault = await ethers.getContractAt("MoneyFiFundVault", fundVaultAddress, user);
    const usdcWethStrategy = await ethers.getContractAt("MoneyFiStrategyUpgradeableUniswap", usdcWethStrategyAddress, user);
    const usdcLinkStrategy = await ethers.getContractAt("MoneyFiStrategyUpgradeableUniswap", usdcLinkStrategyAddress, user);
    const usdcArbStrategy = await ethers.getContractAt("MoneyFiStrategyUpgradeableUniswap", usdcArbStrategyAddress, user); // Thêm kết nối
    const uniswapRouter = await ethers.getContractAt(
        "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol:IUniswapV2Router02",
        uniswapRouterAddress,
        user
    );

    // Lấy số dư trong MoneyFiFundVault
    const userDepositInfo = await fundVault.getUserDepositInfor(usdcAddress, user.address);
    const originalDeposit = ethers.formatUnits(userDepositInfo.originalDepositAmount, 6);
    const currentDeposit = ethers.formatUnits(userDepositInfo.currentDepositAmount, 6);
    console.log(`\n=== MoneyFiFundVault Balance ===`);
    console.log(`Original Deposit (USDC): ${originalDeposit}`);
    console.log(`Current Deposit (USDC): ${currentDeposit}`);

    // Lấy số dư trong pool USDC/WETH
    const usdcWethShares = await usdcWethStrategy.balanceOf(user.address);
    const usdcWethAssets = await usdcWethStrategy.convertToAssets(usdcWethShares);
    const usdcWethPair = await ethers.getContractAt("IUniswapV2Pair", await usdcWethStrategy.uniswapPair());
    const [reserve0Weth, reserve1Weth] = await usdcWethPair.getReserves();
    const token0Weth = await usdcWethPair.token0();
    const baseReserveWeth = token0Weth === usdcAddress ? reserve0Weth : reserve1Weth;
    const quoteReserveWeth = token0Weth === usdcAddress ? reserve1Weth : reserve0Weth;
    const totalLpSupplyWeth = await usdcWethPair.totalSupply();
    const userLpBalanceWeth = await usdcWethPair.balanceOf(usdcWethStrategyAddress);
    const lpBaseValueWeth = userLpBalanceWeth * baseReserveWeth / totalLpSupplyWeth;
    const lpQuoteValueWeth = userLpBalanceWeth * quoteReserveWeth / totalLpSupplyWeth;
    const quoteToBaseWeth = lpQuoteValueWeth > 0 ? (await uniswapRouter.getAmountsOut(lpQuoteValueWeth, [wethAddress, usdcAddress]))[1] : 0n;
    const totalPoolValueWeth = lpBaseValueWeth + quoteToBaseWeth;

    console.log(`\n=== USDC/WETH Pool Balance ===`);
    console.log(`User Shares: ${ethers.formatUnits(usdcWethShares, 18)} shares`);
    console.log(`Assets from Shares (USDC): ${ethers.formatUnits(usdcWethAssets, 6)}`);
    console.log(`Pool Reserves: ${ethers.formatUnits(baseReserveWeth, 6)} USDC, ${ethers.formatUnits(quoteReserveWeth, 18)} WETH`);
    console.log(`Strategy LP Balance: ${ethers.formatUnits(userLpBalanceWeth, 18)} LP tokens`);
    console.log(`Pool Value in USDC: ${ethers.formatUnits(totalPoolValueWeth, 6)}`);

    // Lấy số dư trong pool USDC/LINK
    const usdcLinkShares = await usdcLinkStrategy.balanceOf(user.address);
    const usdcLinkAssets = await usdcLinkStrategy.convertToAssets(usdcLinkShares);
    const usdcLinkPair = await ethers.getContractAt("IUniswapV2Pair", await usdcLinkStrategy.uniswapPair());
    const [reserve0Link, reserve1Link] = await usdcLinkPair.getReserves();
    const token0Link = await usdcLinkPair.token0();
    const baseReserveLink = token0Link === usdcAddress ? reserve0Link : reserve1Link;
    const quoteReserveLink = token0Link === usdcAddress ? reserve1Link : reserve0Link;
    const totalLpSupplyLink = await usdcLinkPair.totalSupply();
    const userLpBalanceLink = await usdcLinkPair.balanceOf(usdcLinkStrategyAddress);
    const lpBaseValueLink = userLpBalanceLink * baseReserveLink / totalLpSupplyLink;
    const lpQuoteValueLink = userLpBalanceLink * quoteReserveLink / totalLpSupplyLink;
    const quoteToBaseLink = lpQuoteValueLink > 0 ? (await uniswapRouter.getAmountsOut(lpQuoteValueLink, [linkAddress, usdcAddress]))[1] : 0n;
    const totalPoolValueLink = lpBaseValueLink + quoteToBaseLink;

    console.log(`\n=== USDC/LINK Pool Balance ===`);
    console.log(`User Shares: ${ethers.formatUnits(usdcLinkShares, 18)} shares`);
    console.log(`Assets from Shares (USDC): ${ethers.formatUnits(usdcLinkAssets, 6)}`);
    console.log(`Pool Reserves: ${ethers.formatUnits(baseReserveLink, 6)} USDC, ${ethers.formatUnits(quoteReserveLink, 18)} LINK`);
    console.log(`Strategy LP Balance: ${ethers.formatUnits(userLpBalanceLink, 18)} LP tokens`);
    console.log(`Pool Value in USDC: ${ethers.formatUnits(totalPoolValueLink, 6)}`);

    // Lấy số dư trong pool USDC/ARB (thêm mới)
    const usdcArbShares = await usdcArbStrategy.balanceOf(user.address);
    const usdcArbAssets = await usdcArbStrategy.convertToAssets(usdcArbShares);
    const usdcArbPair = await ethers.getContractAt("IUniswapV2Pair", await usdcArbStrategy.uniswapPair());
    const [reserve0Arb, reserve1Arb] = await usdcArbPair.getReserves();
    const token0Arb = await usdcArbPair.token0();
    const baseReserveArb = token0Arb === usdcAddress ? reserve0Arb : reserve1Arb;
    const quoteReserveArb = token0Arb === usdcAddress ? reserve1Arb : reserve0Arb;
    const totalLpSupplyArb = await usdcArbPair.totalSupply();
    const userLpBalanceArb = await usdcArbPair.balanceOf(usdcArbStrategyAddress);
    const lpBaseValueArb = userLpBalanceArb * baseReserveArb / totalLpSupplyArb;
    const lpQuoteValueArb = userLpBalanceArb * quoteReserveArb / totalLpSupplyArb;
    const quoteToBaseArb = lpQuoteValueArb > 0 ? (await uniswapRouter.getAmountsOut(lpQuoteValueArb, [arbAddress, usdcAddress]))[1] : 0n;
    const totalPoolValueArb = lpBaseValueArb + quoteToBaseArb;

    console.log(`\n=== USDC/ARB Pool Balance ===`);
    console.log(`User Shares: ${ethers.formatUnits(usdcArbShares, 18)} shares`);
    console.log(`Assets from Shares (USDC): ${ethers.formatUnits(usdcArbAssets, 6)}`);
    console.log(`Pool Reserves: ${ethers.formatUnits(baseReserveArb, 6)} USDC, ${ethers.formatUnits(quoteReserveArb, 18)} ARB`);
    console.log(`Strategy LP Balance: ${ethers.formatUnits(userLpBalanceArb, 18)} LP tokens`);
    console.log(`Pool Value in USDC: ${ethers.formatUnits(totalPoolValueArb, 6)}`);

    // Tổng hợp số dư (cập nhật để cộng thêm USDC/ARB)
    const totalBalance = BigInt(userDepositInfo.currentDepositAmount) + BigInt(usdcWethAssets) + BigInt(usdcLinkAssets) + BigInt(usdcArbAssets);
    console.log(`\n=== Total Balance ===`);
    console.log(`Total Balance in USDC: ${ethers.formatUnits(totalBalance, 6)}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });