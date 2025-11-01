// src/services/blockchain.ts - Smart Contract Interaction Layer
import { Contract, keccak256, toUtf8Bytes } from 'ethers';
import { getContract, getSigner, estimateGas, waitForTransaction } from './web3';
import { toast } from 'sonner';

// Import contract ABIs (generated after compilation)
import VoterRegistryABI from '../abis/VoterRegistry.json';
import EncryptedBallotABI from '../abis/EncryptedBallot.json';
import TallyValidatorABI from '../abis/TallyValidator.json';
import BulletinBoardABI from '../abis/BulletinBoard.json';

// Contract addresses from deployment
const CONTRACTS = {
  VoterRegistry: import.meta.env.VITE_VOTER_REGISTRY_ADDRESS || '',
  EncryptedBallot: import.meta.env.VITE_ENCRYPTED_BALLOT_ADDRESS || '',
  TallyValidator: import.meta.env.VITE_TALLY_VALIDATOR_ADDRESS || '',
  BulletinBoard: import.meta.env.VITE_BULLETIN_BOARD_ADDRESS || '',
};

/**
 * Hash EPIC number for blockchain storage
 */
export const hashEpicNumber = (epicNumber: string): string => {
  return keccak256(toUtf8Bytes(epicNumber));
};

/**
 * Generate registration hash
 */
export const generateRegistrationHash = (
  epicNumber: string,
  biometricHash: string,
  timestamp: number
): string => {
  const combined = `${epicNumber}${biometricHash}${timestamp}`;
  return keccak256(toUtf8Bytes(combined));
};

// ============================================
// VOTER REGISTRY FUNCTIONS
// ============================================

/**
 * Register voter on blockchain
 */
