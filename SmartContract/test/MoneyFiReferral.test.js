const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("MoneyFiReferral Deployment", function () {
    let deployer, user;
    let referral, tokenAddress;

    beforeEach(async function () {
        [deployer, user] = await ethers.getSigners();
        tokenAddress = "0xF3F2b4815A58152c9BE53250275e8211163268BA"; // USDT trên Sepolia
        const MoneyFiReferral = await ethers.getContractFactory("MoneyFiReferral");
        referral = await upgrades.deployProxy(
            MoneyFiReferral,
            [deployer.address, deployer.address, deployer.address, tokenAddress],
            { initializer: "initialize" }
        );
        await referral.waitForDeployment();
    });

    it("Should deploy proxy successfully", async function () {
        expect(await referral.getAddress()).to.be.properAddress;
    });

    it("Should initialize with correct values", async function () {
        expect(await referral.signer()).to.equal(deployer.address);
        expect(await referral.remainTo()).to.equal(deployer.address);
        expect(await referral.token()).to.equal(tokenAddress);
        expect(await referral.isActive()).to.equal(true);
        expect(await referral.isAdmin(deployer.address)).to.equal(true);
    });

    it("Should revert if initialized again", async function () {
        await expect(
            referral.initialize(deployer.address, deployer.address, deployer.address, tokenAddress)
        ).to.be.revertedWith("Initializable: contract is already initialized");
    });
});