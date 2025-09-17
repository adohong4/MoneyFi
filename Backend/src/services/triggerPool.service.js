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
const usdcAddress = process.env.USDC_SEPOLIA_ADDRESS;

class TriggerPoolService {
    static startDepositListener = async () => {
        console.log('Starting DepositFundVault listener...');

        fundVault.on('DepositFundVault', async (token, receiver, amount, actualDepositAmount, timestamp, event) => {
            try {
                // Chỉ xử lý USDC
                if (token.toLowerCase() !== usdcAddress.toLowerCase()) {
                    console.log(`Only USDC is supported, received token: ${token}, skipping...`);
                    return;
                }

                // Lấy instance contract USDC
                const tokenContract = new ethers.Contract(usdcAddress, [
                    "function balanceOf(address) view returns (uint256)",
                    "function decimals() view returns (uint8)"
                ], provider);

                // decimals trả về bigint trong ethers v6 -> convert to Number
                const decimals = Number(await tokenContract.decimals()); // USDC: 6 decimals
                console.log(`Deposit detected: ${ethers.formatUnits(amount, decimals)} USDC by ${receiver}`);

                // Kiểm tra trạng thái hợp đồng
                const isRouterPaused = await router.paused();
                const isVaultPaused = await fundVault.paused();
                if (isRouterPaused || isVaultPaused) {
                    console.log('Contracts paused, skipping deposit...');
                    return;
                }

                // Kiểm tra số dư USDC trong FundVault
                const fundVaultBalance = await tokenContract.balanceOf(process.env.MONEYFI_FUND_VAULT); // bigint
                if (fundVaultBalance < amount) {
                    console.log(`FundVault insufficient balance: ${ethers.formatUnits(fundVaultBalance, decimals)} USDC`);
                    return;
                }
                console.log(`FundVault USDC balance: ${ethers.formatUnits(fundVaultBalance, decimals)} USDC`);

                // Truy xuất pool từ MongoDB, chỉ lấy pool có chainId = sepolia (11155111)
                const pools = await StrategyPool.find({ chainId: 11155111 });
                if (pools.length === 0) {
                    console.log('No USDC pools found in MongoDB, skipping deposit...');
                    return;
                }

                // Thu thập dữ liệu on-chain
                const poolData = await Promise.all(pools.map(async (pool) => {
                    try {
                        // Kiểm tra strategyAddress hợp lệ
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

                        // Các giá trị trả về là bigint (ethers v6)
                        const tvl = await strategy.totalLiquidWhitelistPool();          // bigint
                        const totalAssets = await strategy.totalAssets();               // bigint
                        const balanceOfUser = await strategy.balanceOf(receiver);       // bigint
                        const userBalance = await strategy.convertToAssets(balanceOfUser); // bigint

                        const maxPercentLiquidity = await controller.maxPercentLiquidityStrategyToken(pool.baseToken); // bigint or number
                        const maxDepositValue = await controller.maxDepositValueToken(pool.baseToken); // bigint
                        const tokenInfo = await controller.getSupportedTokenInternalInfor(pool.baseToken);

                        // Debug log
                        console.log(`Pool ${pool.name}: tvl=${tvl.toString()}, totalAssets=${totalAssets.toString()}, userBalance=${userBalance.toString()}`);

                        // Kiểm tra strategy active và underlying asset
                        const isStrategyActive = await controller.isStrategyInternalActive(pool.strategyAddress);
                        if (!isStrategyActive) {
                            console.log(`Strategy ${pool.name} is not active, skipping...`);
                            return null;
                        }
                        const underlyingAsset = await strategy.asset();
                        if (underlyingAsset.toLowerCase() !== token.toLowerCase()) {
                            if (!process.env.UNISWAP_DEX_ADDRESS) {
                                console.log(`Strategy ${pool.name} underlying asset (${underlyingAsset}) does not match deposited token (${token}), skipping...`);
                                return null;
                            } else {
                                console.log(`Strategy ${pool.name} requires swap from ${token} -> ${underlyingAsset}, will use swapParam...`);
                            }
                        }

                        // Kiểm tra baseToken và quoteToken
                        const baseToken = await strategy.baseToken();
                        const quoteToken = await strategy.quoteToken();
                        if (baseToken.toLowerCase() !== pool.baseToken.toLowerCase() || quoteToken.toLowerCase() !== pool.quoteToken.toLowerCase()) {
                            console.log(`Strategy ${pool.name} baseToken/quoteToken mismatch, skipping...`);
                            return null;
                        }

                        // Kiểm tra totalAssets và tvl
                        if (totalAssets === undefined || tvl === undefined) {
                            console.log(`Invalid totalAssets or tvl for ${pool.name}: totalAssets=${totalAssets}, tvl=${tvl}, skipping...`);
                            return null;
                        }

                        // Tính khoảng trống thanh khoản (dùng bigint arithmetic)
                        // guard divide by zero
                        let liquidityRoomNumber = 0;
                        if (tvl !== 0n) {
                            // maxPercentLiquidity và phép tính có thể cần chuẩn theo đơn vị contract của bạn.
                            // Duy trì công thức ban đầu: maxPercentLiquidity - (totalAssets * 10000 / tvl)
                            // đảm bảo tất cả là BigInt trước khi tính
                            const maxPerc = BigInt(maxPercentLiquidity);
                            const calc = maxPerc - (BigInt(totalAssets) * 10000n) / BigInt(tvl);
                            liquidityRoomNumber = Number(calc > 0n ? calc : 0n);
                        }

                        const tokenDecimals = Number(tokenInfo.decimals); // convert to Number for format/parse

                        return {
                            ...pool.toObject(),
                            tvl: tvl.toString(),
                            totalAssets: totalAssets.toString(),
                            liquidityRoom: liquidityRoomNumber > 0 ? liquidityRoomNumber : 0,
                            userBalance: userBalance.toString(),
                            maxDepositValue: (BigInt(maxDepositValue)).toString(),
                            decimals: tokenDecimals,
                        };
                    } catch (error) {
                        console.error(`Error processing pool ${pool.name}:`, error && error.stack ? error.stack : error);
                        return null;
                    }
                }));

                // Lọc pool hợp lệ
                const validPools = poolData.filter(p => p !== null);
                if (validPools.length === 0) {
                    console.log('No valid pools found, skipping deposit...');
                    return;
                }

                // Tính điểm cho mỗi pool (chỉ dùng TVL và liquidityRoom)
                // Xử lý TVL bằng bigint để tránh mất precision
                const maxTVL = validPools.reduce((acc, p) => {
                    const b = BigInt(p.tvl);
                    return b > acc ? b : acc;
                }, 0n);
                const maxLiquidityRoom = Math.max(...validPools.map(p => p.liquidityRoom));

                const scoredPools = validPools.map(pool => {
                    const tvlScore = maxTVL !== 0n ? Number((BigInt(pool.tvl) * 100n) / maxTVL) : 0;
                    const liquidityRoomScore = maxLiquidityRoom ? (pool.liquidityRoom / maxLiquidityRoom) * 100 : 0;
                    const totalScore = (0.6 * tvlScore) + (0.4 * liquidityRoomScore);
                    return {
                        ...pool,
                        tvlScore,
                        liquidityRoomScore,
                        totalScore,
                    };
                });

                // Sắp xếp pool theo điểm
                scoredPools.sort((a, b) => b.totalScore - a.totalScore);

                // Phân bổ tài sản (10% mỗi pool, tối đa 4 pool, tổng 40%)
                const totalAmount = fundVaultBalance; // bigint
                const allocations = [
                    totalAmount * 10n / 100n,
                    totalAmount * 10n / 100n,
                    totalAmount * 10n / 100n,
                    totalAmount * 10n / 100n,
                ];

                // Gọi deposit cho tối đa 4 pool
                for (let i = 0; i < Math.min(scoredPools.length, 4); i++) {
                    const pool = scoredPools[i];
                    const amountForPool = allocations[i];
                    const distributionFee = ethers.parseUnits('0', pool.decimals); // Phí = 0 (returns bigint)

                    try {
                        // Bỏ qua swap giá trên testnet, đặt amountOutMin = 0
                        const amountOutMinWei = 0;

                        // Kiểm tra giới hạn (hãy chắc controller chấp nhận bigint)
                        await controller.validateDistributeFundToStrategy(pool.strategyAddress, receiver, amountForPool);

                        // Tham số deposit
                        const depositParam = {
                            strategyAddress: pool.strategyAddress,
                            depositedTokenAddress: usdcAddress,
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
                            gasLimit: 500000,
                        });

                        console.log(`Deposit to ${pool.name} successful: ${tx.hash}`);
                    } catch (error) {
                        console.error(`Error depositing to ${pool.name}:`, error && error.stack ? error.stack : error);
                    }
                }

                const balanceAfterDeposit = await tokenContract.balanceOf(process.env.MONEYFI_FUND_VAULT); // bigint
                console.log(`FundVault USDC balance after deposit: ${ethers.formatUnits(balanceAfterDeposit, decimals)} USDC`);
            } catch (error) {
                console.error(`Error in DepositFundVault listener:`, error && error.stack ? error.stack : error);
            }
        });
    };
}

module.exports = TriggerPoolService;
