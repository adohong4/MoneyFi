const { ethers, upgrades } = require("hardhat");

async function main() {
  // Lấy tài khoản triển khai
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Lấy các factory hợp đồng
  const MoneyFiController = await ethers.getContractFactory("MoneyFiController");
  const MoneyFiFundVault = await ethers.getContractFactory("MoneyFiFundVault");
  const MoneyFiCrossChainRouter = await ethers.getContractFactory("MoneyFiCrossChainRouter");
  const MoneyFiReferral = await ethers.getContractFactory("MoneyFiReferral");
  const MoneyFiRouter = await ethers.getContractFactory("MoneyFiRouter");
  const MoneyFiTokenLp = await ethers.getContractFactory("MoneyFiTokenLp");
  const MoneyFiUniSwap = await ethers.getContractFactory("MoneyFiUniSwap");
  const MoneyFiStartegyUpgradeableAerodrome = await ethers.getContractFactory("MoneyFiStartegyUpgradeableAerodrome");

  // Định nghĩa các tham số khởi tạo
  const admin = deployer.address; // Admin là tài khoản triển khai
  const protocolFee = ethers.parseUnits("100", 0); // 1% (100/10000)
  const feeTo = deployer.address; // Địa chỉ nhận phí
  const tokenAddress = "0xF3F2b4815A58152c9BE53250275e8211163268BA"; // Địa chỉ USDT trên Sepolia
  const qouteToken = "0xF3F2b4815A58152c9BE53250275e8211163268BA"; // USDC trên Sepolia
  const baseToken = "0xF3F2b4815A58152c9BE53250275e8211163268BA"; // USDT trên Sepolia
  const slippageWhenSwapAsset = 50; // 0.05% slippage
  const uniswapV3Router = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; // Uniswap V3 Router trên Sepolia
  const uniswapV2Router = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router trên Sepolia
  const uniswapV3Factory = "0x1F98431c8aD98523631AE4a59f267346ea31F984"; // Uniswap V3 Factory trên Sepolia
  const uniswapV2Factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; // Uniswap V2 Factory trên Sepolia

  // Triển khai MoneyFiController
  console.log("Deploying MoneyFiController...");
  const controller = await upgrades.deployProxy(
    MoneyFiController,
    [admin, protocolFee],
    { initializer: "initialize" }
  );
  await controller.waitForDeployment();
  console.log("MoneyFiController deployed to:", await controller.getAddress());

  // Triển khai MoneyFiFundVault
  console.log("Deploying MoneyFiFundVault...");
  const fundVault = await upgrades.deployProxy(
    MoneyFiFundVault,
    [admin, await controller.getAddress(), feeTo],
    { initializer: "initialize" }
  );
  await fundVault.waitForDeployment();
  console.log("MoneyFiFundVault deployed to:", await fundVault.getAddress());

  // Triển khai MoneyFiRouter
  console.log("Deploying MoneyFiRouter...");
  const router = await upgrades.deployProxy(
    MoneyFiRouter,
    [admin, await controller.getAddress(), await fundVault.getAddress()],
    { initializer: "initialize" }
  );
  await router.waitForDeployment();
  console.log("MoneyFiRouter deployed to:", await router.getAddress());

  // Triển khai MoneyFiCrossChainRouter
  console.log("Deploying MoneyFiCrossChainRouter...");
  const crossChainRouter = await upgrades.deployProxy(
    MoneyFiCrossChainRouter,
    [admin, await controller.getAddress(), await fundVault.getAddress()],
    { initializer: "initialize" }
  );
  await crossChainRouter.waitForDeployment();
  console.log("MoneyFiCrossChainRouter deployed to:", await crossChainRouter.getAddress());

  // Triển khai MoneyFiTokenLp
  console.log("Deploying MoneyFiTokenLp...");
  const tokenLp = await upgrades.deployProxy(
    MoneyFiTokenLp,
    [await fundVault.getAddress(), admin, "MoneyFi LP Token", "MFLP", 18],
    { initializer: "initialize" }
  );
  await tokenLp.waitForDeployment();
  console.log("MoneyFiTokenLp deployed to:", await tokenLp.getAddress());

  // Triển khai MoneyFiReferral
  console.log("Deploying MoneyFiReferral...");
  const referral = await MoneyFiReferral.deploy(admin, admin, admin, tokenAddress);
  await referral.waitForDeployment();
  console.log("MoneyFiReferral deployed to:", await referral.getAddress());

  // Triển khai MoneyFiUniSwap
  console.log("Deploying MoneyFiUniSwap...");
  const uniSwap = await MoneyFiUniSwap.deploy(
    uniswapV3Router,
    uniswapV2Router,
    uniswapV3Factory,
    uniswapV2Factory,
    admin
  );
  await uniSwap.waitForDeployment();
  console.log("MoneyFiUniSwap deployed to:", await uniSwap.getAddress());

  // Triển khai MoneyFiStartegyUpgradeableAerodrome
  console.log("Deploying MoneyFiStartegyUpgradeableAerodrome...");
  const strategy = await upgrades.deployProxy(
    MoneyFiStartegyUpgradeableAerodrome,
    [
      admin,
      baseToken,
      qouteToken,
      await router.getAddress(),
      await crossChainRouter.getAddress(),
      slippageWhenSwapAsset,
      "MoneyFi Aerodrome Strategy",
      "MFAS"
    ],
    { initializer: "initialize" }
  );
  await strategy.waitForDeployment();
  console.log("MoneyFiStartegyUpgradeableAerodrome deployed to:", await strategy.getAddress());

  // Cấu hình Controller
  console.log("Configuring MoneyFiController...");
  await controller.setRouter(await router.getAddress());
  await controller.setCrossChainRouter(await crossChainRouter.getAddress());
  await controller.setSigner(admin);
  await controller.setTokenInfoInternal(tokenAddress, {
    minDepositAmount: ethers.parseUnits("10", 6), // Ví dụ: 10 USDT
    decimals: 6,
    chainId: 11155111, // Chain ID của Sepolia
    isActive: true,
    lpTokenAddress: await tokenLp.getAddress()
  });
  await controller.setStrategyInternal(await strategy.getAddress(), {
    isActive: true
  });

  console.log("Deployment completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


// npx hardhat run scripts/deployMoneyFiController.js --network sepolia
// npx hardhat run scripts/deployMoneyFiFundVault.js --network sepolia
// npx hardhat run scripts/deployMoneyFiRouter.js --network sepolia
// npx hardhat run scripts/deployMoneyFiCrossChainRouter.js --network sepolia
// npx hardhat run scripts/tokens/deployMoneyFiTokenLp.js --network sepolia
// npx hardhat run scripts/deployMoneyFiReferral.js --network sepolia
// npx hardhat run scripts/dex/deployMoneyFiUniSwap.js --network sepolia
// npx hardhat run scripts/deployMoneyFiStartegyUpgradeableAerodrome.js --network sepolia
// npx hardhat run scripts/configureContracts.js --network sepolia