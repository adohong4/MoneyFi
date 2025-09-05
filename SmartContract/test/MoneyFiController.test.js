const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("MoneyFiController", function () {
    let controller, tokenLp, deployer, user;

    beforeEach(async function () {
        [deployer, user] = await ethers.getSigners();

        // Deploy MoneyFiTokenLp
        const MoneyFiTokenLp = await ethers.getContractFactory("MoneyFiTokenLp");
        tokenLp = await upgrades.deployProxy(
            MoneyFiTokenLp,
            [ethers.ZeroAddress, deployer.address, "MoneyFi LP", "MFLP", 18], // Use ethers.ZeroAddress
            { initializer: "initialize" }
        );
        await tokenLp.deployed();

        // Deploy MoneyFiController
        const MoneyFiController = await ethers.getContractFactory("MoneyFiController");
        controller = await upgrades.deployProxy(
            MoneyFiController,
            [deployer.address, 100], // 1% protocol fee
            { initializer: "initialize" }
        );
        await controller.deployed();
    });

    it("should initialize correctly", async function () {
        expect(await controller.protocolFee()).to.equal(100);
        expect(await controller.getRoleMemberCount(await controller.DEFAULT_ADMIN_ROLE())).to.equal(1);
    });

    it("should set token info correctly", async function () {
        const tokenInfo = {
            minDepositAmount: ethers.utils.parseEther("1"),
            decimals: 18,
            chainId: 11155111,
            isActive: true,
            lpTokenAddress: tokenLp.address,
        };

        await controller.setTokenInfoInternal(ethers.ZeroAddress, tokenInfo); // Use ethers.ZeroAddress
        const storedTokenInfo = await controller.getSupportedTokenInternalInfor(ethers.ZeroAddress); // Use ethers.ZeroAddress
        expect(storedTokenInfo.minDepositAmount).to.equal(tokenInfo.minDepositAmount);
        expect(storedTokenInfo.isActive).to.equal(true);
    });

    it("should restrict setTokenInfoInternal to delegate admin", async function () {
        const tokenInfo = {
            minDepositAmount: ethers.utils.parseEther("1"),
            decimals: 18,
            chainId: 11155111,
            isActive: true,
            lpTokenAddress: tokenLp.address,
        };

        await expect(
            controller.connect(user).setTokenInfoInternal(ethers.ZeroAddress, tokenInfo) // Use ethers.ZeroAddress
        ).to.be.revertedWith("Caller is not a delegate admin");
    });

    it("should verify signature for referral", async function () {
        await controller.setRouter(deployer.address);
        await controller.setSigner(deployer.address);
        await controller.setEnableReferralSignature(true);

        const message = ethers.utils.keccak256(
            ethers.utils.solidityPack(["address", "uint256", "address", "bool"], [deployer.address, 0, user.address, true])
        );
        const signature = await deployer.signMessage(ethers.utils.arrayify(message));

        await controller.verifySignatureReferral(true, signature, user.address);
        expect(await controller.nonce()).to.equal(1);
    });
});