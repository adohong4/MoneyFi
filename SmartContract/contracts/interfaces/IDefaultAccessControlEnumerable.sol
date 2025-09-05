// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDefaultAccessControlEnumerable {
    error InvalidAtLeastOperatorRole();
    error InvalidAdminRole();
    error InvalidDelegateRole();
    error InvalidSignerRole();
}
