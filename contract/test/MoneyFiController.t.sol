// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { MoneyFiRouter } from "../../src/MoneyFiRouter.sol";
import { MoneyFiFundVault } from "../../src/MoneyFiFundVault.sol";
import { MoneyFiController } from "../../src/MoneyFiController.sol";
import { MoneyFiCrossChainRouter } from "../../src/MoneyFiCrossChainRouter.sol";
import { BaseTest } from "../Base.t.sol";
import { ERC20Mock } from "../mocks/ERC20Mock.sol";
import { MoneyFiControllerType } from "../../src/types/ControllerDataType.sol";
import { MoneyFiFundVaultType } from "../../src/types/FundVaultDataType.sol";
import { MoneyFiStartegyUpgradeableLocal } from "../../src/strategies/MoneyFiStartegyUpgradeableLocal.sol";
import { MoneyFiStargateCrossChainRouterType, RouterCommonType } from "../../src/types/RouterDataType.sol";
import { MoneyFiUniSwap } from "../../src/dex/MoneyFiUniSwap.sol";
import { IMoneyFiCrossChainRouter } from "../../src/interfaces/IMoneyFiCrossChainRouter.sol";
import { IMoneyFiRouter } from "../../src/interfaces/IMoneyFiRouter.sol";
import { IMoneyFiFundVault } from "../../src/interfaces/IMoneyFiFundVault.sol";

