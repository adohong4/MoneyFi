const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy MoneyFiTokenLp
  const MoneyFiTokenLp = await ethers.getContractFactory("MoneyFiTokenLp");
  const tokenLp = await upgrades.deployProxy(
    MoneyFiTokenLp,
    [
      ethers.constants.AddressZero, // fundVault sẽ được cập nhật sau
      deployer.address, // admin
      "MoneyFi LP Token",
      "MFLP",
      18 // decimals
    ],
    { initializer: "initialize" }
  );
  await tokenLp.deployed();
  console.log("MoneyFiTokenLp deployed to:", tokenLp.address);

  // Deploy MoneyFiController
  const MoneyFiController = await ethers.getContractFactory("MoneyFiController");
  const controller = await upgrades.deployProxy(
    MoneyFiController,
    [deployer.address, 100], // admin, protocolFee (1%)
    { initializer: "initialize" }
  );
  await controller.deployed();
  console.log("MoneyFiController deployed to:", controller.address);

  // Deploy MoneyFiFundVault
  const MoneyFiFundVault = await ethers.getContractFactory("MoneyFiFundVault");
  const fundVault = await upgrades.deployProxy(
    MoneyFiFundVault,
    [deployer.address, controller.address, deployer.address], // admin, controller, feeTo
    { initializer: "initialize" }
  );
  await fundVault.deployed();
  console.log("MoneyFiFundVault deployed to:", fundVault.address);

  // Update MoneyFiTokenLp with FundVault address
  await tokenLp.setFundVault(fundVault.address);
  console.log("MoneyFiTokenLp updated with FundVault:", fundVault.address);

  // Deploy MoneyFiReferral
  const MoneyFiReferral = await ethers.getContractFactory("MoneyFiReferral");
  const referral = await MoneyFiReferral.deploy(
    deployer.address, // signer
    deployer.address, // remainTo
    deployer.address, // admin
    "0xYOUR_TOKEN_ADDRESS" // Thay bằng địa chỉ token ERC20 (ví dụ: USDC trên Sepolia)
  );
  await referral.deployed();
  console.log("MoneyFiReferral deployed to:", referral.address);

  // Deploy MoneyFiRouter
  const MoneyFiRouter = await ethers.getContractFactory("MoneyFiRouter");
  const router = await upgrades.deployProxy(
    MoneyFiRouter,
    [deployer.address, controller.address, fundVault.address], // admin, controller, fundVault
    { initializer: "initialize" }
  );
  await router.deployed();
  console.log("MoneyFiRouter deployed to:", router.address);

  // Deploy MoneyFiCrossChainRouter
  const MoneyFiCrossChainRouter = await ethers.getContractFactory("MoneyFiCrossChainRouter");
  const crossChainRouter = await upgrades.deployProxy(
    MoneyFiCrossChainRouter,
    [deployer.address, controller.address, fundVault.address], // admin, controller, fundVault
    { initializer: "initialize" }
  );
  await crossChainRouter.deployed();
  console.log("MoneyFiCrossChainRouter deployed to:", crossChainRouter.address);

  // Cập nhật router và crossChainRouter trong MoneyFiController
  await controller.setRouter(router.address);
  await controller.setCrossChainRouter(crossChainRouter.address);
  console.log("Router and CrossChainRouter set in MoneyFiController");

  // Cập nhật token info trong MoneyFiController
  const tokenInfo = {
    minDepositAmount: ethers.utils.parseEther("1"),
    decimals: 18,
    chainId: 11155111, // Sepolia chain ID
    isActive: true,
    lpTokenAddress: tokenLp.address,
  };
  await controller.setTokenInfoInternal("0xYOUR_TOKEN_ADDRESS", tokenInfo); // Thay bằng địa chỉ token
  console.log("Token info set in MoneyFiController");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });