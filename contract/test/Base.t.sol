// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.26;

import { Test } from "forge-std/Test.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { MoneyFiRouter } from "../src/MoneyFiRouter.sol";
import { MoneyFiFundVault } from "../src/MoneyFiFundVault.sol";
import { MoneyFiController } from "../src/MoneyFiController.sol";
import { MoneyFiCrossChainRouter } from "../src/MoneyFiCrossChainRouter.sol";
import { MoneyFiStartegyUpgradeableLocal } from "../src/strategies/MoneyFiStartegyUpgradeableLocal.sol";
import { MoneyFiStrategyUpgradeableAllBridge } from "../src/strategies/MoneyFiStrategyUpgradeableAllBridge.sol";
import { MoneyFiStartegyUpgradeableAerodrome } from "../src/strategies/MoneyFiStartegyUpgradeableAerodrome.sol";
import { MoneyFiControllerType } from "../src/types/ControllerDataType.sol";
import { MoneyFiStrategyUpgradeableBalancer } from "../src/strategies/MoneyFiStrategyUpgradeableBalancer.sol";
import { MoneyFiStrategyUpgradeableCompound } from "../src/strategies/MoneyFiStrategyUpgradeableCompound.sol";
import { MoneyFiStrategyUpgradeableStargate } from "../src/strategies/MoneyFiStrategyUpgradeableStargate.sol";
import { IMoneyFiStartegyUpgradeableAerodrome } from "../src/interfaces/IMoneyFiStartegyUpgradeableAerodrome.sol";
import { IMoneyFiStartegyUpgradeableBalancer } from "../src/interfaces/IMoneyFiStartegyUpgradeableBalancer.sol";
import { ERC20Mock } from "./mocks/ERC20Mock.sol";
import { MoneyFiStargateCrossChain } from "../src/dex-crosschain/MoneyFiStargateCrossChain.sol";
import { MoneyFiTokenLp } from "../src/tokens/MoneyFiTokenLp.sol";
import { console } from "forge-std/console.sol";

