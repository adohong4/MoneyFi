// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { MoneyFiStargateCrossChainRouterType } from "../types/RouterDataType.sol";

interface IMoneyFiStargateCrossChainBase {
    /*/////////////////////////////////////////////////////////////////////////
                                    ERRORS
    /////////////////////////////////////////////////////////////////////////*/

    error InvalidSigner(address _signer);
    error InvalidStargate(address _stargate);
    error InvalidEngPoint(address _endPoint);
    error InvalidRouter(address _router);

    function transferFundCrossToContract(MoneyFiStargateCrossChainRouterType.TransferFundCrossToContractParam memory _param)
        external
        payable;

    function validateInputTransferCrossChain() external;
}
