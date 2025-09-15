// src/services/transactionsContractService.ts
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from "@/src/config/contracts";
import MoneyFiRouterJSON from "@/src/contracts/MoneyFiRouter.json";

const MoneyFiRouterABI = MoneyFiRouterJSON.abi;

export class TransactionEventService {
    private provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null = null;

    constructor(provider?: ethers.BrowserProvider | ethers.JsonRpcProvider) {
        this.provider = provider || null;
    }

    async getProvider(): Promise<ethers.BrowserProvider | ethers.JsonRpcProvider> {
        if (!this.provider) {
            // Ưu tiên sử dụng Infura/Alchemy nếu có RPC URL
            if (process.env.NEXT_PUBLIC_INFURA_URL) {
                this.provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_INFURA_URL);
            } else if (typeof window !== "undefined" && window.ethereum) {
                this.provider = new ethers.BrowserProvider(window.ethereum);
            } else {
                throw new Error("No Ethereum provider found. Please install MetaMask or configure an RPC URL.");
            }
        }
        return this.provider;
    }

    async getUserTransactions(userAddress: string, blockRange: ethers.numberish = 10000): Promise<any[]> {
        try {
            const provider = await this.getProvider();
            const network = await provider.getNetwork();
            console.log("Network:", network);

            if (network.chainId !== BigInt(11155111)) {
                throw new Error("Please connect to Sepolia testnet");
            }

            const contract = new ethers.Contract(
                CONTRACT_ADDRESSES.MoneyFiRouter,
                MoneyFiRouterABI,
                provider
            );

            const latestBlock = await provider.getBlockNumber();
            console.log("Latest block:", latestBlock);

            let transactions: any[] = [];
            const step = Number(blockRange);

            // Chia nhỏ truy vấn theo khoảng block
            for (let fromBlock = Math.max(9096828, latestBlock - 1000000); fromBlock <= latestBlock; fromBlock += step) {
                const toBlock = Math.min(fromBlock + step - 1, latestBlock);
                console.log(`Querying from block ${fromBlock} to ${toBlock}`);
                const filter = contract.filters.DepositFund(userAddress);
                const events = await contract.queryFilter(filter, fromBlock, toBlock);
                console.log(`Events in range ${fromBlock}-${toBlock}:`, events);

                const batchTransactions = events.map((event) => {
                    const { user, tokenAddress, amount, actualDepositAmount, timestamp } = event.args;
                    return {
                        id: event.transactionHash,
                        type: "deposit",
                        amount: Number(ethers.formatUnits(amount, 6)),
                        actualAmount: Number(ethers.formatUnits(actualDepositAmount, 6)),
                        chain: "ETH",
                        hash: event.transactionHash,
                        date: new Date(Number(timestamp) * 1000).toISOString(),
                        status: "completed",
                        tokenAddress,
                    };
                });

                transactions = [...transactions, ...batchTransactions];
            }

            console.log("Formatted transactions:", transactions);
            return transactions;
        } catch (error) {
            console.error("Error fetching DepositFund events:", error);
            return [];
        }
    }
}