// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {IMoneyFiOracle} from "../interfaces/IMoneyFiOracle.sol";

/// @title DiracV1ProxyChainlink.sol
/// @notice See the documentation in {IDiracV1Proxy}.
contract MoneyFiChainLink is IMoneyFiOracle {
    address public pricer;

    constructor(address _pricer) {
        pricer = _pricer;
    }
    /*//////////////////////////////////////////////////////////////////////////
                         PUBLIC CONSTANT FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    function getNativePrice() public view returns (uint256 answer, uint8 decimals) {
        AggregatorV3Interface aggregator = AggregatorV3Interface(pricer);
        decimals = aggregator.decimals();
        // prettier-ignore
        (
            /* uint80 roundID */
            ,
            int256 value,
            /*uint startedAt*/
            ,
            /*uint timeStamp*/
            ,
            /*uint80 answeredInRound*/
        ) = aggregator.latestRoundData();

        if (value > 0) return (uint256(value), decimals);
        else revert InvalidPrice();
    }
}
