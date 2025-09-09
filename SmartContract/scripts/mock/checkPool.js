// scripts/mock/inspectPool.js
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    const [caller] = await ethers.getSigners();

    const USDC = process.env.USDC_MOCK_ADDRESS;
    const WETH = process.env.WETH_MOCK_ADDRESS;
    const FEE = process.env.POOL_FEE ? Number(process.env.POOL_FEE) : 3000;
    const FACTORY_CANDIDATE = process.env.UNISWAP_V3_FACTORY || "0x0227628f3F023bb0B980b67D528571c95c6DaC1c";
    const POS_MANAGER = process.env.POSITION_MANAGER || "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
    const POOL_CREATE_TX = process.env.POOL_CREATE_TX || "0x1f499af38ba1baa90dc3af72db12782bee2e0c2a863cc3d7bb9aba98fdec0969";

    if (!USDC || !WETH) {
        console.error("❌ Thiếu USDC_MOCK_ADDRESS hoặc WETH_MOCK_ADDRESS trong .env");
        process.exit(1);
    }

    console.log("Caller:", caller.address);
    console.log("USDC:", USDC);
    console.log("WETH:", WETH);
    console.log("Fee:", FEE);
    console.log("Factory candidate:", FACTORY_CANDIDATE);
    console.log("PositionManager:", POS_MANAGER);
    console.log("POOL_CREATE_TX (optional):", POOL_CREATE_TX || "<none>");

    const provider = caller.provider;

    // 0) check code existence at position manager and factory candidate
    const codePos = await provider.getCode(POS_MANAGER);
    console.log("PositionManager code length:", (codePos || "0x").length);
    const codeFactory = await provider.getCode(FACTORY_CANDIDATE);
    console.log("Factory candidate code length:", (codeFactory || "0x").length);

    // 1) Try to read factory address from PositionManager (if exposed)
    let pmFactory = null;
    try {
        const pmAbi = ["function factory() view returns (address)"];
        const pm = await ethers.getContractAt(pmAbi, POS_MANAGER, caller);
        pmFactory = await pm.factory();
        console.log("PositionManager.factory() ->", pmFactory);
    } catch (err) {
        console.log("Note: PositionManager.factory() not available via this ABI or call failed.");
    }

    // Build list of factory addresses to try
    const factoryCandidates = [];
    if (pmFactory) factoryCandidates.push(pmFactory);
    if (FACTORY_CANDIDATE) factoryCandidates.push(FACTORY_CANDIDATE);
    // dedupe
    const factories = [...new Set(factoryCandidates.map(a => a && a.toLowerCase()))].filter(Boolean);

    // Prepare ABI for factory call and pool inspection
    const factoryAbi = [
        "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
        "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)"
    ];
    const poolAbi = [
        "function slot0() external view returns (uint160 sqrtPriceX96,int24 tick,uint16 observationIndex,uint16 observationCardinality,uint16 observationCardinalityNext,uint8 feeProtocol,bool unlocked)",
        "function liquidity() external view returns (uint128)",
        "function token0() external view returns (address)",
        "function token1() external view returns (address)"
    ];

    // helper to zero-pad topics
    const topicForAddress = (addr) => ethers.utils.hexZeroPad(ethers.utils.getAddress(addr), 32);
    const topicForUint = (n) => ethers.utils.hexZeroPad(ethers.utils.hexlify(n), 32);

    // PoolCreated topic
    const POOL_CREATED_TOPIC = ethers.utils.id("PoolCreated(address,address,uint24,int24,address)");

    // 2) Try getPool on each factory
    let foundPool = null;
    for (const fac of factories) {
        try {
            console.log("Trying factory.getPool at:", fac);
            const factory = await ethers.getContractAt(factoryAbi, fac, caller);
            const poolAddr = await factory.getPool(USDC, WETH, FEE);
            console.log("-> factory.getPool:", poolAddr);
            if (poolAddr && poolAddr !== ethers.ZeroAddress) {
                foundPool = { poolAddr, factory: fac };
                break;
            }
        } catch (err) {
            console.warn("factory.getPool call failed on", fac, ":", err.message.split("\n")[0]);
        }
    }

    // 3) If not found, try searching logs on the factories (PoolCreated)
    if (!foundPool) {
        console.log("No pool via getPool. Searching PoolCreated logs on candidate factories...");
        // tokens sorted by factory event: token0 < token1 (address order)
        const [token0, token1] = (USDC.toLowerCase() < WETH.toLowerCase()) ? [USDC, WETH] : [WETH, USDC];
        const topics = [POOL_CREATED_TOPIC, topicForAddress(token0), topicForAddress(token1), topicForUint(FEE)];
        for (const fac of factories) {
            try {
                console.log("Querying logs on factory:", fac);
                const logs = await provider.getLogs({
                    address: fac,
                    fromBlock: 0,
                    toBlock: "latest",
                    topics
                });
                console.log(" -> logs found:", logs.length);
                if (logs.length > 0) {
                    // decode first match
                    const iface = new ethers.Interface(factoryAbi);
                    const parsed = iface.parseLog(logs[0]);
                    console.log("Parsed PoolCreated event:", parsed.args);
                    foundPool = { poolAddr: parsed.args.pool, factory: fac };
                    break;
                }
            } catch (err) {
                console.warn("getLogs failed on", fac, ":", err.message.split("\n")[0]);
            }
        }
    }

    // 4) If still not found, parse provided POOL_CREATE_TX receipt logs
    if (!foundPool && POOL_CREATE_TX) {
        console.log("Trying to parse provided tx receipt:", POOL_CREATE_TX);
        const receipt = await provider.getTransactionReceipt(POOL_CREATE_TX);
        if (!receipt) {
            console.error("Cannot fetch receipt for tx:", POOL_CREATE_TX);
        } else {
            const iface = new ethers.Interface(factoryAbi);
            let matched = false;
            for (const log of receipt.logs) {
                try {
                    const parsed = iface.parseLog(log);
                    if (parsed && parsed.name === "PoolCreated") {
                        console.log("Found PoolCreated in tx receipt:", parsed.args);
                        foundPool = { poolAddr: parsed.args.pool, factory: receipt.to };
                        matched = true;
                        break;
                    }
                } catch (e) {
                    // ignore non-matching logs
                }
            }
            if (!matched) console.log("PoolCreated not found in that tx's logs.");
        }
    }

    // 5) Final: inspect pool if found
    if (!foundPool) {
        console.error("❌ Không tìm thấy pool. Kiểm tra: (1) bạn có gọi đúng PositionManager address?, (2) có dùng đúng factory?, (3) sqrtPriceX96 có tính đúng theo order token0/token1?");
        console.log("Bạn có thể gửi cho mình TX hash của tx create/mint; mình sẽ parse giúp.");
        process.exit(1);
    }

    console.log("✅ Found pool address:", foundPool.poolAddr, "via factory:", foundPool.factory);

    // inspect pool
    try {
        const pool = await ethers.getContractAt(poolAbi, foundPool.poolAddr, caller);
        const token0 = await pool.token0();
        const token1 = await pool.token1();
        const slot0 = await pool.slot0();
        const liquidity = await pool.liquidity();

        console.log("pool.token0:", token0);
        console.log("pool.token1:", token1);
        console.log("slot0.sqrtPriceX96:", slot0[0].toString());
        console.log("slot0.tick:", slot0[1].toString());
        console.log("liquidity:", liquidity.toString());
    } catch (err) {
        console.error("Failed to inspect pool contract:", err.message);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
