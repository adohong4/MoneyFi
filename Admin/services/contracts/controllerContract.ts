import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, UNISWAPV2_ADDRESSES } from "../../lib/web3/config";
import { CONTRACT_ABI } from "@/config/abis";
import { Strategy } from "../../lib/web3/type/controllerType";

export class ControllerContract {
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

    async getControllerContract() {
        const signer = await this.getSigner();
        return new ethers.Contract(CONTRACT_ADDRESSES.MONEYFI_CONTROLLER, CONTRACT_ABI.MONEYFI_CONTROLLER, signer)
    }

    async setStrategyInternal(addresss: string, Strategy: Strategy) {
        if (!this.provider) {
            throw new Error("No Ethereum provider found. Please install MetaMask.");
        }
        const controllerContract = await this.getControllerContract();

        return await controllerContract.setStrategyInternal(addresss, Strategy);
    }
}