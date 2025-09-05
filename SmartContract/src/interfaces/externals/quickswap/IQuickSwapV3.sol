pragma solidity 0.8.26;

interface IQuickSwapRouterV3 {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 limitSqrtPrice;
    }

    function exactInputSingle(ExactInputSingleParams memory param) external payable returns (uint256 amountOut);
}
