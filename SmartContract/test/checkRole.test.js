const { ethers } = require("hardhat");
const { expect } = require("chai");

// npx hardhat test test/checkRole.test.js --network sepolia 

describe("MoneyFiController Role Tests", function () {
    let moneyFiController;
    let deployer;
    let otherAccount;
    const proxyAddress = "0x6B73f05356ea463220B5AE1aC56cd4C98270E8aB"; // Deployed MoneyFiController address
    const deployerAddress = "0x335145400C12958600C0542F9180e03B917F7BbB"; // Deployer address
    const otherAddress = "0x1234567890123456789012345678901234567890"; // Placeholder address for testing

    before(async function () {
        // Get signers
        [deployer, otherAccount] = await ethers.getSigners();
        console.log("Deployer address from signer:", deployer.address);

        // Connect to the deployed MoneyFiController contract
        try {
            moneyFiController = await ethers.getContractAt("MoneyFiController", proxyAddress);
            console.log("Successfully connected to MoneyFiController at:", proxyAddress);
        } catch (error) {
            console.error("Failed to connect to contract:", error.message);
            throw error;
        }
    });

    describe("Role Checks for Deployer", function () {
        it("should confirm deployer is admin", async function () {
            const isAdmin = await moneyFiController.isAdmin(deployerAddress);
            console.log(`Is ${deployerAddress} admin? ${isAdmin}`);
            expect(isAdmin, `${deployerAddress} should be admin`).to.be.true;
        });

        it("should confirm deployer is delegate admin", async function () {
            const isDelegateAdmin = await moneyFiController.isDelegateAdmin(deployerAddress);
            console.log(`Is ${deployerAddress} delegate admin? ${isDelegateAdmin}`);
            expect(isDelegateAdmin, `${deployerAddress} should be delegate admin`).to.be.true;
        });

        it("should confirm deployer is operator", async function () {
            const isOperator = await moneyFiController.isOperator(deployerAddress);
            console.log(`Is ${deployerAddress} operator? ${isOperator}`);
            expect(isOperator, `${deployerAddress} should be operator`).to.be.true;
        });

        it("should confirm deployer is signer", async function () {
            const isSigner = await moneyFiController.isSigner(deployerAddress);
            console.log(`Is ${deployerAddress} signer? ${isSigner}`);
            expect(isSigner, `${deployerAddress} should be signer`).to.be.true;
        });
    });

    describe("Role Checks for Other Address", function () {
        it("should confirm other address is not admin", async function () {
            const isAdmin = await moneyFiController.isAdmin(otherAddress);
            console.log(`Is ${otherAddress} admin? ${isAdmin}`);
            expect(isAdmin, `${otherAddress} should not be admin`).to.be.false;
        });

        it("should confirm other address is not delegate admin", async function () {
            const isDelegateAdmin = await moneyFiController.isDelegateAdmin(otherAddress);
            console.log(`Is ${otherAddress} delegate admin? ${isDelegateAdmin}`);
            expect(isDelegateAdmin, `${otherAddress} should not be delegate admin`).to.be.false;
        });

        it("should confirm other address is not operator", async function () {
            const isOperator = await moneyFiController.isOperator(otherAddress);
            console.log(`Is ${otherAddress} operator? ${isOperator}`);
            expect(isOperator, `${otherAddress} should not be operator`).to.be.false;
        });

        it("should confirm other address is not signer", async function () {
            const isSigner = await moneyFiController.isSigner(otherAddress);
            console.log(`Is ${otherAddress} signer? ${isSigner}`);
            expect(isSigner, `${otherAddress} should not be signer`).to.be.false;
        });
    });

    describe("Dynamic Role Assignment", function () {
        it("should grant OPERATOR role to otherAccount and verify", async function () {
            const operatorRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("operator"));
            try {
                await moneyFiController.connect(deployer).grantRole(operatorRole, otherAccount.address);
                console.log(`Granted OPERATOR role to ${otherAccount.address}`);
            } catch (error) {
                console.error("Failed to grant OPERATOR role:", error.message);
                throw error;
            }

            const isOperator = await moneyFiController.isOperator(otherAccount.address);
            console.log(`Is ${otherAccount.address} operator after granting? ${isOperator}`);
            expect(isOperator, `${otherAccount.address} should be operator after granting`).to.be.true;
        });
    });
});