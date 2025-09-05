const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("MoneyFiRouter", function () {
    let router, controller, fundVault, tokenLp, erc20Mock, erc721Mock, erc1155Mock, deployer, user;

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

        // Deploy MoneyFiRouter
        const MoneyFiRouter = await ethers.getContractFactory("MoneyFiRouter");
        router = await upgrades.deployProxy(
            MoneyFiRouter,
            [deployer.address, controller.address, fundVault.address],
            { initializer: "initialize" }
        );

        // Set router in controller
        await controller.setRouter(router.address);

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
        await erc20Mock.connect(user).approve(router.address, depositAmount);

        const depositParam = {
            tokenAddress: erc20Mock.address,
            amount: depositAmount,
        };

        await router.connect(user).depositFund(depositParam);
        const depositInfo = await fundVault.getUserDepositInfor(erc20Mock.address, user.address);
        expect(depositInfo.currentDepositAmount).to.equal(depositAmount);
    });

    it("should restrict withdraw to cooldown period", async function () {
        await router.setCoolDownPeriodWithdrawRequest(3600); // 1 hour
        const withdrawParam = [
            {
                strategyAddress: ethers.ZeroAddress,
                share: 0,
            },
        ];
        const unDistributedWithdraw = [
            {
                tokenAddress: erc20Mock.address,
                unDistributedAmount: ethers.parseEther("10"),
            },
        ];

        await expect(
            router.connect(user).withdrawFundSameChain(withdrawParam, unDistributedWithdraw, false, "0x", {
                swapImpl: ethers.ZeroAddress,
                tokenReceive: ethers.ZeroAddress,
                amountOutMin: 0,
                externalCallData: "0x",
                isV3: false,
            })
        ).to.be.revertedWith("WithdrawRateLimit");
    });
});