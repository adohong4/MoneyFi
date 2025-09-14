const { ethers } = require("hardhat");
require("dotenv").config();

// npx hardhat run test/getUserBalance.js --network sepolia
async function main() {
    // Lấy tài khoản
    const [deployer, user] = await ethers.getSigners();
    console.log(`Địa chỉ Deployer: ${deployer.address}`);
    console.log(`Địa chỉ User: ${user.address}`);

    // Địa chỉ hợp đồng từ .env
    const fundVaultAddress = process.env.MONEYFI_FUND_VAULT;
    const usdcAddress = process.env.USDC_SEPOLIA_ADDRESS;
    const uniAddress = process.env.UNI_SEPOLIA_ADDRESS;
    const linkAddress = process.env.LINK_SEPOLIA_ADDRESS;
    const wethAddress = process.env.WETH_SEPOLIA_ADDRESS;
    const arbAddress = process.env.ARB_SEPOLIA_ADDRESS;
    const uniLinkStrategyAddress = process.env.UNISWAP_V2_UNI_LINK;
    const usdcArbStrategyAddress = process.env.UNISWAP_V2_USDC_ARB;
    const usdcWethStrategyAddress = process.env.MONEYFI_STRATEGY_UPGRADEABLE_UNISWAP_V2;
    const tokenLpAddress = process.env.MONEYFI_TOKEN_LP;
    const uniswapDexAddress = process.env.UNISWAP_DEX_ADDRESS;

    // Kiểm tra biến môi trường
    if (!fundVaultAddress || !usdcAddress || !uniAddress || !linkAddress || !wethAddress || !arbAddress || !uniLinkStrategyAddress || !usdcArbStrategyAddress || !usdcWethStrategyAddress || !tokenLpAddress || !uniswapDexAddress) {
        throw new Error("Thiếu địa chỉ hợp đồng trong file .env");
    }

    // Kết nối hợp đồng
    const fundVault = await ethers.getContractAt("MoneyFiFundVault", fundVaultAddress, deployer);
    const uniLinkStrategy = await ethers.getContractAt("MoneyFiStrategyUpgradeableUniswapV2", uniLinkStrategyAddress, deployer);
    const usdcArbStrategy = await ethers.getContractAt("MoneyFiStrategyUpgradeableUniswapV2", usdcArbStrategyAddress, deployer);
    const usdcWethStrategy = await ethers.getContractAt("MoneyFiStrategyUpgradeableUniswapV2", usdcWethStrategyAddress, deployer);
    const tokenLp = await ethers.getContractAt("MoneyFiTokenLp", tokenLpAddress, deployer);
    const moneyFiUniSwap = await ethers.getContractAt("MoneyFiUniSwap", uniswapDexAddress, deployer);

    // Lấy địa chỉ Uniswap V2 Factory
    const factory = await ethers.getContractAt(
        "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol:IUniswapV2Factory",
        await moneyFiUniSwap.factoryV2(),
        deployer
    );

    // Hàm lấy giá từ Uniswap V2 pool (USDC/Token hoặc Token/USDC)
    async function getPriceFromPool(tokenAddress, poolAddress) {
        if (poolAddress === ethers.ZeroAddress) {
            console.log(`Pool ${tokenAddress}/USDC không tồn tại`);
            return 0;
        }
        const pair = await ethers.getContractAt("IUniswapV2Pair", poolAddress, deployer);
        const [reserve0, reserve1] = await pair.getReserves();
        const token0 = await pair.token0();
        const isUsdcToken0 = token0.toLowerCase() === usdcAddress.toLowerCase();
        const usdcReserve = isUsdcToken0 ? reserve0 : reserve1;
        const tokenReserve = isUsdcToken0 ? reserve1 : reserve0;
        console.log(`Reserve USDC trong pool ${poolAddress}: ${ethers.formatUnits(usdcReserve, 6)} USDC`);
        console.log(`Reserve token (${tokenAddress}) trong pool ${poolAddress}: ${ethers.formatUnits(tokenReserve, 18)}`);
        if (tokenReserve === 0n) {
            console.log("Token reserve bằng 0, giá = 0");
            return 0;
        }
        const price = Number(ethers.formatUnits(usdcReserve, 6)) / Number(ethers.formatUnits(tokenReserve, 18));
        const usdcValue = Number(ethers.formatUnits(usdcReserve, 6));
        if (usdcValue < 10) {
            console.log(`Cảnh báo: Thanh khoản pool ${poolAddress} thấp (${usdcValue} USDC), giá có thể không chính xác`);
        }
        return price;
    }

    // Hàm tính giá trị shares trong pool UNI/LINK
    async function getUniLinkSharesValue(shares, poolAddress, uniPrice, linkPrice) {
        const pair = await ethers.getContractAt("IUniswapV2Pair", poolAddress, deployer);
        const totalSupply = await pair.totalSupply();
        const [reserve0, reserve1] = await pair.getReserves();
        const token0 = await pair.token0();
        const isUniToken0 = token0.toLowerCase() === uniAddress.toLowerCase();
        const uniReserve = isUniToken0 ? reserve0 : reserve1;
        const linkReserve = isUniToken0 ? reserve1 : reserve0;
        console.log(`Dự trữ pool UNI/LINK (${poolAddress}):`);
        console.log(`  UNI: ${ethers.formatUnits(uniReserve, 18)} UNI`);
        console.log(`  LINK: ${ethers.formatUnits(linkReserve, 18)} LINK`);

        // Tính giá trị TVL của pool
        const uniValueInUsdc = Number(ethers.formatUnits(uniReserve, 18)) * uniPrice;
        const linkValueInUsdc = Number(ethers.formatUnits(linkReserve, 18)) * linkPrice;
        const totalValue = uniValueInUsdc + linkValueInUsdc;
        console.log(`Giá trị TVL của pool: ${totalValue.toFixed(6)} USDC`);

        // Tính số UNI và LINK của user dựa trên shares
        const shareRatio = Number(ethers.formatUnits(shares, 18)) / Number(ethers.formatUnits(totalSupply, 18));
        const userUni = Number(ethers.formatUnits(uniReserve, 18)) * shareRatio;
        const userLink = Number(ethers.formatUnits(linkReserve, 18)) * shareRatio;
        console.log(`Shares của user: ${ethers.formatUnits(shares, 18)}`);
        console.log(`Tỷ lệ shares: ${shareRatio}`);
        console.log(`UNI của user: ${userUni.toFixed(18)} UNI`);
        console.log(`LINK của user: ${userLink.toFixed(18)} LINK`);

        // Quy đổi sang USDC
        const userUniValue = userUni * uniPrice;
        const userLinkValue = userLink * linkPrice;
        const totalShareValue = userUniValue + userLinkValue;
        console.log(`Giá trị UNI của user: ${userUniValue.toFixed(6)} USDC`);
        console.log(`Giá trị LINK của user: ${userLinkValue.toFixed(6)} USDC`);
        console.log(`Tổng giá trị shares trong pool UNI/LINK: ${totalShareValue.toFixed(6)} USDC`);
        return totalShareValue;
    }

    // Lấy giá từ các pool
    console.log("\nĐang lấy giá từ Uniswap V2 pool trên Sepolia...");
    const usdcUniPoolAddress = await factory.getPair(usdcAddress, uniAddress);
    const uniPrice = await getPriceFromPool(uniAddress, usdcUniPoolAddress);
    console.log(`Pool USDC/UNI address: ${usdcUniPoolAddress}`);
    console.log(`Giá UNI/USDC từ pool: ${uniPrice.toFixed(6)} USDC`);

    const usdcLinkPoolAddress = await factory.getPair(usdcAddress, linkAddress);
    const linkPrice = await getPriceFromPool(linkAddress, usdcLinkPoolAddress);
    console.log(`Pool USDC/LINK address: ${usdcLinkPoolAddress}`);
    console.log(`Giá LINK/USDC từ pool: ${linkPrice.toFixed(6)} USDC`);

    const usdcArbPoolAddress = await factory.getPair(usdcAddress, arbAddress);
    const arbPrice = await getPriceFromPool(arbAddress, usdcArbPoolAddress);
    console.log(`Pool USDC/ARB address: ${usdcArbPoolAddress}`);
    console.log(`Giá ARB/USDC từ pool: ${arbPrice.toFixed(6)} USDC`);

    const usdcWethPoolAddress = await factory.getPair(usdcAddress, wethAddress);
    const wethPrice = await getPriceFromPool(wethAddress, usdcWethPoolAddress);
    console.log(`Pool USDC/WETH address: ${usdcWethPoolAddress}`);
    console.log(`Giá WETH/USDC từ pool: ${wethPrice.toFixed(6)} USDC`);

    // 1. Balance trong pool UNI/LINK
    console.log("\n=== Balance trong pool UNI/LINK ===");
    const uniLinkShares = await uniLinkStrategy.balanceOf(user.address);
    const uniLinkPoolAddress = await uniLinkStrategy.uniswapPair();
    const uniLinkShareValue = await getUniLinkSharesValue(uniLinkShares, uniLinkPoolAddress, uniPrice, linkPrice);
    console.log(`Giá trị có thể rút (USDC): ${uniLinkShareValue.toFixed(6)} USDC`);

    // 2. Balance trong pool USDC/ARB
    console.log("\n=== Balance trong pool USDC/ARB ===");
    const usdcArbShares = await usdcArbStrategy.balanceOf(user.address);
    console.log(`Shares của user: ${ethers.formatUnits(usdcArbShares, 18)} shares`);
    const usdcArbAssets = await usdcArbStrategy.convertToAssets(usdcArbShares);
    const usdcArbBalance = ethers.formatUnits(usdcArbAssets, 6);
    console.log(`Tài sản USDC tương ứng: ${usdcArbBalance} USDC`);
    const usdcArbValueInUsdc = Number(usdcArbBalance);
    console.log(`Giá trị có thể rút (USDC): ${usdcArbValueInUsdc.toFixed(6)} USDC`);

    // 3. Balance trong pool USDC/WETH
    console.log("\n=== Balance trong pool USDC/WETH ===");
    const usdcWethShares = await usdcWethStrategy.balanceOf(user.address);
    console.log(`Shares của user: ${ethers.formatUnits(usdcWethShares, 18)} shares`);
    const usdcWethAssets = await usdcWethStrategy.convertToAssets(usdcWethShares);
    const usdcWethBalance = ethers.formatUnits(usdcWethAssets, 6);
    console.log(`Tài sản USDC tương ứng: ${usdcWethBalance} USDC`);
    const usdcWethValueInUsdc = Number(usdcWethBalance);
    console.log(`Giá trị có thể rút (USDC): ${usdcWethValueInUsdc.toFixed(6)} USDC`);

    // 4. Balance trong MoneyFiFundVault
    console.log("\n=== Balance trong MoneyFiFundVault ===");
    const userDepositInfo = await fundVault.getUserDepositInfor(usdcAddress, user.address);
    console.log("Thông tin deposit của user:");
    console.log("  Số dư gốc:", ethers.formatUnits(userDepositInfo.originalDepositAmount, 6), "USDC");
    console.log("  Số dư hiện tại (có thể rút):", ethers.formatUnits(userDepositInfo.currentDepositAmount, 6), "USDC");
    const fundVaultValueInUsdc = Number(ethers.formatUnits(userDepositInfo.currentDepositAmount, 6));
    console.log(`Giá trị có thể rút từ FundVault (USDC): ${fundVaultValueInUsdc.toFixed(6)} USDC`);

    // Kiểm tra số dư mUSDC
    const mUsdcBalance = await tokenLp.balanceOf(user.address);
    console.log(`Số dư mUSDC: ${ethers.formatUnits(mUsdcBalance, 6)} mUSDC (đại diện cho FundVault, không cộng riêng)`);

    // 5. Tổng kết giá trị có thể rút
    console.log("\n=== Tổng kết giá trị có thể rút (USDC) ===");
    const totalFromPools = uniLinkShareValue + usdcArbValueInUsdc + usdcWethValueInUsdc;
    const totalFromFundVault = fundVaultValueInUsdc;
    const grandTotal = totalFromPools + totalFromFundVault;
    console.log(`Từ pool UNI/LINK: ${uniLinkShareValue.toFixed(6)} USDC`);
    console.log(`Từ pool USDC/ARB: ${usdcArbValueInUsdc.toFixed(6)} USDC`);
    console.log(`Từ pool USDC/WETH: ${usdcWethValueInUsdc.toFixed(6)} USDC`);
    console.log(`Từ FundVault (USDC): ${fundVaultValueInUsdc.toFixed(6)} USDC`);
    console.log(`TỔNG CÓ THỂ RÚT: ${grandTotal.toFixed(6)} USDC`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Lỗi:", error.message);
        process.exit(1);
    });