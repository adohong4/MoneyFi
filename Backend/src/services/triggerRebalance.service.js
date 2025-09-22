'use strict';

const { ethers } = require('ethers');
const StrategyPool = require('../models/pool.model'); // Điều chỉnh đường dẫn theo dự án
const transactionLogModel = require('../models/trigger/transaction_log.model'); // Điều chỉnh đường dẫn
const { abi } = require('../core/abi.contract'); // Điều chỉnh đường dẫn
require('dotenv').config();

// Contract instances
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
const fundVault = new ethers.Contract(process.env.MONEYFI_FUND_VAULT, abi.fundVault, provider);
const router = new ethers.Contract(process.env.MONEYFI_ROUTER, abi.routerAbi, wallet);
const controller = new ethers.Contract(process.env.MONEYFI_CONTROLLER, abi.controllerAbi, provider);
const usdcAddress = process.env.USDC_SEPOLIA_ADDRESS;

// Uniswap V2 Factory và Router
const uniswapFactory = new ethers.Contract(process.env.UNISWAP_V2_FACTORY, [
    'function getPair(address tokenA, address tokenB) view returns (address pair)',
], provider);
const uniswapRouter = new ethers.Contract(process.env.UNISWAP_V2_ROUTER, [
    'function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)',
], provider);

// Lưu trữ giá trước đó (có thể thay bằng MongoDB nếu cần lưu lâu dài)
let previousPrices = {};

// Ngưỡng giảm giá để trigger rebalance (10%)
const PRICE_DROP_THRESHOLD = 0.1; // 10%

class RebalancePoolService {
    // Hàm lấy giá token từ Uniswap V2 pair
    static async getTokenPrice(pool) {
        try {
            const pairAddress = await uniswapFactory.getPair(pool.baseToken, pool.quoteToken);
            if (!ethers.isAddress(pairAddress)) {
                console.log(`No pair found for ${pool.baseToken}/${pool.quoteToken}`);
                return null;
            }

            const pair = new ethers.Contract(pairAddress, [
                'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
                'function token0() view returns (address)',
            ], provider);

            const { reserve0, reserve1 } = await pair.getReserves();
            const token0 = await pair.token0();

            // Tính giá dựa trên cặp token
            const [reserveBase, reserveQuote] = token0.toLowerCase() === pool.baseToken.toLowerCase()
                ? [reserve0, reserve1]
                : [reserve1, reserve0];

            // Giá = reserveQuote / reserveBase
            const price = Number(ethers.formatUnits(reserveQuote, pool.quoteTokenDecimals)) /
                Number(ethers.formatUnits(reserveBase, pool.baseTokenDecimals));

            return price;
        } catch (error) {
            console.error(`Error getting price for pool ${pool.name}:`, error);
            return null;
        }
    }

