const { ethers } = require("hardhat");
require("dotenv").config();

// npx hardhat run test/excute/getPoolInfor.js --network sepolia

async function main() {
    // Lấy tài khoản
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    // Địa chỉ hợp đồng từ .env (chỉ cần WETH và USDC cho balance, Chainlink cho giá)
    const usdcAddress = process.env.USDC_SEPOLIA_ADDRESS; // e.g., 0x94a9D9AC8a9C9b4e3e0f2f5b3a6e4f1c2d8e9f0a (test USDC)
    const wethAddress = process.env.WETH_SEPOLIA_ADDRESS; // e.g., 0x7b79995e5f793A07Bc00c21412e50E7E7E61E99d
    const pairAddress = "0x72e46e15ef83c896de44B1874B4AF7dDAB5b4F74"; // USDC/WETH pool

    // Chainlink ETH/USD aggregator trên Sepolia (testnet)
    const chainlinkEthUsdAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306"; // ETH/USD trên Sepolia

    // Kiểm tra biến môi trường
    if (!usdcAddress || !wethAddress) {
        throw new Error("Missing USDC_SEPOLIA_ADDRESS or WETH_SEPOLIA_ADDRESS in .env");
    }

    // Kết nối hợp đồng
    const pair = await ethers.getContractAt("IUniswapV2Pair", pairAddress, deployer);
    const usdc = await ethers.getContractAt("IERC20", usdcAddress, deployer);
    const weth = await ethers.getContractAt("IERC20", wethAddress, deployer);

    // ABI đơn giản cho Chainlink Aggregator
    const chainlinkAbi = ["function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"];
    const chainlink = new ethers.Contract(chainlinkEthUsdAddress, chainlinkAbi, deployer);

    console.log("=== Uniswap V2 USDC/WETH Pool Metrics (Sepolia) ===");
    console.log(`Pool Address: ${pairAddress}`);

    // 1. Lấy reserves và tính TVL
    const [reserve0, reserve1] = await pair.getReserves();
    const usdcDecimals = 6;
    const wethDecimals = 18;
    // Giả định reserve0 = USDC (6 decimals), reserve1 = WETH (18 decimals) - dựa trên pair chuẩn
    const usdcReserve = reserve0; // uint112, scaled by 10^6
    const wethReserve = reserve1; // uint112, scaled by 10^18

    // Lấy giá ETH/USD từ Chainlink
    let ethPriceUsd;
    try {
        const roundData = await chainlink.latestRoundData();
        ethPriceUsd = parseFloat(ethers.formatUnits(roundData.answer, 8)); // 8 decimals cho USD
        if (ethPriceUsd <= 0) throw new Error("Invalid price");
    } catch (error) {
        console.warn("Chainlink error, using fallback ETH price: $2000");
        ethPriceUsd = 2000;
    }
    console.log(`ETH Price (USD): $${ethPriceUsd}`);

    const usdcReserveUsd = parseFloat(ethers.formatUnits(usdcReserve, usdcDecimals));
    const wethReserveUsd = parseFloat(ethers.formatUnits(wethReserve, wethDecimals)) * ethPriceUsd;
    const tvlUsd = usdcReserveUsd + wethReserveUsd;
    console.log("Pool Reserves:");
    console.log(`  USDC: ${usdcReserveUsd.toFixed(6)} USDC ($${usdcReserveUsd.toFixed(2)})`);
    console.log(`  WETH: ${parseFloat(ethers.formatUnits(wethReserve, wethDecimals)).toFixed(18)} WETH ($${wethReserveUsd.toFixed(2)})`);
    console.log(`TVL: $${tvlUsd.toFixed(2)}`);

    // 2. Lấy volume 24h (query Swap events)
    const now = Math.floor(Date.now() / 1000);
    const fromTimestamp = now - 24 * 60 * 60; // 24h ago
    const currentBlock = await ethers.provider.getBlockNumber();
    // Ước tính block từ 24h trước (Sepolia ~12s/block, ~7200 blocks/24h)
    const fromBlock = Math.max(0, currentBlock - 7200);

    const swapAbi = ["event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)"];
    const swapInterface = new ethers.Interface(swapAbi);
    let totalVolumeUsd = 0;
    try {
        const swaps = await pair.queryFilter(pair.filters.Swap(null), fromBlock, currentBlock);
        for (const log of swaps) {
            const parsed = swapInterface.parseLog(log);
            const amount0In = parseFloat(ethers.formatUnits(parsed.args.amount0In, usdcDecimals));
            const amount1In = parseFloat(ethers.formatUnits(parsed.args.amount1In, wethDecimals));
            const amount0Out = parseFloat(ethers.formatUnits(parsed.args.amount0Out, usdcDecimals));
            const amount1Out = parseFloat(ethers.formatUnits(parsed.args.amount1Out, wethDecimals));

            // Volume = input value in USD (USDC in + WETH in * price)
            const volumeInUsd = amount0In + (amount1In * ethPriceUsd);
            totalVolumeUsd += volumeInUsd;
        }
        console.log(`24h Volume: $${totalVolumeUsd.toFixed(2)} (from ${swaps.length} swaps)`);
    } catch (error) {
        console.warn("Volume query error (many txns?), using 0");
        totalVolumeUsd = 0;
    }

    // Option: Sử dụng The Graph cho volume chính xác hơn (uncomment nếu có endpoint)
    /*
    const subgraphUrl = "https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2-sepolia"; // Giả định subgraph Sepolia
    const query = `
        query {
            pair(id: "${pairAddress.toLowerCase()}") {
                volumeUSD
                swaps(first: 1000, orderBy: timestamp, orderDirection: desc, where: {timestamp_gte: ${fromTimestamp}}) {
                    amountUSD
                }
            }
        }
    `;
    // Fetch via axios hoặc fetch, sum swaps...
    */

    // 3. Tính APY (ước tính từ fees)
    const feeRate = 0.003; // 0.3% Uniswap V2
    const annualVolumeUsd = totalVolumeUsd * 365;
    const feesUsd = annualVolumeUsd * feeRate;
    const apy = tvlUsd > 0 ? (feesUsd / tvlUsd) * 100 : 0;
    console.log(`Estimated APY: ${apy.toFixed(4)}% (based on 0.3% fees)`);

    console.log("=== End of Metrics ===");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });