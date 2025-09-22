const { ethers } = require("hardhat");
require("dotenv").config();

// npx hardhat run test/deposit/rebalance/checkDecimal.js --network sepolia

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Testing _convertSystemFeeDecimal with account:", deployer.address);

    const routerAddress = process.env.MONEYFI_ROUTER || "0x2a64f7a1F0fb00d05Da02F37f1Ee0825CfCecb73";
    const controllerAddress = process.env.MONEYFI_CONTROLLER || "0x95f26cFAd70874e8e4FAF33B9a65634a44b10078";
    const usdcAddress = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

    const router = await ethers.getContractAt("MoneyFiRouter", routerAddress, deployer);
    const controller = await ethers.getContractAt("MoneyFiController", controllerAddress, deployer);
    const usdc = await ethers.getContractAt("IERC20", usdcAddress, deployer);

    const _originalFee = ethers.parseUnits("0.01", 6); // 0.01 USDC
    let convertFee;

    try {
        const averageSystemActionFee = await controller.averageSystemActionFee();
        console.log("fee:", ethers.formatUnits(_originalFee, 6), "USDC");
        console.log("averageSystemActionFee:", ethers.formatUnits(averageSystemActionFee, 6), "USDC");

        if (_originalFee > averageSystemActionFee) {
            console.log("InvalidSystemFee: _originalFee > averageSystemActionFee");
            throw new Error("InvalidSystemFee");
        }

        try {
            const decimals = await usdc.decimals();
            console.log("USDC decimals:", decimals);
        } catch (error) {
            decimals = 6;
        }

        if (decimals != 18) {
            const decimalNeedToBuff = 18 - decimals;
            console.log("decimalNeedToBuff:", decimalNeedToBuff);
            convertFee = _originalFee.div(10 ** decimalNeedToBuff);
        } else {
            convertFee = _originalFee;
        }

        console.log("convertFee:", ethers.formatUnits(convertFee, 18), "(18 decimals)");
    } catch (error) {
        console.error("Error:", error);
        if (error.reason) console.error("Reason:", error.reason);
        if (error.data) console.error("Data:", error.data);
        throw error;
    }

    return convertFee;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });