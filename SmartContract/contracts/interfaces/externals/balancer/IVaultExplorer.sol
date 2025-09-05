// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.20;

import { IBatchRouter } from "./IBatchRouter.sol";

import "./VaultTypes.sol";

interface IVaultExplorer {
    function getPoolData(address pool) external view returns (PoolData memory poolData);
}
