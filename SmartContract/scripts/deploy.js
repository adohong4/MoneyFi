const { ethers, upgrades } = require("hardhat");

async function main() {
  const [admin, operator] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", admin.address);

  // Deploy MoneyFiController
  const MoneyFiController = await ethers.getContractFactory("MoneyFiController");
  const controller = await upgrades.deployProxy(
    MoneyFiController,
    [admin.address, ethers.utils.parseEther("0.01")], // admin_, protocolFee_ (1% = 100 / 10_000)
    { initializer: "initialize", kind: "uups" }
  );
  await controller.deployed();
  console.log("MoneyFiController deployed to:", controller.address);

  // Deploy MoneyFiFundVault
  const MoneyFiFundVault = await ethers.getContractFactory("MoneyFiFundVault");
  const fundVault = await upgrades.deployProxy(
    MoneyFiFundVault,
    [admin.address, controller.address, admin.address], // admin_, controller_, feeTo_
    { initializer: "initialize", kind: "uups" }
  );
  await fundVault.deployed();
  console.log("MoneyFiFundVault deployed to:", fundVault.address);

  // Deploy MoneyFiTokenLp
  const MoneyFiTokenLp = await ethers.getContractFactory("MoneyFiTokenLp");
  const tokenLp = await upgrades.deployProxy(
    MoneyFiTokenLp,
    [fundVault.address, admin.address, "MoneyFi LP Token", "MFLP", 18], // fundVault_, admin_, name_, symbol_, decimals_
    { initializer: "initialize", kind: "uups" }
  );
  await tokenLp.deployed();
  console.log("MoneyFiTokenLp deployed to:", tokenLp.address);

  // Deploy MoneyFiReferral
  const MoneyFiReferral = await ethers.getContractFactory("MoneyFiReferral");
  const referral = await MoneyFiReferral.deploy(
    admin.address,
    admin.address,
    admin.address,
    ethers.constants.AddressZero // Thay bằng địa chỉ token thật nếu cần
  );
  await referral.deployed();
  console.log("MoneyFiReferral deployed to:", referral.address);

  // Deploy MoneyFiRouter
  const MoneyFiRouter = await ethers.getContractFactory("MoneyFiRouter");
  const router = await upgrades.deployProxy(
    MoneyFiRouter,
    [admin.address, controller.address, fundVault.address], // admin_, moneyFiController_, moneyFundVault_
    { initializer: "initialize", kind: "uups" }
  );
  await router.deployed();
  console.log("MoneyFiRouter deployed to:", router.address);

  // Deploy MoneyFiCrossChainRouter
  const MoneyFiCrossChainRouter = await ethers.getContractFactory("MoneyFiCrossChainRouter");
  const crossChainRouter = await upgrades.deployProxy(
    MoneyFiCrossChainRouter,
    [admin.address, controller.address, fundVault.address], // admin_, moneyFiController_, moneyFundVault_
    { initializer: "initialize", kind: "uups" }
  );
  await crossChainRouter.deployed();
  console.log("MoneyFiCrossChainRouter deployed to:", crossChainRouter.address);

  // Thiết lập router và crossChainRouter trong MoneyFiController
  await controller.setRouter(router.address);
  await controller.setCrossChainRouter(crossChainRouter.address);
  console.log("Router and CrossChainRouter set in MoneyFiController");

  // Thiết lập signer và hot wallet
  await controller.setSigner(admin.address);
  await controller.setHotWallet(admin.address);
  console.log("Signer and HotWallet set in MoneyFiController");

  // Thiết lập token info (ví dụ)
  await controller.setTokenInfoInternal(ethers.constants.AddressZero, {
    minDepositAmount: ethers.utils.parseEther("1"),
    decimals: 18,
    chainId: 11155111, // Sepolia chainId
    isActive: true,
    lpTokenAddress: tokenLp.address,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });