const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MoneyFiReferral", function () {
    let referral, erc20Mock, deployer, user;

    beforeEach(async function () {
        [deployer, user] = await ethers.getSigners();

        // Deploy ERC20Mock
        const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
        erc20Mock = await ERC20Mock.deploy("Mock Token", "MTK", 18);

        // Deploy MoneyFiReferral
        const MoneyFiReferral = await ethers.getContractFactory("MoneyFiReferral");
        referral = await MoneyFiReferral.deploy(
            deployer.address, // signer
            deployer.address, // remainTo
            deployer.address, // admin
            erc20Mock.address // token
        );
    });

    it("should deposit token correctly", async function () {
        const depositAmount = ethers.parseEther("100");
        await erc20Mock.mint(user.address, depositAmount);
        await erc20Mock.connect(user).approve(referral.address, depositAmount);

        await referral.connect(user).deposit(depositAmount);
        expect(await erc20Mock.balanceOf(referral.address)).to.equal(depositAmount);
    });

    it("should claim with valid signature", async function () {
        const claimAmount = ethers.parseEther("50");
        await erc20Mock.mint(referral.address, claimAmount);

        const message = ethers.keccak256(
            ethers.solidityPacked(["address", "uint256", "address", "uint256"], [deployer.address, 0, user.address, claimAmount])
        );
        const signature = await deployer.signMessage(ethers.getBytes(message));

        await referral.connect(user).claim(claimAmount, signature);
        expect(await erc20Mock.balanceOf(user.address)).to.equal(claimAmount);
        expect(await referral.nonce()).to.equal(1);
    });

    it("should revert with invalid signature", async function () {
        const claimAmount = ethers.parseEther("50");
        await erc20Mock.mint(referral.address, claimAmount);

        const message = ethers.keccak256(
            ethers.solidityPacked(["address", "uint256", "address", "uint256"], [deployer.address, 0, user.address, claimAmount])
        );
        const invalidSignature = await user.signMessage(ethers.getBytes(message));

        await expect(referral.connect(user).claim(claimAmount, invalidSignature)).to.be.revertedWith("InvalidSignature");
    });
});