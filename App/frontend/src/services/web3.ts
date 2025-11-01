// src/services/web3.ts - Web3 Wallet Connection & Management
import { BrowserProvider, Contract, JsonRpcSigner } from 'ethers';
import { toast } from 'sonner';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  network: string | null;
}

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL || 
  `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`;

let provider: BrowserProvider | null = null;
let signer: JsonRpcSigner | null = null;
let walletState: WalletState = {
  isConnected: false,
  address: null,
  chainId: null,
  network: null,
};

/**
 * Initialize Web3 provider
 */
export const initializeWeb3 = async (): Promise<boolean> => {
  if (!window.ethereum) {
    toast.error('MetaMask not detected. Please install MetaMask.');
    return false;
  }

  try {
    provider = new BrowserProvider(window.ethereum);
    return true;
  } catch (error) {
    console.error('Failed to initialize Web3:', error);
    return false;
  }
};

/**
 * Connect wallet (MetaMask)
 */
export const connectWallet = async (): Promise<WalletState> => {
  if (!window.ethereum) {
    toast.error('Please install MetaMask to continue');
    throw new Error('MetaMask not installed');
  }

  try {
    // Initialize provider if not already done
    if (!provider) {
      await initializeWeb3();
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }

    // Get network info
    const network = await provider!.getNetwork();
    const chainId = Number(network.chainId);

    // Update wallet state
    walletState = {
      isConnected: true,
      address: accounts[0],
      chainId: chainId,
      network: network.name,
    };

    // Get signer
    signer = await provider!.getSigner();

    // Check if on correct network
    if (chainId !== SEPOLIA_CHAIN_ID) {
      toast.warning('Please switch to Sepolia testnet');
      await switchToSepolia();
    } else {
      toast.success('Wallet connected successfully!');
    }

    // Setup event listeners
    setupEventListeners();

    return walletState;
  } catch (error: any) {
    console.error('Wallet connection error:', error);
    
    if (error.code === 4001) {
      toast.error('Connection rejected by user');
    } else {
      toast.error('Failed to connect wallet');
    }
    
    throw error;
  }
};

/**
 * Disconnect wallet
 */
export const disconnectWallet = (): void => {
  walletState = {
    isConnected: false,
    address: null,
    chainId: null,
    network: null,
  };
  
  signer = null;
  
  toast.success('Wallet disconnected');
};

/**
 * Switch to Sepolia testnet
 */
export const switchToSepolia = async (): Promise<boolean> => {
  if (!window.ethereum) {
    return false;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
    });

    toast.success('Switched to Sepolia testnet');
    return true;
  } catch (error: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
              chainName: 'Sepolia Testnet',
              nativeCurrency: {
                name: 'Sepolia ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [SEPOLIA_RPC_URL],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            },
          ],
        });

        toast.success('Sepolia testnet added and switched');
        return true;
      } catch (addError) {
        console.error('Failed to add Sepolia network:', addError);
        toast.error('Failed to add Sepolia network');
        return false;
      }
    } else {
      console.error('Failed to switch network:', error);
      toast.error('Failed to switch network');
      return false;
    }
  }
};

/**
 * Get current wallet state
 */
export const getWalletState = (): WalletState => {
  return { ...walletState };
};

/**
 * Get signer
 */
export const getSigner = async (): Promise<JsonRpcSigner> => {
  if (!signer) {
    if (!provider) {
      await initializeWeb3();
    }
    signer = await provider!.getSigner();
  }
  return signer;
};

/**
 * Get provider
 */
export const getProvider = (): BrowserProvider | null => {
  return provider;
};

/**
 * Setup event listeners for wallet changes
 */
const setupEventListeners = (): void => {
  if (!window.ethereum) return;

  // Account changed
  window.ethereum.on('accountsChanged', (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
      toast.info('Wallet disconnected');
    } else {
      walletState.address = accounts[0];
      toast.info('Account changed');
      window.location.reload();
    }
  });

  // Chain changed
  window.ethereum.on('chainChanged', (chainId: string) => {
    const newChainId = parseInt(chainId, 16);
    walletState.chainId = newChainId;
    
    if (newChainId !== SEPOLIA_CHAIN_ID) {
      toast.warning('Please switch to Sepolia testnet');
    }
    
    window.location.reload();
  });

  // Disconnect
  window.ethereum.on('disconnect', () => {
    disconnectWallet();
  });
};

/**
 * Get contract instance
 */
export const getContract = async (
  address: string,
  abi: any[]
): Promise<Contract> => {
  const signerInstance = await getSigner();
  return new Contract(address, abi, signerInstance);
};

/**
 * Check if wallet is connected
 */
export const isWalletConnected = (): boolean => {
  return walletState.isConnected;
};

/**
 * Get formatted address (0x1234...5678)
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Estimate gas for transaction
 */
export const estimateGas = async (
  contract: Contract,
  method: string,
  params: any[]
): Promise<bigint> => {
  try {
    const gasEstimate = await contract[method].estimateGas(...params);
    // Add 20% buffer
    return (gasEstimate * 120n) / 100n;
  } catch (error) {
    console.error('Gas estimation error:', error);
    throw error;
  }
};

/**
 * Wait for transaction confirmation
 */
export const waitForTransaction = async (
  txHash: string,
  confirmations: number = 1
): Promise<any> => {
  if (!provider) {
    throw new Error('Provider not initialized');
  }

  try {
    toast.info('Transaction submitted. Waiting for confirmation...');
    const receipt = await provider.waitForTransaction(txHash, confirmations);
    
    if (receipt && receipt.status === 1) {
      toast.success('Transaction confirmed!');
      return receipt;
    } else {
      toast.error('Transaction failed');
      throw new Error('Transaction failed');
    }
  } catch (error) {
    console.error('Transaction error:', error);
    toast.error('Transaction failed');
    throw error;
  }
};

/**
 * Get transaction receipt
 */
export const getTransactionReceipt = async (txHash: string): Promise<any> => {
  if (!provider) {
    throw new Error('Provider not initialized');
  }

  return await provider.getTransactionReceipt(txHash);
};

/**
 * Get block number
 */
export const getBlockNumber = async (): Promise<number> => {
  if (!provider) {
    throw new Error('Provider not initialized');
  }

  return await provider.getBlockNumber();
};

/**
 * Get balance
 */
export const getBalance = async (address?: string): Promise<string> => {
  if (!provider) {
    throw new Error('Provider not initialized');
  }

  const addr = address || walletState.address;
  if (!addr) {
    throw new Error('No address provided');
  }

  const balance = await provider.getBalance(addr);
  return balance.toString();
};