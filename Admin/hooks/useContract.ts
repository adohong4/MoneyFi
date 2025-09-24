import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { ethers } from 'ethers';
import { OptimizedContractService } from '../lib/web3/optimized-contracts';
import { CONTRACT_ADDRESSES, SUPPORTED_CHAINS } from '@/lib/web3/config';

// Interface cho kết quả trả về của hook
interface ContractState {
    isConnected: boolean;
    address: string | null;
    isAdmin: boolean;
    isDelegateAdmin: boolean;
    isLoading: boolean;
    error: string | null;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
}

export const useContract = () => {
    const [contractState, setContractState] = useState<ContractState>({
        isConnected: false,
        address: null,
        isAdmin: false,
        isDelegateAdmin: false,
        isLoading: false,
        error: null,
        connectWallet: async () => { },
        disconnectWallet: () => { },
    });

    // Sử dụng wagmi hooks để lấy thông tin ví
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();

    useEffect(() => {
        const checkRoles = async () => {
            if (!isConnected || !address) {
                setContractState({
                    isConnected: false,
                    address: null,
                    isAdmin: false,
                    isDelegateAdmin: false,
                    isLoading: false,
                    error: null,
                    connectWallet,
                    disconnectWallet: disconnect,
                });
                return;
            }

            setContractState((prev) => ({ ...prev, isLoading: true }));

            try {
                // Kết nối với provider (Sepolia testnet)
                const provider = new ethers.JsonRpcProvider(SUPPORTED_CHAINS.SEPOLIA.rpcUrl);
                const contractService = OptimizedContractService.getInstance();

                // Tải contract MoneyFiController
                const contract = await contractService.getContract(
                    'MoneyFiController',
                    CONTRACT_ADDRESSES.MONEYFI_CONTROLLER,
                    provider
                );

                // Gọi hàm isAdmin và isDelegateAdmin
                const isAdmin = await contract.isAdmin(address);
                const isDelegateAdmin = await contract.isDelegateAdmin(address);

                setContractState({
                    isConnected: true,
                    address,
                    isAdmin,
                    isDelegateAdmin,
                    isLoading: false,
                    error: null,
                    connectWallet,
                    disconnectWallet: disconnect,
                });
            } catch (error: any) {
                setContractState((prev) => ({
                    ...prev,
                    isConnected,
                    address,
                    isAdmin: false,
                    isDelegateAdmin: false,
                    isLoading: false,
                    error: error.message || 'Failed to check roles',
                    connectWallet,
                    disconnectWallet: disconnect,
                }));
            }
        };

        checkRoles();
    }, [address, isConnected]);

    // Hàm kết nối ví
    const connectWallet = async () => {
        try {
            if (connectors.length === 0) {
                throw new Error('No connectors available');
            }
            await connect({ connector: connectors[0] }); // Kết nối với MetaMask hoặc connector đầu tiên
        } catch (error: any) {
            setContractState((prev) => ({
                ...prev,
                error: error.message || 'Failed to connect wallet',
            }));
        }
    };

    return contractState;
};