contract MoneyFiControllerTest is BaseTest {
    using Math for uint256;
    using SafeERC20 for ERC20;

    string public forkUrl = vm.envString("BASE_MAINNET_JSON_RPC");

    MoneyFiFundVault internal fundVaultLocal;
    MoneyFiController internal controllerLocal;
    MoneyFiRouter internal routerLocal;
    MoneyFiStartegyUpgradeableLocal internal strategyLocal1;
    RouterCommonType.WithdrawStrategySameChain[] withdrawStrategySameChains;
    uint256 protocolFeePercent;
    uint256 minimalDepositAmount;
    uint256 initBalance;

    function setUp() public {
        protocolFeePercent = 1000;
        minimalDepositAmount = 100e6;
        vm.selectFork(vm.createFork(forkUrl));
        usdt = ERC20(vm.envAddress("BASE_TOKEN_USDT_ADDRESS"));
        usdc = ERC20(vm.envAddress("BASE_TOKEN_USDC_ADDRESS"));

        // Use usdt for deafult asset token
        (address fundVault, address controller, address router, address crossChainRouter, address strategy1, address mUsd) =
            _deployFundVaultLocal(users.admin, users.admin, address(usdt), protocolFeePercent);
        fundVaultLocal = MoneyFiFundVault(payable(fundVault));
        controllerLocal = MoneyFiController(payable(controller));
        routerLocal = MoneyFiRouter(payable(router));
        strategyLocal1 = MoneyFiStartegyUpgradeableLocal(strategy1);
        initBalance = 1_000_000e6;

        //Mint token user1
        vm.startPrank(users.alice);
        _dealToken(address(usdt), users.alice, initBalance);
        _dealToken(address(usdc), users.alice, initBalance);
    }

    function test_setProtocolFee_shoudRight() public {
        uint256 protocolFee = 100;

        vm.startPrank(users.admin);
        controllerLocal.setProtocolFee(protocolFee);
        vm.stopPrank();

        assertEq(controllerLocal.protocolFee(), protocolFee);
    }

    function test_setRouter_shoudldRight() public {
        vm.startPrank(users.admin);
        controllerLocal.setRouter(address(routerLocal));
        vm.stopPrank();

        assertEq(controllerLocal.router(), address(routerLocal));
    }

    function test_upgradeable_storgate_shouldRight() public {
        uint256 preProtocolFee = controllerLocal.protocolFee();
        address preRouter = controllerLocal.router();
        MoneyFiControllerType.TokenInfo memory preTokenInfor = controllerLocal.getSupportedTokenInternalInfor(address(usdt));
        uint256 preMaxPercentLiquidityStrategy = controllerLocal.maxPercentLiquidityStrategyToken(address(usdt));
        uint256 preMaxDepositValue = controllerLocal.maxDepositValueToken(address(usdt));

        MoneyFiController newControllerLocal = new MoneyFiController();

        vm.startPrank(users.admin);
        MoneyFiController(address(controllerLocal)).upgradeToAndCall(address(newControllerLocal), "");
        vm.stopPrank();

        uint256 posProtocolFee = controllerLocal.protocolFee();
        address posRouter = controllerLocal.router();
        MoneyFiControllerType.TokenInfo memory posTokenInfor = controllerLocal.getSupportedTokenInternalInfor(address(usdt));
        uint256 posMaxPercentLiquidityStrategy = controllerLocal.maxPercentLiquidityStrategyToken(address(usdt));
        uint256 posMaxDepositValue = controllerLocal.maxDepositValueToken(address(usdt));

        assertEq(preProtocolFee, posProtocolFee);
        assertEq(preRouter, posRouter);
        assertEq(preMaxPercentLiquidityStrategy, posMaxPercentLiquidityStrategy);
        assertEq(preMaxDepositValue, posMaxDepositValue);
        assertEq(preTokenInfor.minDepositAmount, posTokenInfor.minDepositAmount);
    }

    function test_upgradeable_storgate_deployed_contract_shouldRight() public {
        // address moneyFiDeployedControllerAddress = vm.envAddress("MONEY_FI_CONTROLLER");
        // address rootAdmin = vm.envAddress("ROOT_ADMIN");

        uint256 maxDepositVault = 30_000e6;
        uint256 maxPercentLiquidity = 40_000;
        uint256 referralFee = 100;

        // controllerLocal = MoneyFiController(moneyFiDeployedControllerAddress);
        uint256 preProtocolFee = controllerLocal.protocolFee();
        address preRouter = controllerLocal.router();
        MoneyFiControllerType.TokenInfo memory preTokenInfor = controllerLocal.getSupportedTokenInternalInfor(address(usdt));

        MoneyFiController newControllerLocal = new MoneyFiController();

        vm.startPrank(users.admin);
        MoneyFiController(address(controllerLocal)).upgradeToAndCall(address(newControllerLocal), "");
        vm.stopPrank();

        address posRouter = controllerLocal.router();
        MoneyFiControllerType.TokenInfo memory posTokenInfor = controllerLocal.getSupportedTokenInternalInfor(address(usdt));

        {
            vm.startPrank(users.admin);
            controllerLocal.setMaxDepositValue(address(usdt), maxDepositVault);
            controllerLocal.setMaxDepositValue(address(usdc), maxDepositVault);
            controllerLocal.setMaxPercentLiquidityStrategyToken(address(usdt), maxPercentLiquidity);
            controllerLocal.setProtocolFee(preProtocolFee);
            controllerLocal.setReferralFee(referralFee);
            vm.stopPrank();
        }

        // Test new feature
        uint256 posMaxPercentLiquidityStrategy = controllerLocal.maxPercentLiquidityStrategyToken(address(usdt));
        uint256 posMaxDepositValue = controllerLocal.maxDepositValueToken(address(usdt));
        uint256 posProtocolFee = controllerLocal.protocolFee();
        uint256 posReferralFee = controllerLocal.referralFee();

        assertEq(preProtocolFee, posProtocolFee);
        assertEq(preRouter, posRouter);
        assertEq(maxDepositVault, posMaxDepositValue);
        assertEq(maxPercentLiquidity, posMaxPercentLiquidityStrategy);
        assertEq(preTokenInfor.minDepositAmount, posTokenInfor.minDepositAmount);
        assertEq(posReferralFee, referralFee);

        {
            // Test old feature
            vm.startPrank(users.admin);
            address newStrategy = address(10);
            address newToken = address(11);

            controllerLocal.setStrategyInternal(
                newStrategy, MoneyFiControllerType.Strategy({ name: "vault mock", isActive: true, chainId: 1 })
            );

            controllerLocal.setTokenInfoInternal(
                newToken,
                MoneyFiControllerType.TokenInfo({
                    lpTokenAddress: address(1),
                    minDepositAmount: 100e6,
                    decimals: 6,
                    isActive: true,
                    chainId: 1
                })
            );

            assertEq(controllerLocal.isTokenSupportInternalActive(newToken), true);
            assertEq(controllerLocal.isStrategyInternalActive(newStrategy), true);
            vm.stopPrank();
        }
    }

    function test_grantRole_shouldRight() public {
        // bytes32 memory operatorRole = controllerLocal.OPERATOR();
        // bytes32 memory adminRole = controllerLocal.ADMIN_ROLE();
        // bytes32 memory adminDelegateRole = controllerLocal.ADMIN_DELEGATE_ROLE();
        // bytes32 memory signerRole = controllerLocal.SIGNER();
        bytes32 operatorRole = keccak256("operator");
        bytes32 adminRole = keccak256("admin");
        bytes32 adminDelegateRole = keccak256("admin_delegate");
        bytes32 signerRole = keccak256("signer");

        vm.startPrank(users.admin);
        controllerLocal.grantRole(operatorRole, users.alice);
        controllerLocal.grantRole(adminRole, address(1));
        controllerLocal.grantRole(adminRole, users.bob);
        controllerLocal.grantRole(adminDelegateRole, users.carole);
        controllerLocal.grantRole(signerRole, users.maker);
        vm.stopPrank();

        assertEq(controllerLocal.isAdmin(users.admin), true);
        assertEq(controllerLocal.isDelegateAdmin(users.carole), true);
        assertEq(controllerLocal.isOperator(users.alice), true);
        assertEq(controllerLocal.isSigner(users.maker), true);
        assertEq(controllerLocal.isAdmin(address(1)), true);
        assertEq(controllerLocal.isOperator(users.admin), true);

        vm.startPrank(users.carole);
        // controllerLocal.revokeRole(adminDelegateRole, users.carole);
        controllerLocal.revokeRole(operatorRole, users.alice);
        vm.stopPrank();

        // vm.startPrank(users.admin);
        // controllerLocal.revokeRole(adminDelegateRole, users.carole);
        // controllerLocal.revokeRole(operatorRole, users.alice);
        // controllerLocal.revokeRole(adminDelegateRole, users.maker);
        // controllerLocal.revokeRole(adminRole, address(1));
        // vm.stopPrank();

        // assertEq(controllerLocal.isDelegateAdmin(users.carole), false);
        // assertEq(controllerLocal.isAdmin(address(1)), false);
    }
}
