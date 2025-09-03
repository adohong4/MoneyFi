// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVaultBalancer {
    function balanceOf(address token, address account) external view returns (uint256 tokenBalance);

    function approve(address owner, address spender, uint256 amount) external returns (bool);
}