export const registerVoterOnChain = async (
  epicNumber: string,
  biometricHash: string,
  merkleProof: string[] = []
): Promise<{ success: boolean; txHash?: string; error?: string }> => {
  try {
    const contract = await getContract(
      CONTRACTS.VoterRegistry,
      VoterRegistryABI.abi
    );

    // Generate hashes
    const epicHash = hashEpicNumber(epicNumber);
    const registrationHash = generateRegistrationHash(
      epicNumber,
      biometricHash,
      Date.now()
    );

    // Convert merkle proof to bytes32[]
    const merkleProofBytes32 = merkleProof.map(p => p.startsWith('0x') ? p : `0x${p}`);

    toast.info('Submitting registration to blockchain...');

    // Estimate gas
    const gasLimit = await estimateGas(contract, 'registerVoter', [
      epicHash,
      registrationHash,
      merkleProofBytes32,
    ]);

    // Execute transaction
    const tx = await contract.registerVoter(
      epicHash,
      registrationHash,
      merkleProofBytes32,
      { gasLimit }
    );

    // Wait for confirmation
    const receipt = await waitForTransaction(tx.hash);

    return {
      success: receipt.status === 1,
      txHash: tx.hash,
    };
  } catch (error: any) {
    console.error('Blockchain registration error:', error);
    
    let errorMessage = 'Blockchain registration failed';
    if (error.message.includes('already registered')) {
      errorMessage = 'Already registered on blockchain';
    } else if (error.message.includes('user rejected')) {
      errorMessage = 'Transaction rejected by user';
    }

    toast.error(errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Check if voter is eligible on blockchain
 */
export const checkVoterEligibility = async (
  epicNumber: string
): Promise<boolean> => {
  try {
    const contract = await getContract(
      CONTRACTS.VoterRegistry,
      VoterRegistryABI.abi
    );

    const epicHash = hashEpicNumber(epicNumber);
    const isEligible = await contract.isVoterEligible(epicHash);

    return isEligible;
  } catch (error) {
    console.error('Eligibility check error:', error);
    return false;
  }
};

/**
 * Get voter details from blockchain
 */
export const getVoterDetails = async (epicNumber: string): Promise<any> => {
  try {
    const contract = await getContract(
      CONTRACTS.VoterRegistry,
      VoterRegistryABI.abi
    );

    const epicHash = hashEpicNumber(epicNumber);
    const details = await contract.getVoterDetails(epicHash);

    return {
      registrationHash: details[0],
      registeredAt: Number(details[1]),
      isActive: details[2],
      hasVoted: details[3],
    };
  } catch (error) {
    console.error('Get voter details error:', error);
    return null;
  }
};

// ============================================
// ENCRYPTED BALLOT FUNCTIONS
// ============================================

/**
 * Generate vote commitment
 */
export const generateVoteCommitment = (
  voterHash: string,
  encryptedVote: string,
  timestamp: number
): string => {
  const combined = `${voterHash}${encryptedVote}${timestamp}`;
  return keccak256(toUtf8Bytes(combined));
};

/**
 * Submit encrypted vote to blockchain
 */
export const submitEncryptedVote = async (
  epicNumber: string,
  encryptedVoteHash: string,
  ipfsHash: string,
  trackingCode: string
): Promise<{ success: boolean; txHash?: string; error?: string }> => {
  try {
    const contract = await getContract(
      CONTRACTS.EncryptedBallot,
      EncryptedBallotABI.abi
    );

    // Generate voter commitment (anonymized)
    const voterCommitment = keccak256(toUtf8Bytes(`voter_${epicNumber}_${Date.now()}`));
    const trackingCodeBytes32 = keccak256(toUtf8Bytes(trackingCode));

    toast.info('Submitting vote to blockchain...');

    // Estimate gas
    const gasLimit = await estimateGas(contract, 'castVote', [
      voterCommitment,
      encryptedVoteHash,
      ipfsHash,
      trackingCodeBytes32,
    ]);

    // Execute transaction
    const tx = await contract.castVote(
      voterCommitment,
      encryptedVoteHash,
      ipfsHash,
      trackingCodeBytes32,
      { gasLimit }
    );

    // Wait for confirmation
    const receipt = await waitForTransaction(tx.hash);

    // Also record on bulletin board
    await recordOnBulletinBoard(trackingCodeBytes32, encryptedVoteHash);

    return {
      success: receipt.status === 1,
      txHash: tx.hash,
    };
  } catch (error: any) {
    console.error('Vote submission error:', error);
    
    let errorMessage = 'Vote submission failed';
    if (error.message.includes('Polling not started')) {
      errorMessage = 'Polling has not started yet';
    } else if (error.message.includes('Polling ended')) {
      errorMessage = 'Polling period has ended';
    } else if (error.message.includes('user rejected')) {
      errorMessage = 'Transaction rejected by user';
    }

    toast.error(errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Verify vote on blockchain by tracking code
 */
export const verifyVoteOnChain = async (
  trackingCode: string
): Promise<{ exists: boolean; voteHash?: string; castAt?: number }> => {
  try {
    const contract = await getContract(
      CONTRACTS.EncryptedBallot,
      EncryptedBallotABI.abi
    );

    const trackingCodeBytes32 = keccak256(toUtf8Bytes(trackingCode));
    const result = await contract.verifyVoteByTrackingCode(trackingCodeBytes32);

    return {
      exists: result[0],
      voteHash: result[1],
      castAt: Number(result[2]),
    };
  } catch (error) {
    console.error('Vote verification error:', error);
    return { exists: false };
  }
};

/**
 * Check if polling is active
 */
export const isPollingActive = async (): Promise<boolean> => {
  try {
    const contract = await getContract(
      CONTRACTS.EncryptedBallot,
      EncryptedBallotABI.abi
    );

    return await contract.isPollingActive();
  } catch (error) {
    console.error('Polling status check error:', error);
    return false;
  }
};

// ============================================
// BULLETIN BOARD FUNCTIONS
// ============================================

/**
 * Record vote on bulletin board
 */
export const recordOnBulletinBoard = async (
  trackingCodeBytes32: string,
  voteCommitment: string
): Promise<boolean> => {
  try {
    const contract = await getContract(
      CONTRACTS.BulletinBoard,
      BulletinBoardABI.abi
    );

    const tx = await contract.recordVote(trackingCodeBytes32, voteCommitment);
    const receipt = await waitForTransaction(tx.hash);

    return receipt.status === 1;
  } catch (error) {
    console.error('Bulletin board recording error:', error);
    return false;
  }
};

/**
 * Verify vote on bulletin board
 */
export const verifyOnBulletinBoard = async (
  trackingCode: string
): Promise<{ exists: boolean; commitment?: string; timestamp?: number }> => {
  try {
    const contract = await getContract(
      CONTRACTS.BulletinBoard,
      BulletinBoardABI.abi
    );

    const trackingCodeBytes32 = keccak256(toUtf8Bytes(trackingCode));
    const result = await contract.getVoteRecord(trackingCodeBytes32);

    return {
      exists: result[2], // isValid
      commitment: result[0],
      timestamp: Number(result[1]),
    };
  } catch (error) {
    console.error('Bulletin board verification error:', error);
    return { exists: false };
  }
};

/**
 * Get bulletin board statistics
 */
export const getBulletinBoardStats = async (): Promise<{
  total: number;
  merkleRoot: string;
  electionId: string;
}> => {
  try {
    const contract = await getContract(
      CONTRACTS.BulletinBoard,
      BulletinBoardABI.abi
    );

    const stats = await contract.getStatistics();

    return {
      total: Number(stats[0]),
      merkleRoot: stats[1],
      electionId: stats[2],
    };
  } catch (error) {
    console.error('Get stats error:', error);
    return { total: 0, merkleRoot: '', electionId: '' };
  }
};

// ============================================
// TALLY VALIDATOR FUNCTIONS
// ============================================

/**
 * Get tally status
 */
export const getTallyStatus = async (): Promise<any> => {
  try {
    const contract = await getContract(
      CONTRACTS.TallyValidator,
      TallyValidatorABI.abi
    );

    const status = await contract.getTallyStatus();

    return {
      merkleRoot: status[0],
      ipfsHash: status[1],
      totalVotes: Number(status[2]),
      finalized: status[3],
      signatureCount: Number(status[4]),
      requiredSignatures: Number(status[5]),
    };
  } catch (error) {
    console.error('Get tally status error:', error);
    return null;
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get all contract addresses
 */
export const getContractAddresses = () => {
  return { ...CONTRACTS };
};

/**
 * Check if contracts are deployed
 */
export const areContractsDeployed = (): boolean => {
  return Object.values(CONTRACTS).every(addr => addr && addr !== '');
};

/**
 * Get Etherscan link for transaction
 */
export const getEtherscanLink = (txHash: string): string => {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
};

/**
 * Get Etherscan link for address
 */
export const getEtherscanAddressLink = (address: string): string => {
  return `https://sepolia.etherscan.io/address/${address}`;
};