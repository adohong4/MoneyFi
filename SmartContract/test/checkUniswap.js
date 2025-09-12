// scripts/InteractWithMoneyFiUniSwap.js
const { ethers } = require("hardhat");
require("dotenv").config();

// npx hardhat run test/checkUniswap.js --network sepolia
async function main() {
    const [deployer] = await ethers.getSigners();

    // Địa chỉ của contract MoneyFiUniSwap đã deploy (lấy từ .env hoặc hardcode)
    const contractAddress = process.env.UNISWAP_DEX_ADDRESS; // Thêm vào .env: MONEYFI_UNISWAP_ADDRESS=0x...

    // Kết nối đến contract
    const moneyFiUniSwap = await ethers.getContractAt("MoneyFiUniSwap", contractAddress, deployer);

    console.log("Deployer address:", deployer.address);
    console.log("MoneyFiUniSwap contract address:", contractAddress);

    // 1. Kiểm tra quyền DELEGATE_ADMIN_ROLE
    const isDelegateAdmin = await moneyFiUniSwap.isDelegateAdmin(deployer.address);
    console.log(`Is ${deployer.address} delegate admin? ${isDelegateAdmin}`);

    // 2. Lấy các địa chỉ hiện tại (router, factory, poolFee)
    console.log("\n=== Current Configuration ===");
    const routerV3 = await moneyFiUniSwap.routerV3();
    const routerV2 = await moneyFiUniSwap.routerV2();
    const factoryV3 = await moneyFiUniSwap.factoryV3();
    const factoryV2 = await moneyFiUniSwap.factoryV2();
    const poolFee = await moneyFiUniSwap.poolFee();
    console.log("Router V3:", routerV3);
    console.log("Router V2:", routerV2);
    console.log("Factory V3:", factoryV3);
    console.log("Factory V2:", factoryV2);
    console.log("Pool Fee:", poolFee.toString());

    // 3. Kiểm tra sự tồn tại của pool (ví dụ: UNI và LINK trên Sepolia, thay đổi nếu cần)
    const tokenA = process.env.UNI_SEPOLIA_ADDRESS; // Địa chỉ token A, ví dụ UNI trên Sepolia
    const tokenB = process.env.LINK_SEPOLIA_ADDRESS; // Địa chỉ token B, ví dụ LINK trên Sepolia
    const v3Fee = 3000; // Fee pool V3

    console.log("\n=== Checking Pool Existence ===");
    const poolExistsV3 = await moneyFiUniSwap.checkPoolExistsV3(tokenA, tokenB, v3Fee);
    console.log(`V3 Pool exists for ${tokenA} and ${tokenB} with fee ${v3Fee}? ${poolExistsV3}`);

    const poolExistsV2 = await moneyFiUniSwap.checkPoolExistsV2(tokenA, tokenB);
    console.log(`V2 Pool exists for ${tokenA} and ${tokenB}? ${poolExistsV2}`);

    // 4. Set Pool Fee nếu là delegate admin (ví dụ: set về 500 nếu khác)
    if (isDelegateAdmin) {
        const targetPoolFee = 500;
        if (poolFee !== targetPoolFee) {
            try {
                const tx = await moneyFiUniSwap.connect(deployer).setPoolFee(targetPoolFee);
                await tx.wait();
                console.log(`Set Pool Fee to: ${targetPoolFee}`);
            } catch (error) {
                console.error("Failed to set Pool Fee:", error.message);
            }
        } else {
            console.log(`Pool Fee already set to: ${targetPoolFee}`);
        }
    } else {
        console.log("Skipping setPoolFee: Not delegate admin");
    }

    // 5. Thực hiện swap token (ví dụ: Swap UNI sang LINK trên V3)
    // Lưu ý: Cần có tokenIn trong wallet deployer, và approve trước nếu cần (nhưng contract xử lý transferFrom)
    // Đây là ví dụ, thay đổi params thực tế và chạy trên testnet với token test
    const tokenIn = process.env.USDC_SEPOLIA_ADDRESS; // USDC
    const tokenOut = process.env.UNI_SEPOLIA_ADDRESS; // UNI
    const amountIn = ethers.parseUnits("1", 6); // 1 UNI
    const amountOutMin = 0; // Minimum output (thay đổi để tránh slippage lớn)
    const receiver = deployer.address;
    const isV3 = false; // Swap V3
    const extraBytes = "0x"; // Bytes memory rỗng

    // Trước tiên, approve tokenIn cho contract nếu cần (contract dùng transferFrom từ msg.sender)
    // Nhưng để an toàn, kiểm tra balance và approve nếu contract cần (thực tế contract tự approve router)
    const tokenInContract = await ethers.getContractAt("IERC20", tokenIn);
    const balance = await tokenInContract.balanceOf(deployer.address);
    console.log("\n=== Preparing Swap ===");
    console.log(`Balance of ${tokenIn} for deployer: ${ethers.formatUnits(balance, 18)}`);

    if (balance >= amountIn) {
        // Approve contract để transferFrom
        const allowance = await tokenInContract.allowance(deployer.address, contractAddress);
        if (allowance < amountIn) {
            const approveTx = await tokenInContract.connect(deployer).approve(contractAddress, amountIn);
            await approveTx.wait();
            console.log(`Approved ${ethers.formatUnits(amountIn, 18)} ${tokenIn} for contract`);
        }

        try {
            const tx = await moneyFiUniSwap.connect(deployer).swapToken(
                tokenIn,
                tokenOut,
                amountIn,
                amountOutMin,
                receiver,
                isV3,
                extraBytes
            );
            const receipt = await tx.wait();
            console.log("Swap successful. Transaction hash:", receipt.hash);
            // Lấy amountOut từ return value hoặc event nếu cần
        } catch (error) {
            console.error("Failed to swap token:", error.message);
        }
    } else {
        console.log("Insufficient balance for swap. Skipping.");
    }

    // 6. Xác minh sau swap (kiểm tra balance mới nếu cần)
    // ...
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Interaction failed:", error.message);
        process.exit(1);
    });