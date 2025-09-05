// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../contracts/MoneyFiController.sol";
import "../contracts/tokens/MoneyFiTokenLp.sol";
import "@openzeppelin/test-helpers/tests/Setup.sol";
import "forge-std/Test.sol";

contract MoneyFiControllerTest is Test {
    MoneyFiController controller;
    MoneyFiTokenLp tokenLp;
    address admin;
    address user;

    function setUp() public {
        admin = address(0x1);
        user = address(0x2);
        vm.startPrank(admin);

        // Deploy MoneyFiTokenLp
        tokenLp = new MoneyFiTokenLp();
        tokenLp.initialize(address(this), admin, "MoneyFi LP", "MFLP", 18);

        // Deploy and initialize MoneyFiController
        controller = new MoneyFiController();
        controller.initialize(admin, 1000); // 10% protocol fee

        // Configure token info
        MoneyFiControllerType.TokenInfo memory tokenInfo = MoneyFiControllerType.TokenInfo({
            minDepositAmount: 100,
            decimals: 18,
            chainId: 11155111, // Sepolia chain ID
            isActive: true,
            lpTokenAddress: address(tokenLp)
        });
        controller.setTokenInfoInternal(address(0x123), tokenInfo);
        vm.stopPrank();
    }

    function testInitialize() public {
        assertEq(controller.protocolFee(), 1000, "Protocol fee should be 1000");
        assertTrue(controller.hasRole(controller.DEFAULT_ADMIN_ROLE(), admin), "Admin should have admin role");
    }

    function testSetSigner() public {
        vm.prank(admin);
        controller.setSigner(user);
        assertEq(controller.signer(), user, "Signer should be set to user");
    }

    function testSetTokenInfoInternal() public {
        MoneyFiControllerType.TokenInfo memory tokenInfo = controller.getSupportedTokenInternalInfor(address(0x123));
        assertEq(tokenInfo.minDepositAmount, 100, "Min deposit amount should be 100");
        assertEq(tokenInfo.decimals, 18, "Decimals should be 18");
        assertEq(tokenInfo.chainId, 11155111, "Chain ID should be Sepolia");
        assertTrue(tokenInfo.isActive, "Token should be active");
        assertEq(tokenInfo.lpTokenAddress, address(tokenLp), "LP token address should match");
    }

    function testOnlyDelegateAdmin() public {
        vm.prank(user);
        vm.expectRevert("AccessControl: account is missing role");
        controller.setSigner(user);
    }
}
