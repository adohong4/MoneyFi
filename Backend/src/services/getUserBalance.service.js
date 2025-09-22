'use strict';

const { ethers } = require('ethers');
const transactionLogModel = require('../models/trigger/transaction_log.model');
const StrategyPool = require('../models/pool.model');
const { abi } = require('../core/abi.contract');
require('dotenv').config();

class BalanceService {
    static async getUserBalance(userAddress) {
        // Kiểm tra địa chỉ user
        if (!ethers.isAddress(userAddress)) {
            throw new Error('Invalid user address');
        }

        // Kết nối hợp đồng
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const usdcAddress = process.env.USDC_SEPOLIA_ADDRESS;
        const fundVaultAddress = process.env.MONEYFI_FUND_VAULT;
        const uniswapRouterAddress = process.env.UNISWAP_V2_ROUTER;

        if (!usdcAddress || !fundVaultAddress || !uniswapRouterAddress) {
            throw new Error('Missing environment variables: USDC_SEPOLIA_ADDRESS, MONEYFI_FUND_VAULT, or UNISWAP_V2_ROUTER');
        }

        const fundVault = new ethers.Contract(fundVaultAddress, abi.fundVault, provider);
        const uniswapRouter = new ethers.Contract(
            uniswapRouterAddress,
            abi.uniswapV2Router, // Sử dụng ABI từ abi.contract.js
            provider
        );

        // Lấy 4 giao dịch depositSameChain gần nhất từ các pool khác nhau
        const transactions = await transactionLogModel
            .aggregate([
                {
                    $match: {
                        userAddress: userAddress,
                        type: 'depositSameChain',
                        status: 'Success',
                    },
                },
                {
                    $sort: { createdAt: -1 },
                },
                {
                    $limit: 4,
                },
            ])
            .exec();

        // Tính tổng số tiền đã đầu tư và lấy số dư từ các pool
        let totalDepositedToPools = 0;
        const poolBalances = [];
        const poolDetails = [];

        for (const tx of transactions) {
            try {
                const strategyAddress = tx.strategyAddress;
                const pool = await StrategyPool.findOne({ strategyAddress, chainId: 11155111 });

                if (!pool) {
                    console.warn(`No pool found for strategyAddress: ${strategyAddress}, skipping...`);
                    continue;
                }

                const strategy = new ethers.Contract(strategyAddress, abi.strategyAbi, provider);
                const shares = await strategy.balanceOf(userAddress);
                const assets = await strategy.convertToAssets(shares);

                // Lấy thông tin Uniswap pair
                const pairAddress = await strategy.uniswapPair();
                const pair = new ethers.Contract(pairAddress, [
                    'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
                    'function token0() view returns (address)',
                    'function totalSupply() view returns (uint256)',
                    'function balanceOf(address) view returns (uint256)',
                ], provider);

                const [reserve0, reserve1] = await pair.getReserves();
                const token0 = await pair.token0();
                const baseToken = pool.baseToken.toLowerCase() === usdcAddress.toLowerCase() ? pool.baseToken : pool.quoteToken;
                const quoteToken = pool.baseToken.toLowerCase() === usdcAddress.toLowerCase() ? pool.quoteToken : pool.baseToken;

                const baseReserve = token0.toLowerCase() === baseToken.toLowerCase() ? reserve0 : reserve1;
                const quoteReserve = token0.toLowerCase() === baseToken.toLowerCase() ? reserve1 : reserve0;
                const totalLpSupply = await pair.totalSupply();
                const userLpBalance = await pair.balanceOf(strategyAddress);
                const lpBaseValue = (userLpBalance * baseReserve) / totalLpSupply;
                const lpQuoteValue = (userLpBalance * quoteReserve) / totalLpSupply;

                // Chuyển đổi quote token sang USDC
                const quoteToBase = lpQuoteValue > 0
                    ? (await uniswapRouter.getAmountsOut(lpQuoteValue, [quoteToken, usdcAddress]))[1]
                    : 0n;
                const totalPoolValue = lpBaseValue + quoteToBase;

                const amountDeposited = parseFloat(tx.amountDeposit);
                totalDepositedToPools += amountDeposited;

                poolBalances.push({
                    poolName: tx.poolName,
                    strategyAddress,
                    amountDeposited: amountDeposited.toFixed(6),
                    shares: ethers.formatUnits(shares, 18),
                    assets: ethers.formatUnits(assets, 6),
                    poolValueInUSDC: ethers.formatUnits(totalPoolValue, 6),
                    reserves: {
                        base: ethers.formatUnits(baseReserve, 6),
                        quote: ethers.formatUnits(quoteReserve, await (new ethers.Contract(quoteToken, ['function decimals() view returns (uint8)'], provider)).decimals()),
                    },
                    lpBalance: ethers.formatUnits(userLpBalance, 18),
                    txHash: tx.txHash,
                    timestamp: new Date(tx.createdAt).toLocaleString(),
                });
            } catch (error) {
                console.error(`Error processing pool ${tx.poolName}:`, error);
            }
        }

        // Lấy số dư trong MoneyFiFundVault
        const userDepositInfo = await fundVault.getUserDepositInfor(usdcAddress, userAddress);
        const originalDeposit = ethers.formatUnits(userDepositInfo.originalDepositAmount, 6);
        const currentDeposit = ethers.formatUnits(userDepositInfo.currentDepositAmount, 6);

        // Tổng hợp số dư từ các pool
        const totalPoolAssets = poolBalances.reduce((sum, pool) => sum + parseFloat(pool.assets), 0);

        // Tổng số dư
        const totalBalance = parseFloat(currentDeposit) + totalPoolAssets;

        return {
            userAddress,
            fundVault: {
                originalDeposit: originalDeposit,
                currentDeposit: currentDeposit,
            },
            poolBalances,
            totalDepositedToPools: totalDepositedToPools.toFixed(6),
            totalBalance: totalBalance.toFixed(6),
        };
    }
}

module.exports = BalanceService;