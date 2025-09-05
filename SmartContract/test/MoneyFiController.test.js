const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("MoneyFiController", function () {
    let controller, tokenLp, erc20Mock, erc721Mock, erc1155Mock, deployer, user;

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
            ethers.ZeroAddress, // fundVault
            deployer.address, // admin
            "MoneyFi LP",
            "MFLP",
            18
        );

        // Deploy MoneyFiController
        const MoneyFiController = await ethers.getContractFactory("MoneyFiController");
        controller = await upgrades.deployProxy(
            MoneyFiController,
            [deployer.address, 100], // 1% protocol fee
            { initializer: "initialize" }
        );
    });

    it("should initialize correctly", async function () {
        expect(await controller.protocolFee()).to.equal(100);
        expect(await controller.getRoleMemberCount(await controller.DEFAULT_ADMIN_ROLE())).to.equal(1);
    });

    it("should set token info correctly for ERC20", async function () {
        const tokenInfo = {
            minDepositAmount: ethers.parseEther("1"),
            decimals: 18,
            chainId: 11155111,
            isActive: true,
            lpTokenAddress: tokenLp.address,
        };

        await controller.setTokenInfoInternal(erc20Mock.address, tokenInfo);
        const storedTokenInfo = await controller.getSupportedTokenInternalInfor(erc20Mock.address);
        expect(storedTokenInfo.minDepositAmount).to.equal(tokenInfo.minDepositAmount);
        expect(storedTokenInfo.isActive).to.equal(true);
    });

    it("should restrict setTokenInfoInternal to delegate admin", async function () {
        const tokenInfo = {
            minDepositAmount: ethers.parseEther("1"),
            decimals: 18,
            chainId: 11155111,
            isActive: true,
            lpTokenAddress: tokenLp.address,
        };

        await expect(
            controller.connect(user).setTokenInfoInternal(erc20Mock.address, tokenInfo)
        ).to.be.revertedWith("Caller is not a delegate admin");
    });

    it("should verify signature for referral", async function () {
        await controller.setRouter(deployer.address);
        await controller.setSigner(deployer.address);
        await controller.setEnableReferralSignature(true);

        const message = ethers.keccak256(
            ethers.solidityPacked(["address", "uint256", "address", "bool"], [deployer.address, 0, user.address, true])
        );
        const signature = await deployer.signMessage(ethers.getBytes(message));

        await controller.verifySignatureReferral(true, signature, user.address);
        expect(await controller.nonce()).to.equal(1);
    });
});