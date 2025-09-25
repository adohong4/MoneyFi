import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, TOKEN_ADDRESSES } from "../../lib/web3/config";
import { CONTRACT_ABI } from "@/config/abis";

export class PoolContract {
    private provider: ethers.BrowserProvider | null = null;
    private signer: ethers.Signer | null = null;
    private contract: ethers.Contract | null = null;
    private baseTokenDecimals: number | null = null;

    constructor(provider?: ethers.BrowserProvider) {
        this.provider = provider || null;
        if (typeof window !== "undefined" && window.ethereum && !this.provider) {
            this.provider = new ethers.BrowserProvider(window.ethereum);
        }
    }

    async getSigner() {
        if (!this.provider) {
            throw new Error("No Ethereum provider found. Please install MetaMask.");
        }
        if (!this.signer) {
            try {
                this.signer = await this.provider.getSigner();
            } catch (error) {
                console.error("Error getting signer:", error);
                throw new Error("Failed to get signer. Please connect your wallet.");
            }
        }
        return this.signer;
    }

    async getStrategyContract({ poolAddress }: { poolAddress: string }, useSigner: boolean = false) {
        if (!this.provider) {
            throw new Error("No Ethereum provider found. Please install MetaMask.");
        }
        if (!ethers.isAddress(poolAddress)) {
            throw new Error(`Invalid poolAddress: ${poolAddress}`);
        }
        const network = await this.provider.getNetwork();
        if (Number(network.chainId) !== 11155111) {
            throw new Error(`Wrong network! Expected Sepolia (11155111), got ${network.chainId}`);
        }
        const signerOrProvider = useSigner ? await this.getSigner() : this.provider;
        if (!this.contract || this.contract.target !== poolAddress) {
            this.contract = new ethers.Contract(poolAddress, CONTRACT_ABI.MONEYFI_STRATEGY, signerOrProvider);
            this.baseTokenDecimals = null; // Reset decimals khi contract thay đổi
        }
    }

    private async getBaseTokenDecimals(): Promise<number> {
        if (this.baseTokenDecimals !== null) {
            return this.baseTokenDecimals;
        }
        if (!this.contract || !this.provider) {
            throw new Error("Contract or provider not initialized. Call getStrategyContract first.");
        }
        try {
            const baseTokenAddress = await this.contract.baseToken();
            if (baseTokenAddress.toLowerCase() === TOKEN_ADDRESSES.USDC_SEPOLIA.toLowerCase()) {
                this.baseTokenDecimals = 6;
                console.log("BaseToken is USDC, using 6 decimals");
                return 6;
            }
            const tokenContract = new ethers.Contract(
                baseTokenAddress,
                ["function decimals() view returns (uint8)"],
                this.provider // Dùng provider thay vì signer
            );
            const decimals = await tokenContract.decimals();
            this.baseTokenDecimals = Number(decimals);
            console.log(`BaseToken decimals fetched: ${this.baseTokenDecimals}`);
            return this.baseTokenDecimals;
        } catch (error) {
            console.warn("Failed to fetch decimals, defaulting to 18:", error);
            this.baseTokenDecimals = 18;
            return 18;
        }
    }

    async setSlippageWhenSwapAsset(_slippageWhenSwapAsset: number): Promise<ethers.TransactionResponse> {
        try {
            if (!this.contract) {
                throw new Error("Contract not initialized. Call getStrategyContract with useSigner=true first.");
            }
            const slippageBps = Math.floor(_slippageWhenSwapAsset * 100);
            if (slippageBps < 0 || slippageBps > 10000) {
                throw new Error("Slippage must be between 0 and 100%");
            }
            console.log(`Setting slippageWhenSwapAsset to ${slippageBps} bps (${_slippageWhenSwapAsset}%)`);
            const tx = await this.contract.setSlippageWhenSwapAsset(slippageBps);
            console.log(`Transaction sent: ${tx.hash}`);
            return tx;
        } catch (error) {
            console.error("Failed to set slippageWhenSwapAsset:", error);
            throw error;
        }
    }

    async setMinimumSwapAmount(_minimumSwapAmount: number): Promise<ethers.TransactionResponse> {
        try {
            if (!this.contract) {
                throw new Error("Contract not initialized. Call getStrategyContract with useSigner=true first.");
            }
            const decimals = await this.getBaseTokenDecimals();
            const amount = ethers.parseUnits(_minimumSwapAmount.toString(), decimals);
            if (amount <= 0) {
                throw new Error("Minimum swap amount must be greater than 0");
            }
            console.log(`Setting minimumSwapAmount to ${ethers.formatUnits(amount, decimals)} (decimals: ${decimals})`);
            const tx = await this.contract.setMinimumSwapAmount(amount);
            console.log(`Transaction sent: ${tx.hash}`);
            return tx;
        } catch (error) {
            console.error("Failed to set minimumSwapAmount:", error);
            throw error;
        }
    }

    async getTVLPool(): Promise<number> {
        try {
            if (!this.contract) {
                throw new Error("Contract not initialized. Call getStrategyContract first.");
            }
            const decimals = await this.getBaseTokenDecimals();
            console.log(`Fetching TVL with baseToken decimals: ${decimals}`);
            const tvlBaseToken = await this.contract.totalLiquidWhitelistPool();
            if (tvlBaseToken === "0x" || tvlBaseToken === null || tvlBaseToken === undefined) {
                console.warn("TVL returned empty data, defaulting to 0");
                return 0;
            }
            const tvl = parseFloat(ethers.formatUnits(tvlBaseToken, decimals));
            console.log(`TVL: ${tvl.toFixed(decimals)} (decimals: ${decimals})`);
            return tvl;
        } catch (error) {
            console.error("Failed to get TVL:", error);
            throw error;
        }
    }
}