'use strict';

const { ethers } = require('ethers');
const StrategyPool = require('../models/pool.model');
const { abi } = require('../core/abi.contract');
require('dotenv').config();

// Contract instances
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
const fundVault = new ethers.Contract(process.env.MONEYFI_FUND_VAULT, abi.fundVault, provider);
const router = new ethers.Contract(process.env.MONEYFI_ROUTER, abi.routerAbi, wallet);
const controller = new ethers.Contract(process.env.MONEYFI_CONTROLLER, abi.controllerAbi, provider);

class TriggerPoolService {
    static startDepositListener = async () => {
        console.log('Starting DepositFundVault listener...');

        fundVault.on('DepositFundVault', async (token, receiver, amount, actualDepositAmount, timestamp, event) => {
            try {
                console.log(`Deposit detected: ${ethers.formatUnits(amount, 6)} ${token} by ${receiver}`);

                // Kiểm tra trạng thái hợp đồng
                const isRouterPaused = await router.paused();
                const isVaultPaused = await fundVault.paused();
                if (isRouterPaused || isVaultPaused) {
                    console.log('Contracts paused, skipping deposit...');
                    return;
                }

                // Kiểm tra số dư token trong FundVault
                const tokenContract = new ethers.Contract(token, abi.ierc20, provider);
                const fundVaultBalance = await tokenContract.balanceOf(process.env.MONEYFI_FUND_VAULT);
                if (fundVaultBalance < amount) {
                    console.log(`FundVault insufficient balance: ${ethers.formatUnits(fundVaultBalance, 6)} ${token}`);
                    return;
                }

                // Kiểm tra allowance của FundVault cho Router
                const allowance = await tokenContract.allowance(process.env.MONEYFI_FUND_VAULT, process.env.MONEYFI_ROUTER);
                if (allowance < amount) {
                    console.log(`Approving ${ethers.formatUnits(amount, 6)} ${token} for Router...`);
                    const tx = await tokenContract.connect(wallet).approve(process.env.MONEYFI_ROUTER, ethers.MaxUint256, { gasLimit: 100000 });
                    await tx.wait();
                    console.log('Approval successful');
                }

                // Truy xuất pool từ MongoDB
                const pools = await StrategyPool.find({ chainId: 11155111 });

                // Thu thập dữ liệu on-chain
                const poolData = await Promise.all(pools.map(async (pool) => {
                    const strategy = new ethers.Contract(pool.strategyAddress, abi.strategyAbi, provider);
                    const tvl = await strategy.totalLiquidWhitelistPool();
                    const totalAssets = await strategy.totalAssets();
                    const userBalance = await strategy.convertToAssets(await strategy.balanceOf(receiver));
                    const maxPercentLiquidity = await controller.maxPercentLiquidityStrategyToken(pool.baseToken);
                    const maxDepositValue = await controller.maxDepositValueToken(pool.baseToken);
                    const tokenInfo = await controller.getSupportedTokenInternalInfor(pool.baseToken);

                    // Kiểm tra strategy active và underlying asset
                    const isStrategyActive = await controller.isStrategyInternalActive(pool.strategyAddress);
                    if (!isStrategyActive) {
                        console.log(`Strategy ${pool.name} is not active, skipping...`);
                        return null;
                    }
                    const underlyingAsset = await strategy.asset();
                    if (underlyingAsset.toLowerCase() !== token.toLowerCase()) {
                        console.log(`Strategy ${pool.name} underlying asset (${underlyingAsset}) does not match deposited token (${token}), skipping...`);
                        return null;
                    }

                    // Kiểm tra baseToken và quoteToken
                    const baseToken = await strategy.baseToken();
                    const quoteToken = await strategy.quoteToken();
                    if (baseToken.toLowerCase() !== pool.baseToken.toLowerCase() || quoteToken.toLowerCase() !== pool.quoteToken.toLowerCase()) {
                        console.log(`Strategy ${pool.name} baseToken/quoteToken mismatch, skipping...`);
                        return null;
                    }

                    // Tính khoảng trống thanh khoản
                    const liquidityRoom = maxPercentLiquidity.sub(totalAssets.mul(10_000).div(tvl)).toNumber();

                    return {
                        ...pool.toObject(),
                        tvl: tvl.toString(),
                        totalAssets: totalAssets.toString(),
                        liquidityRoom: liquidityRoom > 0 ? liquidityRoom : 0,
                        userBalance: userBalance.toString(),
                        maxDepositValue: maxDepositValue.toString(),
                        decimals: tokenInfo.decimals.toNumber(),
                    };
                }));

                // Lọc pool hợp lệ
                const validPools = poolData.filter(pool => pool !== null);
                if (validPools.length === 0) {
                    console.log('No valid pools found, skipping deposit...');
                    return;
                }

                // Tính điểm cho mỗi pool (chỉ dùng TVL và liquidityRoom)
                const maxTVL = Math.max(...validPools.map(p => parseInt(p.tvl)));
                const maxLiquidityRoom = Math.max(...validPools.map(p => p.liquidityRoom));

                const scoredPools = validPools.map(pool => ({
                    ...pool,
                    tvlScore: maxTVL ? (parseInt(pool.tvl) / maxTVL) * 100 : 0,
                    liquidityRoomScore: maxLiquidityRoom ? (pool.liquidityRoom / maxLiquidityRoom) * 100 : 0,
                    totalScore: maxTVL && maxLiquidityRoom
                        ? (0.6 * (parseInt(pool.tvl) / maxTVL) * 100) +
                        (0.4 * (pool.liquidityRoom / maxLiquidityRoom) * 100)
                        : 0,
                }));

                // Sắp xếp pool theo điểm
                scoredPools.sort((a, b) => b.totalScore - a.totalScore);

                // Phân bổ tài sản (40%, 30%, 20%, 10%) - tối đa 4 pool
                const totalAmount = amount; // Không trừ phí vì distributionFee = 0
                const allocations = [
                    totalAmount.mul(10).div(100), // 40%
                    totalAmount.mul(10).div(100), // 30%
                    totalAmount.mul(10).div(100), // 20%
                    totalAmount.mul(10).div(100), // 10%
                ];

                // Gọi deposit cho tối đa 4 pool
                for (let i = 0; i < Math.min(scoredPools.length, 4); i++) {
                    const pool = scoredPools[i];
                    const amountForPool = allocations[i];
                    const distributionFee = ethers.parseUnits('0', pool.decimals); // Phí = 0

                    try {
                        // Bỏ qua swap giá trên testnet, đặt amountOutMin = 0
                        const amountOutMinWei = 0;

                        // Kiểm tra giới hạn
                        await controller.validateDistributeFundToStrategy(pool.strategyAddress, receiver, amountForPool);

                        // Tham số deposit
                        const depositParam = {
                            strategyAddress: pool.strategyAddress,
                            depositedTokenAddress: token,
                            depositor: receiver,
                            amount: amountForPool,
                            distributionFee: distributionFee,
                            externalCallData: '0x',
                        };

                        const swapParam = {
                            swapContract: process.env.UNISWAP_DEX_ADDRESS, // Sử dụng MoneyFiUniSwap
                            amountOutMin: amountOutMinWei,
                            externalCallData: '0x',
                            isV3: false,
                        };

                        // Gọi hàm deposit
                        const tx = await router.depositFundToStrategySameChainFromOperator(depositParam, swapParam, {
                            gasLimit: 1000000,
                        });

                        console.log(`Deposit to ${pool.name} successful: ${tx.hash}`);
                    } catch (error) {
                        console.error(`Error depositing to ${pool.name}: ${error.message}`);
                    }
                }
            } catch (error) {
                console.error(`Error in DepositFundVault listener: ${error.message}`);
            }
        });
    };
}

module.exports = TriggerPoolService;