    // Hàm chính: Kiểm tra giá và rebalance
    static async runRebalance() {
        console.log('Starting rebalance service at', new Date().toLocaleString());

        try {
            // Kiểm tra trạng thái hợp đồng
            const isRouterPaused = await router.paused();
            const isVaultPaused = await fundVault.paused();
            if (isRouterPaused || isVaultPaused) {
                console.log('Contracts paused, skipping rebalance...');
                return;
            }

            // Lấy danh sách pool từ MongoDB (chainId: Sepolia)
            const pools = await StrategyPool.find({ chainId: 11155111 });
            if (pools.length === 0) {
                console.log('No USDC pools found in MongoDB, skipping rebalance...');
                return;
            }

            // Lấy danh sách người dùng từ transactionLogModel
            const users = await transactionLogModel.distinct('userAddress', { token: usdcAddress });
            if (users.length === 0) {
                console.log('No users found, skipping rebalance...');
                return;
            }

            for (const user of users) {
                const userAddress = user;

                // Thu thập dữ liệu pool và kiểm tra giá
                const poolData = await Promise.all(pools.map(async (pool) => {
                    try {
                        if (!ethers.isAddress(pool.strategyAddress)) {
                            console.log(`Invalid strategyAddress for ${pool.name}: ${pool.strategyAddress}, skipping...`);
                            return null;
                        }

                        const strategy = new ethers.Contract(pool.strategyAddress, abi.strategyAbi, provider);

                        // Kiểm tra contract strategy tồn tại
                        try {
                            await strategy.totalLiquidWhitelistPool();
                        } catch (error) {
                            console.log(`Strategy ${pool.name} is not deployed or invalid: ${error.message}, skipping...`);
                            return null;
                        }

                        // Kiểm tra strategy active
                        const isStrategyActive = await controller.isStrategyInternalActive(pool.strategyAddress);
                        if (!isStrategyActive) {
                            console.log(`Strategy ${pool.name} is not active, skipping...`);
                            return null;
                        }

                        // Lấy số dư và lợi nhuận của user
                        const balanceOfUser = await strategy.balanceOf(userAddress); // bigint
                        const userProfit = await strategy.getUserProfit(userAddress); // bigint
                        const totalAssets = await strategy.totalAssets(); // bigint
                        const tvl = await strategy.totalLiquidWhitelistPool(); // bigint

                        const tokenInfo = await controller.getSupportedTokenInternalInfor(pool.baseToken);
                        const tokenDecimals = Number(tokenInfo.decimals);

                        // Chỉ rebalance nếu user có số dư
                        if (balanceOfUser === 0n) {
                            console.log(`No balance for user ${userAddress} in pool ${pool.name}, skipping...`);
                            return null;
                        }

                        // Lấy giá hiện tại
                        const quoteTokenInfo = await controller.getSupportedTokenInternalInfor(pool.quoteToken);
                        const currentPrice = await this.getTokenPrice({
                            ...pool.toObject(),
                            baseTokenDecimals: tokenDecimals,
                            quoteTokenDecimals: Number(quoteTokenInfo.decimals),
                        });

                        if (!currentPrice) {
                            console.log(`Cannot get price for pool ${pool.name}, skipping...`);
                            return null;
                        }

                        // So sánh với giá trước đó
                        const poolKey = `${pool.baseToken}-${pool.quoteToken}`;
                        const previousPrice = previousPrices[poolKey] || currentPrice;
                        const priceChange = (previousPrice - currentPrice) / previousPrice;

                        // Cập nhật giá trước đó
                        previousPrices[poolKey] = currentPrice;

                        return {
                            ...pool.toObject(),
                            totalAssets: totalAssets.toString(),
                            tvl: tvl.toString(),
                            userBalance: balanceOfUser.toString(),
                            userProfit: userProfit.toString(),
                            decimals: tokenDecimals,
                            currentPrice,
                            priceChange,
                        };
                    } catch (error) {
                        console.error(`Error processing pool ${pool.name} for user ${userAddress}:`, error);
                        return null;
                    }
                }));

                // Lọc pool hợp lệ
                const validPools = poolData.filter(p => p !== null);
                if (validPools.length === 0) {
                    console.log(`No valid pools for user ${userAddress}, skipping rebalance...`);
                    continue;
                }

                // Rebalance nếu giá giảm mạnh
                for (const pool of validPools) {
                    if (pool.priceChange > PRICE_DROP_THRESHOLD) {
                        console.log(`Price drop detected for ${pool.name}: ${pool.priceChange * 100}%`);

                        try {
                            const rebalanceFee = ethers.parseUnits('0', pool.decimals); // Phí = 0
                            const isReferral = false;

                            // Tham số rebalance
                            const rebalanceParam = {
                                strategyAddress: pool.strategyAddress,
                                userAddress: userAddress,
                                rebalancesFee: rebalanceFee,
                                isReferral: isReferral,
                            };

                            // Gọi hàm rebalance
                            const tx = await router.rebalanceFundSameChain(rebalanceParam, {
                                gasLimit: 1000000,
                            });

                            console.log(`Rebalance for user ${userAddress} in ${pool.name} successful: ${tx.hash}`);

                            let status = "Failed";
                            try {
                                const receipt = await tx.wait();
                                if (receipt && receipt.status === 1) {
                                    status = "Success";
                                    console.log(`Rebalance for ${pool.name} SUCCESS: ${tx.hash}`);
                                } else {
                                    console.log(`Rebalance for ${pool.name} FAILED: ${tx.hash}`);
                                }
                            } catch (err) {
                                console.error(`Rebalance reverted for ${pool.name}:`, err);
                            }

                            // Ghi log giao dịch
                            await transactionLogModel.create({
                                userAddress: userAddress,
                                poolName: pool.name,
                                strategyAddress: pool.strategyAddress,
                                type: "rebalanceSameChain",
                                token: usdcAddress,
                                amountDeposit: ethers.formatUnits(pool.userBalance, pool.decimals),
                                txHash: tx.hash,
                                status: status,
                            });
                        } catch (error) {
                            console.error(`Error rebalancing for ${pool.name} for user ${userAddress}:`, error);
                        }
                    } else {
                        console.log(`No significant price drop for ${pool.name}: ${pool.priceChange * 100}%, skipping...`);
                    }
                }
            }

            // Kiểm tra số dư FundVault sau rebalance
            const tokenContract = new ethers.Contract(usdcAddress, [
                'function balanceOf(address) view returns (uint256)',
                'function decimals() view returns (uint8)',
            ], provider);
            const balanceAfterRebalance = await tokenContract.balanceOf(process.env.MONEYFI_FUND_VAULT);
            const decimals = Number(await tokenContract.decimals());
            console.log(`FundVault USDC balance after rebalance: ${ethers.formatUnits(balanceAfterRebalance, decimals)} USDC`);
        } catch (error) {
            console.error(`Error in RebalancePoolService:`, error);
        }
    }

    // Khởi động service
    static start() {
        console.log('RebalancePoolService started...');
        // Chạy định kỳ mỗi 10 phút
        setInterval(() => this.runRebalance(), 10 * 60 * 1000);
        // Chạy lần đầu ngay lập tức
        this.runRebalance();
    }
}

module.exports = RebalancePoolService;