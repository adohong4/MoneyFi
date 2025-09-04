const { ethers, upgrades } = require("hardhat");

async function main() {
  // Lấy tài khoản triển khai
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Triển khai MoneyFiController
  const MoneyFiController = await ethers.getContractFactory("MoneyFiController");
  const protocolFee = 100; // Ví dụ: 1% (100/10000)
  const controller = await upgrades.deployProxy(
    MoneyFiController,
    [deployer.address, protocolFee], // admin_, protocolFee_
    { initializer: "initialize" }
  );
  await controller.waitForDeployment();
  const controllerAddress = await controller.getAddress();
  console.log("MoneyFiController deployed to:", controllerAddress);

  // Triển khai MoneyFiFundVault
  const MoneyFiFundVault = await ethers.getContractFactory("MoneyFiFundVault");
  const feeTo = deployer.address; // Thay bằng địa chỉ nhận phí
  const fundVault = await upgrades.deployProxy(
    MoneyFiFundVault,
    [deployer.address, controllerAddress, feeTo], // admin_, controller_, feeTo_
    { initializer: "initialize" }
  );
  await fundVault.waitForDeployment();
  const fundVaultAddress = await fundVault.getAddress();
  console.log("MoneyFiFundVault deployed to:", fundVaultAddress);

  // Triển khai MoneyFiTokenLp
  const MoneyFiTokenLp = await ethers.getContractFactory("tokens/MoneyFiTokenLp");
  const tokenLp = await upgrades.deployProxy(
    MoneyFiTokenLp,
    [fundVaultAddress, deployer.address, "MoneyFi LP Token", "MFLP", 18], // fundVault_, admin_, name_, symbol_, decimals_
    { initializer: "initialize" }
  );
  await tokenLp.waitForDeployment();
  const tokenLpAddress = await tokenLp.getAddress();
  console.log("MoneyFiTokenLp deployed to:", tokenLpAddress);

  // Triển khai MoneyFiRouter
  const MoneyFiRouter = await ethers.getContractFactory("MoneyFiRouter");
  const router = await upgrades.deployProxy(
    MoneyFiRouter,
    [deployer.address, controllerAddress, fundVaultAddress], // admin_, moneyFiController_, moneyFundVault_
    { initializer: "initialize" }
  );
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("MoneyFiRouter deployed to:", routerAddress);

  // Triển khai MoneyFiReferral (sử dụng tokenLpAddress)
  const MoneyFiReferral = await ethers.getContractFactory("MoneyFiReferral");
  const referral = await MoneyFiReferral.deploy(
    deployer.address, // signer_
    deployer.address, // remainTo_
    deployer.address, // admin_
    tokenLpAddress // Sử dụng địa chỉ của MoneyFiTokenLp
  );
  await referral.waitForDeployment();
  const referralAddress = await referral.getAddress();
  console.log("MoneyFiReferral deployed to:", referralAddress);

  // Triển khai MoneyFiAerodromeSwap
  const MoneyFiAerodromeSwap = await ethers.getContractFactory("dex/MoneyFiAerodromeSwap");
  const pool = "0xa41Bc0AFfbA7Fd420d186b84899d7ab2aC57fcD1"; // Địa chỉ pool Aerodrome
  const routerV3 = "0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5"; // Địa chỉ router V3
  const routerV2 = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43"; // Địa chỉ router V2
  const factory = "0x420DD381b31aEf6683db6B902084cB0FFECe40Da"; // Địa chỉ factory
  const aerodromeSwap = await MoneyFiAerodromeSwap.deploy(
    pool,
    routerV3,
    routerV2,
    factory,
    deployer.address // admin_
  );
  await aerodromeSwap.waitForDeployment();
  const aerodromeSwapAddress = await aerodromeSwap.getAddress();
  console.log("MoneyFiAerodromeSwap deployed to:", aerodromeSwapAddress);

  // Triển khai MoneyFiStartegyUpgradeableAerodrome
  const MoneyFiStartegyUpgradeableAerodrome = await ethers.getContractFactory("strategies/MoneyFiStartegyUpgradeableAerodrome");
  const baseToken = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0"; // Thay bằng địa chỉ USDT trên Sepolia
  const quoteToken = "0x2B0974b96511a728CA6342597471366D3444Aa2a"; // Thay bằng địa chỉ USDC trên Sepolia
  const slippageWhenSwapAsset = 50; // 0.05% slippage
  const strategy = await upgrades.deployProxy(
    MoneyFiStartegyUpgradeableAerodrome,
    [
      deployer.address, // admin_
      baseToken,
      quoteToken,
      routerAddress, // router_
      routerAddress, // crossChainRouter_
      slippageWhenSwapAsset,
      "MoneyFi Aerodrome Strategy",
      "MFAERO"
    ],
    { initializer: "initialize" }
  );
  await strategy.waitForDeployment();
  const strategyAddress = await strategy.getAddress();
  console.log("MoneyFiStartegyUpgradeableAerodrome deployed to:", strategyAddress);

  // Thiết lập các hàm cấu hình
  console.log("Setting up configurations...");

  // Gọi setRouter
  await controller.setRouter(routerAddress);
  console.log("setRouter called with:", routerAddress);

  // Gọi setTokenInfoInternal (ví dụ)
  const tokenInfo = {
    minDepositAmount: ethers.parseUnits("10", 18), // Ví dụ: 10 token
    decimals: 18,
    chainId: 11155111, // Chain ID của Sepolia
    isActive: true,
    lpTokenAddress: tokenLpAddress
  };
  await controller.setTokenInfoInternal(baseToken, tokenInfo);
  console.log("setTokenInfoInternal called for token:", baseToken);

  // Gọi setStrategyInternal (ví dụ)
  const strategyInfo = {
    isActive: true,
    // Thêm các trường khác theo struct MoneyFiControllerType.Strategy
  };
  await controller.setStrategyInternal(strategyAddress, strategyInfo);
  console.log("setStrategyInternal called for strategy:", strategyAddress);

  // Gọi setMaxPercentLiquidityStrategy (ví dụ)
  const maxPercentLiquidity = 5000; // 50%
  await controller.setMaxPercentLiquidityStrategy(baseToken, maxPercentLiquidity);
  console.log("setMaxPercentLiquidityStrategy called for token:", baseToken);

  // Gọi setMaxDepositValue (ví dụ)
  const maxDepositValue = ethers.parseUnits("1000", 18); // 1000 token
  await controller.setMaxDepositValue(baseToken, maxDepositValue);
  console.log("setMaxDepositValue called for token:", baseToken);

  // Gọi addInternalSwap (ví dụ)
  const internalSwapParam = {
    isActive: true,
    // Thêm các trường khác theo struct MoneyFiControllerType.InternalSwapParam
  };
  await controller.setDexInternalSwap(internalSwapParam, aerodromeSwapAddress);
  console.log("setDexInternalSwap called for swap:", aerodromeSwapAddress);

  // Gọi addCrossChainSwap (ví dụ)
  const crossChainParam = {
    isActive: true,
    typeDex: 1 // Ví dụ: typeDex
  };
  await controller.setCrossChainSwapInternal(crossChainParam, routerAddress);
  console.log("setCrossChainSwapInternal called for router:", routerAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });