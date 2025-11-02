// backend/services/aptosService.js
const { AptosClient, AptosAccount, TxnBuilderTypes, BCS, HexString } = require('aptos');
const crypto = require('crypto');

const NODE_URL = process.env.APTOS_NODE_URL || 'https://fullnode.devnet.aptoslabs.com/v1';
const MODULE_ADDRESS = process.env.MODULE_ADDRESS;
const PRIVATE_KEY = process.env.APTOS_PRIVATE_KEY;

class AptosService {
  constructor() {
    this.client = new AptosClient(NODE_URL);
    this.account = null;
    
    if (PRIVATE_KEY) {
      this.initializeAccount();
    }
  }

  /**
   * Initialize admin account from private key
   */
  initializeAccount() {
    try {
      const privateKeyBytes = new HexString(PRIVATE_KEY).toUint8Array();
      this.account = new AptosAccount(privateKeyBytes);
      console.log('✅ Aptos account initialized:', this.account.address().hex());
    } catch (error) {
      console.error('❌ Failed to initialize Aptos account:', error);
    }
  }

  /**
   * Hash data using SHA-256
   */
  hashData(data) {
    return crypto.createHash('sha256').update(data).digest();
  }

  /**
   * Create transaction payload
   */
  createPayload(functionName, typeArgs = [], args = []) {
    // Expect functionName in the form "module_name::function_name"
    // EntryFunction.natural expects (module_id_string, function_name, type_args, args)
    try {
      const parts = functionName.split('::');
      if (parts.length !== 2) {
        throw new Error('functionName must be in the form "module::function"');
      }
      const moduleName = parts[0];
      const fnName = parts[1];

      const moduleId = `${MODULE_ADDRESS}::${moduleName}`;

      return new TxnBuilderTypes.TransactionPayloadEntryFunction(
        TxnBuilderTypes.EntryFunction.natural(
          moduleId,
          fnName,
          typeArgs,
          args
        )
      );
    } catch (err) {
      console.error('createPayload error:', err.message);
      throw err;
    }
  }

