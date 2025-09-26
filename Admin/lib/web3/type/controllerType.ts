export interface Strategy {
    name: string;
    chainId: number;
    isActive: boolean;
}

export interface StrategyExternal {
    underlyingAsset: string
    name: string;
    chainId: number;
    isActive: boolean;
}

export interface TokenInfo {
    lpTokenAddress: string;
    minDepositAmount: number;
    decimals: number;
    chainId: number;
    isActive: boolean;
}

export interface InternalSwapParam {
    name: string;
    chainId: number;
    isActive: boolean;
}

export interface CrossChainParam {
    name: string;
    chainId: number;
    typeDex: string;
    isActive: boolean;
}