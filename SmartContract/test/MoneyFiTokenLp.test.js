const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("MoneyFiTokenLp", function () {
    let tokenLp, fundVault, erc20Mock, deployer, user;

    beforeEach(async function () {
        [deployer, user] = await ethers.getSigners();

        // Deploy ERC20Mock
        const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
        erc20Mock = await ERC20Mock.deploy("Mock Token", "MTK", 18);

        // Deploy MoneyFiFundVault
        const MoneyFiFundVault = await ethers.getContractFactory("MoneyFiFundVault");
        fundVault = await upgrades.deployProxy(
            MoneyFiFundVault,
            [deployer.address, ethers.ZeroAddress, deployer.address],
            { initializer: "initialize" }
        );

        // Deploy MoneyFiTokenLp as a regular contract
        const MoneyFiTokenLp = await ethers.getContractFactory("MoneyFiTokenLp");
        tokenLp = await MoneyFiTokenLp.deploy(
            fundVault.address,
            deployer.address,
            "MoneyFi LP",
            "MFLP",
            18
        );
    });

    it("should mint tokens correctly", async function () {
        const mintAmount = ethers.parseEther("100");
        await tokenLp.connect(fundVault.address).mint(user.address, mintAmount);
        expect(await tokenLp.balanceOf(user.address)).to.equal(mintAmount);
    });

    it("should restrict mint to fundVault", async function () {
        const mintAmount = ethers.parseEther("100");
        await expect(tokenLp.connect(user).mint(user.address, mintAmount)).to.be.revertedWith("InvalidFundVault");
    });

    it("should burn tokens correctly", async function () {
        const mintAmount = ethers.parseEther("100");
        await tokenLp.connect(fundVault.address).mint(user.address, mintAmount);
        await tokenLp.connect(fundVault.address).burn(user.address, mintAmount);
        expect(await tokenLp.balanceOf(user.address)).to.equal(0);
    });
});