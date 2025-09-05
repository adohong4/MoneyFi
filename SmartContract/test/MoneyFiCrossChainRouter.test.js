const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("MoneyFiCrossChainRouter", function () {
    let crossChainRouter, controller, fundVault, tokenLp, erc20Mock, erc721Mock, erc1155Mock, deployer, user;

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

        // Deploy MoneyFiCrossChainRouter
        const MoneyFiCrossChainRouter = await ethers.getContractFactory("MoneyFiCrossChainRouter");
        crossChainRouter = await upgrades.deployProxy(
            MoneyFiCrossChainRouter,
            [deployer.address, controller.address, fundVault.address],
            { initializer: "initialize" }
        );

        // Set crossChainRouter in controller
        await controller.setCrossChainRouter(crossChainRouter.address);

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

    it("should set whitelist hot wallet correctly", async function () {
        await crossChainRouter.setWhiteListHotWallet(user.address, true);
        expect(await crossChainRouter.isWhiteListHotWallet(user.address)).to.equal(true);
    });

    it("should revert if hot wallet is not whitelisted", async function () {
        const withdrawParam = [
            {
                tokenIn: erc20Mock.address,
                withdrawStrategySameChains: [],
                unDistributedWithdraw: { tokenAddress: erc20Mock.address, unDistributedAmount: ethers.parseEther("10") },
                uuid: "test-uuid",
            },
        ];
        const additionParam = {
            depositor: user.address,
            hotWallet: ethers.ZeroAddress,
            tokenOut: erc20Mock.address,
            withdrawFee: 0,
            isReferral: false,
            destinationChainId: 11155111,
        };

        await expect(
            crossChainRouter.connect(deployer).withdrawFundCrossChainFromOperatorHotWallet(withdrawParam, additionParam)
        ).to.be.revertedWith("InvalidHotWallet");
    });
});