  /**
   * Submit transaction (admin)
   */
  async submitTransaction(functionName, typeArgs = [], args = []) {
    try {
      if (!this.account) {
        throw new Error('Admin account not initialized');
      }

      const payload = this.createPayload(functionName, typeArgs, args);
      const txnRequest = await this.client.generateTransaction(
        this.account.address(),
        payload
      );

      const signedTxn = await this.client.signTransaction(this.account, txnRequest);
      const transactionRes = await this.client.submitTransaction(signedTxn);
      
      await this.client.waitForTransaction(transactionRes.hash);

      return {
        success: true,
        txHash: transactionRes.hash,
      };
    } catch (error) {
      console.error('Transaction error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * View function (read-only)
   */
  async viewFunction(functionName, typeArgs = [], args = []) {
    try {
      const payload = {
        function: `${MODULE_ADDRESS}::${functionName}`,
        type_arguments: typeArgs,
        arguments: args,
      };

      const result = await this.client.view(payload);
      return result;
    } catch (error) {
      console.error('View function error:', error);
      throw error;
    }
  }

  // ============================================
  // VOTER REGISTRY FUNCTIONS
  // ============================================

  /**
   * Check voter eligibility
   */
  async checkVoterEligibility(epicNumber) {
    try {
      const epicHash = this.hashData(epicNumber);
      const result = await this.viewFunction(
        'voter_registry::is_voter_eligible',
        [],
        [Array.from(epicHash)]
      );

      return result[0] === true;
    } catch (error) {
      console.error('Eligibility check error:', error);
      return false;
    }
  }

  /**
   * Get voter details
   */
  async getVoterDetails(epicNumber) {
    try {
      const epicHash = this.hashData(epicNumber);
      const result = await this.viewFunction(
        'voter_registry::get_voter_details',
        [],
        [Array.from(epicHash)]
      );

      return {
        isActive: result[0],
        registeredAt: parseInt(result[1]),
        isStruckOff: result[2],
        hasVoted: result[3],
      };
    } catch (error) {
      console.error('Get voter details error:', error);
      return null;
    }
  }

  /**
   * Get total registered voters
   */
  async getTotalRegistered() {
    try {
      const result = await this.viewFunction(
        'voter_registry::get_total_registered',
        [],
        []
      );

      return parseInt(result[0]);
    } catch (error) {
      console.error('Get total registered error:', error);
      return 0;
    }
  }

  /**
   * Mark voter as voted (admin function)
   */
  async markVoterVoted(epicNumber) {
    try {
      const epicHash = this.hashData(epicNumber);
      
      return await this.submitTransaction(
        'voter_registry::mark_voted',
        [],
        [Array.from(epicHash)]
      );
    } catch (error) {
      console.error('Mark voted error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset voting status (for re-voting)
   */
  async resetVotedStatus(epicNumber) {
    try {
      const epicHash = this.hashData(epicNumber);
      
      return await this.submitTransaction(
        'voter_registry::reset_voted_status',
        [],
        [Array.from(epicHash)]
      );
    } catch (error) {
      console.error('Reset voted status error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // ENCRYPTED BALLOT FUNCTIONS
  // ============================================

  /**
   * Verify vote by tracking code
   */
  async verifyVoteByTrackingCode(trackingCode) {
    try {
      const trackingCodeHash = this.hashData(trackingCode);
      const result = await this.viewFunction(
        'encrypted_ballot::verify_vote',
        [],
        [Array.from(trackingCodeHash)]
      );

      return {
        exists: result[0],
        voteHash: result[1],
        castAt: parseInt(result[2]),
      };
    } catch (error) {
      console.error('Verify vote error:', error);
      return { exists: false };
    }
  }

  /**
   * Check if polling is active
   */
  async isPollingActive() {
    try {
      const result = await this.viewFunction(
        'encrypted_ballot::is_polling_active',
        [],
        []
      );

      return result[0] === true;
    } catch (error) {
      console.error('Polling active check error:', error);
      return false;
    }
  }

  /**
   * Get vote count
   */
  async getVoteCount() {
    try {
      const result = await this.viewFunction(
        'encrypted_ballot::get_vote_count',
        [],
        []
      );

      return parseInt(result[0]);
    } catch (error) {
      console.error('Get vote count error:', error);
      return 0;
    }
  }

  /**
   * Update merkle root (admin function)
   */
  async updateMerkleRoot(merkleRoot) {
    try {
      const merkleRootBytes = Buffer.from(merkleRoot, 'hex');
      
      return await this.submitTransaction(
        'encrypted_ballot::update_merkle_root',
        [],
        [Array.from(merkleRootBytes)]
      );
    } catch (error) {
      console.error('Update merkle root error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // BULLETIN BOARD FUNCTIONS
  // ============================================

  /**
   * Get vote record from bulletin board
   */
  async getVoteRecord(trackingCode) {
    try {
      const trackingCodeHash = this.hashData(trackingCode);
      const result = await this.viewFunction(
        'bulletin_board::get_vote_record',
        [],
        [Array.from(trackingCodeHash)]
      );

      return {
        commitment: result[0],
        timestamp: parseInt(result[1]),
        isValid: result[2],
      };
    } catch (error) {
      console.error('Get vote record error:', error);
      return null;
    }
  }

  /**
   * Get bulletin board statistics
   */
  async getBulletinBoardStats() {
    try {
      const result = await this.viewFunction(
        'bulletin_board::get_statistics',
        [],
        []
      );

      return {
        totalRecords: parseInt(result[0]),
        merkleRoot: result[1],
        electionId: result[2],
      };
    } catch (error) {
      console.error('Get bulletin stats error:', error);
      return null;
    }
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  /**
   * Get transaction details
   */
  async getTransaction(txHash) {
    try {
      return await this.client.getTransactionByHash(txHash);
    } catch (error) {
      console.error('Get transaction error:', error);
      return null;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address = null) {
    try {
      const addr = address || this.account?.address().hex();
      if (!addr) throw new Error('No address provided');

      const resources = await this.client.getAccountResources(addr);
      const accountResource = resources.find(
        (r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
      );

      if (accountResource) {
        const balance = accountResource.data.coin.value;
        return (parseInt(balance) / 100000000).toFixed(8);
      }

      return '0';
    } catch (error) {
      console.error('Get balance error:', error);
      return '0';
    }
  }

  /**
   * Get Aptos Explorer link
   */
  getExplorerLink(txHash) {
    const network = NODE_URL.includes('devnet') ? 'devnet' : 
                   NODE_URL.includes('testnet') ? 'testnet' : 'mainnet';
    return `https://explorer.aptoslabs.com/txn/${txHash}?network=${network}`;
  }
}

// Export singleton instance
const aptosService = new AptosService();
module.exports = aptosService;