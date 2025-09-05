const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("MoneyFiFundVault", function () {
    let fundVault, controller, tokenLp, erc20Mock, erc721Mock, erc1155Mock, deployer, user;

    beforeEach(async function () {
        [deployer, user] = await ethers.getSigners();

        // Deploy Mock Tokens
        const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
        erc20Mock = await ERC20Mock.deploy("Mock Token", "MTK", 18);

        const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
        erc721Mock = await ERC721Mock.deploy("Mock NFT", "MNFT");

        const ERC1155Mock = await ethers.getContractFactory("ERC1155Mock");
        erc1155Mock = await ERC1155Mock.deploy();

        // Deploy MoneyFiTokenLp as a regular contract
        const MoneyFiTokenLp = await ethers.getContractFactory("MoneyFiTokenLp");
        tokenLp = await MoneyFiTokenLp.deploy(
            ethers.ZeroAddress,
            deployer.address,
            "MoneyFi LP",
            "MFLP",
            18
        );

        // Deploy MoneyFiController
        const MoneyFiController = await ethers.getContractFactory("MoneyFiController");
        controller = await upgrades.deployProxy(
            MoneyFiController,
            [deployer.address, 100],
            { initializer: "initialize" }
        );

        // Deploy MoneyFiFundVault
        const MoneyFiFundVault = await ethers.getContractFactory("MoneyFiFundVault");
        fundVault = await upgrades.deployProxy(
            MoneyFiFundVault,
            [deployer.address, controller.address, deployer.address],
            { initializer: "initialize" }
        );

        // Update MoneyFiTokenLp with FundVault address
        await tokenLp.setFundVault(fundVault.address);

        // Set token info in controller
        const tokenInfo = {
            minDepositAmount: ethers.parseEther("1"),
            decimals: 18,
            chainId: 11155111,
            isActive: true,
            lpTokenAddress: tokenLp.address,
        };
        await controller.setTokenInfoInternal(erc20Mock.address, tokenInfo);
    });

    it("should deposit fund correctly with ERC20", async function () {
        const depositAmount = ethers.parseEther("100");
        await erc20Mock.mint(user.address, depositAmount);
        await erc20Mock.connect(user).approve(fundVault.address, depositAmount);

        await fundVault.connect(user).depositFund(erc20Mock.address, user.address, depositAmount);
        const depositInfo = await fundVault.getUserDepositInfor(erc20Mock.address, user.address);
        expect(depositInfo.currentDepositAmount).to.equal(depositAmount);
        expect(await tokenLp.balanceOf(user.address)).to.equal(depositAmount);
    });

    it("should revert if deposit amount is below minimum", async function () {
        const depositAmount = ethers.parseEther("0.5");
        await erc20Mock.mint(user.address, depositAmount);
        await erc20Mock.connect(user).approve(fundVault.address, depositAmount);

        await expect(
            fundVault.connect(user).depositFund(erc20Mock.address, user.address, depositAmount)
        ).to.be.revertedWith("InvalidAmount");
    });

    it("should withdraw protocol fee correctly", async function () {
        const feeAmount = ethers.parseEther("10");
        await erc20Mock.mint(fundVault.address, feeAmount);
        await fundVault.increaseProtocolAndReferralFee(erc20Mock.address, feeAmount, 0);

        await fundVault.withdrawProtocolFee([erc20Mock.address]);
        expect(await erc20Mock.balanceOf(deployer.address)).to.equal(ethers.parseEther("1000000").add(feeAmount));
    });

    it("should handle ERC721 deposit (if applicable)", async function () {
        await erc721Mock.mint(user.address);
        expect(await erc721Mock.ownerOf(1)).to.equal(user.address);
    });

    it("should handle ERC1155 deposit (if applicable)", async function () {
        await erc1155Mock.mint(user.address, 1, 100, "0x");
        expect(await erc1155Mock.balanceOf(user.address, 1)).to.equal(100);
    });
});