/// @notice Base test contract with common logic needed by all tests.
abstract contract BaseTest is Test {
    using Math for uint256;
    using SafeERC20 for ERC20;

    struct Users {
        // Default admin for all MoneyFi V1 contracts.
        address payable admin;
        // Vault user.
        address payable alice;
        // Vault user.
        address payable bob;
        // User without tokens.
        address payable carole;
        // Default market maker
        address payable maker;
    }

    address signer = vm.envAddress("SIGNER");

    /*//////////////////////////////////////////////////////////////////////////
                                     CONSTANTS
    //////////////////////////////////////////////////////////////////////////*/
    uint256 internal key;

    uint256 internal constant MAX_UINT256 = type(uint256).max;

    /*//////////////////////////////////////////////////////////////////////////
                                     VARIABLES
    //////////////////////////////////////////////////////////////////////////*/

    Users internal users;

    /*//////////////////////////////////////////////////////////////////////////
                                   TEST CONTRACTS
    //////////////////////////////////////////////////////////////////////////*/

    ERC20 internal usdc;
    ERC20 internal usdt;

    /*//////////////////////////////////////////////////////////////////////////
                                  CONSTRUCTOR
    //////////////////////////////////////////////////////////////////////////*/

    constructor() {
        (, key) = makeAddrAndKey("Admin");

        // Create users for testing.
        users = Users({
            admin: createUser("Admin"),
            alice: createUser("Alice"),
            bob: createUser("Bob"),
            carole: createUser("Carole"),
            maker: createUser("Maker")
        });
    }

    /*//////////////////////////////////////////////////////////////////////////
                                      HELPERS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev Approves all V1 Core contracts to spend assets from the Admin, Maker, Alice and Bob.
    function approveProtocol(address _vaultUSDC) internal {
        vm.startPrank({ msgSender: users.admin });
        usdc.approve({ spender: _vaultUSDC, value: MAX_UINT256 });
        vm.stopPrank();

        vm.startPrank({ msgSender: users.alice });
        usdc.approve({ spender: _vaultUSDC, value: MAX_UINT256 });
        vm.stopPrank();

        vm.startPrank({ msgSender: users.bob });
        usdc.approve({ spender: _vaultUSDC, value: MAX_UINT256 });
        vm.stopPrank();

        vm.startPrank({ msgSender: users.maker });
        usdc.approve({ spender: _vaultUSDC, value: MAX_UINT256 });
        vm.stopPrank();
    }

    /// @dev Generates a user, labels its address, and funds it with test assets.
    function createUser(string memory name) internal returns (address payable) {
        address payable user = payable(makeAddr(name));
        vm.deal({ account: user, newBalance: 100 ether });
        return user;
    }

    /// @dev Deal tokens to users
    function dealTokens() internal {
        deal({ token: address(usdc), to: users.admin, give: 1_000_000e6 });
        deal({ token: address(usdc), to: users.alice, give: 1_000_000e6 });
        deal({ token: address(usdc), to: users.bob, give: 1_000_000e6 });
        deal({ token: address(usdc), to: users.carole, give: 1_000_000e6 });
        deal({ token: address(usdc), to: users.maker, give: 1_000_000e6 });
    }

    function _deployFundVaultLocal(
        address _admin,
        address _feeTo,
        address _asset,
        uint256 _protocolFee
    )
        internal
        returns (
            address vaultProxy,
            address controllerProxy,
            address routerLocalProxy,
            address routerCrossChainProxy,
            address strategyLocal1Proxy,
            address lpDepositToken
        )
    {
        {
            MoneyFiController controller = new MoneyFiController();
            bytes memory hashController = abi.encodeWithSignature("initialize(address,uint256)", _admin, _protocolFee);

            controllerProxy = address(new ERC1967Proxy(address(controller), hashController));
        }

        {
            MoneyFiFundVault vault = new MoneyFiFundVault();

            bytes memory hashFundVault =
                abi.encodeWithSignature("initialize(address,address,address)", _admin, address(controllerProxy), _feeTo);

            vaultProxy = address(new ERC1967Proxy(address(vault), hashFundVault));
        }

        {
            MoneyFiCrossChainRouter routerCrossChain = new MoneyFiCrossChainRouter();

            bytes memory hashRouter = abi.encodeWithSignature(
                "initialize(address,address,address)", _admin, address(controllerProxy), address(vaultProxy)
            );

            routerCrossChainProxy = address(new ERC1967Proxy(address(routerCrossChain), hashRouter));
        }

        {
            MoneyFiRouter routerLocal = new MoneyFiRouter();

            bytes memory hashRouter = abi.encodeWithSignature(
                "initialize(address,address,address)", _admin, address(controllerProxy), address(vaultProxy)
            );

            routerLocalProxy = address(new ERC1967Proxy(address(routerLocal), hashRouter));
        }

        {
            MoneyFiStartegyUpgradeableLocal strategyLocal1 = new MoneyFiStartegyUpgradeableLocal();

            bytes memory hashStrategyLocal1 = abi.encodeWithSignature(
                "initialize(address,address,address,address,string,string)",
                _admin,
                _asset,
                address(routerLocalProxy),
                address(routerCrossChainProxy),
                "mLocal",
                "mLocal"
            );

            strategyLocal1Proxy = address(new ERC1967Proxy(address(strategyLocal1), hashStrategyLocal1));
        }

        {
            MoneyFiTokenLp lpTokenDeposit = new MoneyFiTokenLp();

            bytes memory hashlpTokenDeposit = abi.encodeWithSignature(
                "initialize(address,address,string,string,uint8)",
                address(vaultProxy),
                _admin,
                "musd",
                "musd",
                ERC20(_asset).decimals()
            );

            lpDepositToken = address(new ERC1967Proxy(address(lpTokenDeposit), hashlpTokenDeposit));
        }

        {
            vm.startPrank(users.admin);
            MoneyFiController(address(controllerProxy)).setRouter(address(routerLocalProxy));
            MoneyFiController(address(controllerProxy)).setTokenInfoInternal(
                address(_asset),
                MoneyFiControllerType.TokenInfo({
                    lpTokenAddress: address(lpDepositToken),
                    minDepositAmount: 10e6,
                    decimals: 6,
                    isActive: true,
                    chainId: 1
                })
            );

            MoneyFiController(address(controllerProxy)).setStrategyInternal(
                address(strategyLocal1Proxy), MoneyFiControllerType.Strategy({ name: "vault mock", isActive: true, chainId: 1 })
            );

            MoneyFiController(address(controllerProxy)).setCrossChainSwapInternal(
                MoneyFiControllerType.CrossChainParam({ name: "router corss chain", isActive: true, chainId: 1, typeDex: 1 }),
                address(routerLocalProxy)
            );

            MoneyFiController(address(controllerProxy)).setMaxPercentLiquidityStrategy(address(usdc), 3000);
            MoneyFiController(address(controllerProxy)).setMaxPercentLiquidityStrategy(address(usdt), 3000);
            MoneyFiController(address(controllerProxy)).setMaxDepositValue(address(usdt), type(uint256).max);
            MoneyFiController(address(controllerProxy)).setMaxDepositValue(address(usdc), type(uint256).max);
            vm.stopPrank();
        }
        return (
            address(vaultProxy),
            address(controllerProxy),
            address(routerLocalProxy),
            address(routerCrossChainProxy),
            address(strategyLocal1Proxy),
            address(lpDepositToken)
        );
    }

    function _deployVaultAllBridge(
        address _admin,
        address _feeTo,
        address _asset,
        address _allBridgeAddress,
        uint256 _protocolFee
    )
        internal
        returns (
            address vaultProxy,
            address controllerProxy,
            address routerProxy,
            address routerCrossChainProxy,
            address strategyProxy,
            address lpDepositToken
        )
    {
        {
            MoneyFiController controller = new MoneyFiController();
            bytes memory hashController = abi.encodeWithSignature("initialize(address,uint256)", _admin, _protocolFee);

            controllerProxy = address(new ERC1967Proxy(address(controller), hashController));
        }

        {
            MoneyFiFundVault vault = new MoneyFiFundVault();

            bytes memory hashFundVault =
                abi.encodeWithSignature("initialize(address,address,address)", _admin, address(controllerProxy), _feeTo);

            vaultProxy = address(new ERC1967Proxy(address(vault), hashFundVault));
        }

        {
            MoneyFiCrossChainRouter routerCrossChain = new MoneyFiCrossChainRouter();

            bytes memory hashRouter = abi.encodeWithSignature(
                "initialize(address,address,address)", _admin, address(controllerProxy), address(vaultProxy)
            );

            routerCrossChainProxy = address(new ERC1967Proxy(address(routerCrossChain), hashRouter));
        }

        {
            MoneyFiRouter router = new MoneyFiRouter();

            bytes memory hashRouter = abi.encodeWithSignature(
                "initialize(address,address,address)", _admin, address(controllerProxy), address(vaultProxy)
            );

            routerProxy = address(new ERC1967Proxy(address(router), hashRouter));
        }

        {
            MoneyFiStrategyUpgradeableAllBridge strategy = new MoneyFiStrategyUpgradeableAllBridge();

            bytes memory hashStrategy = abi.encodeWithSignature(
                "initialize(address,address,address,address,address,string,string)",
                _admin,
                _asset,
                address(routerProxy),
                address(routerCrossChainProxy),
                address(_allBridgeAddress),
                "mAllBridge",
                "mAllBridge"
            );

            strategyProxy = address(new ERC1967Proxy(address(strategy), hashStrategy));
        }
        {
            MoneyFiTokenLp lpTokenDeposit = new MoneyFiTokenLp();

            bytes memory hashlpTokenDeposit = abi.encodeWithSignature(
                "initialize(address,address,string,string,uint8)",
                address(vaultProxy),
                _admin,
                "musd",
                "musd",
                ERC20(_asset).decimals()
            );

            lpDepositToken = address(new ERC1967Proxy(address(lpTokenDeposit), hashlpTokenDeposit));
        }
        return (
            address(vaultProxy),
            address(controllerProxy),
            address(routerProxy),
            address(routerCrossChainProxy),
            address(strategyProxy),
            address(lpDepositToken)
        );
    }

    function _deployVaultAerodrome(
        address _admin,
        address _feeTo,
        uint256 _protocolFee,
        address _baseToken,
        address _qouteToken,
        uint256 _slippageWhenSwapAsset,
        IMoneyFiStartegyUpgradeableAerodrome.AeroDromeInitializeParams memory _aeroDromeInitializeParams
    )
        internal
        returns (
            address vaultProxy,
            address controllerProxy,
            address routerProxy,
            address routerCrossChainProxy,
            address strategyProxy,
            address lpDepositToken
        )
    {
        {
            MoneyFiController controller = new MoneyFiController();
            bytes memory hashController = abi.encodeWithSignature("initialize(address,uint256)", _admin, _protocolFee);

            controllerProxy = address(new ERC1967Proxy(address(controller), hashController));
        }

        {
            MoneyFiFundVault vault = new MoneyFiFundVault();

            bytes memory hashFundVault =
                abi.encodeWithSignature("initialize(address,address,address)", _admin, address(controllerProxy), _feeTo);

            vaultProxy = address(new ERC1967Proxy(address(vault), hashFundVault));
        }

        {
            MoneyFiCrossChainRouter routerCrossChain = new MoneyFiCrossChainRouter();

            bytes memory hashRouter = abi.encodeWithSignature(
                "initialize(address,address,address)", _admin, address(controllerProxy), address(vaultProxy)
            );

            routerCrossChainProxy = address(new ERC1967Proxy(address(routerCrossChain), hashRouter));
        }

        {
            MoneyFiRouter router = new MoneyFiRouter();

            bytes memory hashRouter = abi.encodeWithSignature(
                "initialize(address,address,address)", _admin, address(controllerProxy), address(vaultProxy)
            );

            routerProxy = address(new ERC1967Proxy(address(router), hashRouter));
        }

        {
            MoneyFiStartegyUpgradeableAerodrome strategy = new MoneyFiStartegyUpgradeableAerodrome();

            bytes memory hashStrategy = abi.encodeWithSignature(
                "initialize(address,address,address,address,address,uint256,string,string)",
                _admin,
                _baseToken,
                _qouteToken,
                routerProxy,
                routerCrossChainProxy,
                _slippageWhenSwapAsset,
                "mAeroDrome",
                "mAeroDrome"
            );

            strategyProxy = address(new ERC1967Proxy(address(strategy), hashStrategy));

            // Set up state for AeroDrome
            vm.startPrank(users.admin);
            // MoneyFiStartegyUpgradeableAerodrome(strategyProxy).setUp(_aeroDromeInitializeParams);
            vm.stopPrank();
        }

        {
            MoneyFiTokenLp lpTokenDeposit = new MoneyFiTokenLp();

            bytes memory hashlpTokenDeposit = abi.encodeWithSignature(
                "initialize(address,address,string,string,uint8)",
                address(vaultProxy),
                _admin,
                "musd",
                "musd",
                ERC20(_baseToken).decimals()
            );

            lpDepositToken = address(new ERC1967Proxy(address(lpTokenDeposit), hashlpTokenDeposit));
        }

        return (
            address(vaultProxy),
            address(controllerProxy),
            address(routerProxy),
            address(routerCrossChainProxy),
            address(strategyProxy),
            address(lpDepositToken)
        );
    }

    function _deployVaultBalancer(
        address _admin,
        address _feeTo,
        address _asset,
        uint256 _protocolFee
    )
        internal
        returns (
            address vaultProxy,
            address controllerProxy,
            address routerProxy,
            address routerCrossChainProxy,
            address strategyProxy,
            address lpDepositToken
        )
    {
        {
            MoneyFiController controller = new MoneyFiController();
            bytes memory hashController = abi.encodeWithSignature("initialize(address,uint256)", _admin, _protocolFee);

            controllerProxy = address(new ERC1967Proxy(address(controller), hashController));
        }

        {
            MoneyFiFundVault vault = new MoneyFiFundVault();

            bytes memory hashFundVault =
                abi.encodeWithSignature("initialize(address,address,address)", _admin, address(controllerProxy), _feeTo);

            vaultProxy = address(new ERC1967Proxy(address(vault), hashFundVault));
        }

        {
            MoneyFiCrossChainRouter routerCrossChain = new MoneyFiCrossChainRouter();

            bytes memory hashRouter = abi.encodeWithSignature(
                "initialize(address,address,address)", _admin, address(controllerProxy), address(vaultProxy)
            );

            routerCrossChainProxy = address(new ERC1967Proxy(address(routerCrossChain), hashRouter));
        }

        {
            MoneyFiRouter router = new MoneyFiRouter();

            bytes memory hashRouter = abi.encodeWithSignature(
                "initialize(address,address,address)", _admin, address(controllerProxy), address(vaultProxy)
            );

            routerProxy = address(new ERC1967Proxy(address(router), hashRouter));
        }

        {
            MoneyFiStrategyUpgradeableBalancer strategy = new MoneyFiStrategyUpgradeableBalancer();

            bytes memory hashStrategy = abi.encodeWithSignature(
                "initialize(address,address,address,address,string,string)",
                _admin,
                address(_asset),
                address(routerProxy),
                address(routerCrossChainProxy),
                "mBalancer",
                "mBalancer"
            );

            strategyProxy = address(new ERC1967Proxy(address(strategy), hashStrategy));
        }
        {
            MoneyFiTokenLp lpTokenDeposit = new MoneyFiTokenLp();

            bytes memory hashlpTokenDeposit = abi.encodeWithSignature(
                "initialize(address,address,string,string,uint8)",
                address(vaultProxy),
                _admin,
                "musd",
                "musd",
                ERC20(_asset).decimals()
            );

            lpDepositToken = address(new ERC1967Proxy(address(lpTokenDeposit), hashlpTokenDeposit));
        }
        return (
            address(vaultProxy),
            address(controllerProxy),
            address(routerProxy),
            address(routerCrossChainProxy),
            address(strategyProxy),
            address(lpDepositToken)
        );
    }

    function _deployVaultCompound(
        address _admin,
        address _feeTo,
        address _asset,
        MoneyFiStrategyUpgradeableCompound.CompoundInitializeParams memory _compoundInitializeParams,
        uint256 _protocolFee
    )
        internal
        returns (
            address vaultProxy,
            address controllerProxy,
            address routerProxy,
            address routerCrossChainProxy,
            address strategyProxy,
            address lpDepositToken
        )
    {
        {
            MoneyFiController controller = new MoneyFiController();
            bytes memory hashController = abi.encodeWithSignature("initialize(address,uint256)", _admin, _protocolFee);

            controllerProxy = address(new ERC1967Proxy(address(controller), hashController));
        }

        {
            MoneyFiFundVault vault = new MoneyFiFundVault();

            bytes memory hashFundVault =
                abi.encodeWithSignature("initialize(address,address,address)", _admin, address(controllerProxy), _feeTo);

            vaultProxy = address(new ERC1967Proxy(address(vault), hashFundVault));
        }

        {
            MoneyFiCrossChainRouter routerCrossChain = new MoneyFiCrossChainRouter();

            bytes memory hashRouter = abi.encodeWithSignature(
                "initialize(address,address,address)", _admin, address(controllerProxy), address(vaultProxy)
            );

            routerCrossChainProxy = address(new ERC1967Proxy(address(routerCrossChain), hashRouter));
        }

        {
            MoneyFiRouter router = new MoneyFiRouter();

            bytes memory hashRouter = abi.encodeWithSignature(
                "initialize(address,address,address)", _admin, address(controllerProxy), address(vaultProxy)
            );

            routerProxy = address(new ERC1967Proxy(address(router), hashRouter));
        }

        {
            MoneyFiStrategyUpgradeableCompound strategy = new MoneyFiStrategyUpgradeableCompound();

            bytes memory hashStrategy = abi.encodeWithSignature(
                "initialize(address,address,address,address,string,string)",
                _admin,
                _asset,
                address(routerProxy),
                address(routerCrossChainProxy),
                "mCompound",
                "mCompound"
            );

            strategyProxy = address(new ERC1967Proxy(address(strategy), hashStrategy));

            vm.startPrank(users.admin);
            MoneyFiStrategyUpgradeableCompound(strategyProxy).setUp(_compoundInitializeParams);
            vm.stopPrank();
        }
        {
            MoneyFiTokenLp lpTokenDeposit = new MoneyFiTokenLp();

            bytes memory hashlpTokenDeposit = abi.encodeWithSignature(
                "initialize(address,address,string,string,uint8)",
                address(vaultProxy),
                _admin,
                "musd",
                "musd",
                ERC20(_asset).decimals()
            );

            lpDepositToken = address(new ERC1967Proxy(address(lpTokenDeposit), hashlpTokenDeposit));
        }
        return (
            address(vaultProxy),
            address(controllerProxy),
            address(routerProxy),
            address(routerCrossChainProxy),
            address(strategyProxy),
            address(lpDepositToken)
        );
    }

    function _deployVaultStargate(
        address _admin,
        address _feeTo,
        address _asset,
        MoneyFiStrategyUpgradeableStargate.StargateInitializeParams memory _stargateInitializeParams,
        uint256 _protocolFee
    )
        internal
        returns (
            address vaultProxy,
            address controllerProxy,
            address routerProxy,
            address routerCrossChainProxy,
            address strategyProxy,
            address lpDepositToken
        )
    {
        {
            MoneyFiController controller = new MoneyFiController();
            bytes memory hashController = abi.encodeWithSignature("initialize(address,uint256)", _admin, _protocolFee);

            controllerProxy = address(new ERC1967Proxy(address(controller), hashController));
        }

        {
            MoneyFiFundVault vault = new MoneyFiFundVault();

            bytes memory hashFundVault =
                abi.encodeWithSignature("initialize(address,address,address)", _admin, address(controllerProxy), _feeTo);

            vaultProxy = address(new ERC1967Proxy(address(vault), hashFundVault));
        }

        {
            MoneyFiCrossChainRouter routerCrossChain = new MoneyFiCrossChainRouter();

            bytes memory hashRouter = abi.encodeWithSignature(
                "initialize(address,address,address)", _admin, address(controllerProxy), address(vaultProxy)
            );

            routerCrossChainProxy = address(new ERC1967Proxy(address(routerCrossChain), hashRouter));
        }

        {
            MoneyFiRouter router = new MoneyFiRouter();

            bytes memory hashRouter = abi.encodeWithSignature(
                "initialize(address,address,address)", _admin, address(controllerProxy), address(vaultProxy)
            );

            routerProxy = address(new ERC1967Proxy(address(router), hashRouter));
        }

        {
            MoneyFiStrategyUpgradeableStargate strategy = new MoneyFiStrategyUpgradeableStargate();

            bytes memory hashStrategy = abi.encodeWithSignature(
                "initialize(address,address,address,address,string,string)",
                _admin,
                _asset,
                address(routerProxy),
                address(routerCrossChainProxy),
                "mStargate",
                "mStargate"
            );

            strategyProxy = address(new ERC1967Proxy(address(strategy), hashStrategy));

            vm.startPrank(users.admin);
            MoneyFiStrategyUpgradeableStargate(strategyProxy).setUp(_stargateInitializeParams);
            vm.stopPrank();
        }
        {
            MoneyFiTokenLp lpTokenDeposit = new MoneyFiTokenLp();

            bytes memory hashlpTokenDeposit = abi.encodeWithSignature(
                "initialize(address,address,string,string,uint8)",
                address(vaultProxy),
                _admin,
                "musd",
                "musd",
                ERC20(_asset).decimals()
            );

            lpDepositToken = address(new ERC1967Proxy(address(lpTokenDeposit), hashlpTokenDeposit));
        }
        return (
            address(vaultProxy),
            address(controllerProxy),
            address(routerProxy),
            address(routerCrossChainProxy),
            address(strategyProxy),
            address(lpDepositToken)
        );
    }

    function _deployAndSetUpStargateCrossChain(
        address _fundVault,
        address _controller,
        address _admin,
        address _lzEndPoint
    )
        internal
        returns (address stargateSender, address stargateReciever)
    {
        {
            // console.log("213234");
            // stargateSender = address(new MoneyFiStargateCrossChain(_admin, _router, _lzEndPoint));

            bytes memory hashStargate = abi.encodeWithSignature(
                "initialize(address,address,address,address)", _admin, _fundVault, _controller, _lzEndPoint
            );

            stargateSender = address(new ERC1967Proxy(address(new MoneyFiStargateCrossChain()), hashStargate));
        }

        {
            // stargateReciever = address(new MoneyFiStargateCrossChain(_admin, _router, _lzEndPoint));

            bytes memory hashStargate = abi.encodeWithSignature(
                "initialize(address,address,address,address)", _admin, _fundVault, _controller, _lzEndPoint
            );

            stargateReciever = address(new ERC1967Proxy(address(new MoneyFiStargateCrossChain()), hashStargate));
        }

        // MoneyFiStargateCrossChain stargateReciever = new MoneyFiStargateCrossChain();
        //  initialize(address admin_, address moneyfiRouter_, address lzEndpoint_) external initializer {
        //     __DefaultAccessControlEnumerable_init(admin_);
        //     router = moneyfiRouter_;
        //     LZ_ENDPOINT = lzEndpoint_;
        // }
        return (address(stargateSender), address(stargateReciever));
    }

    function _dealToken(address token, address receiver, uint256 initBalance) internal {
        deal({ token: token, to: receiver, give: initBalance });
    }

    function assertInRange(uint256 actual, uint256 min, uint256 max) internal {
        assertTrue(actual >= min && actual <= max, "Value out of range");
    }

    function mulDiv(uint256 x, uint256 mul, uint256 div) internal returns (uint256) {
        return x.mulDiv(mul, div, Math.Rounding.Floor);
    }
}
