import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  Keypair,
  sendAndConfirmTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import {
  createTransferInstruction,
  createBurnInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  getAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError
} from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Solana configuration
const SOLANA_CONFIG = {
  RPC_ENDPOINT: process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY 
    ? `https://solana-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY}`
    : 'https://api.mainnet-beta.solana.com',
  TOKEN_MINT: process.env.NEXT_PUBLIC_TOKEN_MINT!,
  TREASURY_ADDRESS: process.env.NEXT_PUBLIC_TREASURY_ADDRESS!,
  TOKEN_DECIMALS: 6,
  NETWORK: process.env.NODE_ENV === 'production' ? 'mainnet-beta' : 'devnet',
};

export interface SolanaTransactionResult {
  success: boolean;
  txSig?: string;
  error?: string;
  details?: any;
}

export interface StakeTransactionParams {
  amount: number;
  postId: string;
  type: 'post' | 'boost';
}

export interface TransferTransactionParams {
  amount: number;
  recipientAddress: string;
  memo?: string;
}

export interface BurnTransactionParams {
  amount: number;
  reason?: string;
}

/**
 * Solana Transaction Manager
 * Handles all Solana blockchain transactions for OnusOne
 */
export class SolanaTransactionManager {
  private connection: Connection;
  private tokenMint: PublicKey;
  private treasuryAddress: PublicKey;

  constructor() {
    this.connection = new Connection(SOLANA_CONFIG.RPC_ENDPOINT, 'confirmed');
    this.tokenMint = new PublicKey(SOLANA_CONFIG.TOKEN_MINT);
    this.treasuryAddress = new PublicKey(SOLANA_CONFIG.TREASURY_ADDRESS);
  }

  /**
   * Get or create associated token account for user
   */
  private async getOrCreateTokenAccount(
    userPublicKey: PublicKey,
    wallet: WalletContextState,
    isPayerSigner: boolean = true
  ): Promise<{ tokenAccount: PublicKey; instructions: TransactionInstruction[] }> {
    const associatedTokenAddress = await getAssociatedTokenAddress(
      this.tokenMint,
      userPublicKey,
      false, // allowOwnerOffCurve
      TOKEN_PROGRAM_ID
    );

    const instructions: TransactionInstruction[] = [];

    try {
      // Check if token account exists
      await getAccount(this.connection, associatedTokenAddress);
    } catch (error) {
      if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
        // Create associated token account if it doesn't exist
        const createATAInstruction = createAssociatedTokenAccountInstruction(
          userPublicKey, // payer
          associatedTokenAddress, // ata
          userPublicKey, // owner
          this.tokenMint // mint
        );
        instructions.push(createATAInstruction);
      } else {
        throw error;
      }
    }

    return {
      tokenAccount: associatedTokenAddress,
      instructions
    };
  }

  /**
   * Create transaction for staking tokens
   */
  async createStakeTransaction(
    params: StakeTransactionParams,
    wallet: WalletContextState
  ): Promise<{ transaction: Transaction; instructions: TransactionInstruction[] }> {
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const { amount, postId, type } = params;
    
    // Convert amount to token units (6 decimals for ONU)
    const tokenAmount = BigInt(amount * Math.pow(10, SOLANA_CONFIG.TOKEN_DECIMALS));

    // Get user's token account
    const { tokenAccount: userTokenAccount, instructions: setupInstructions } = 
      await this.getOrCreateTokenAccount(wallet.publicKey, wallet);

    // Get treasury token account
    const { tokenAccount: treasuryTokenAccount, instructions: treasurySetupInstructions } = 
      await this.getOrCreateTokenAccount(this.treasuryAddress, wallet, false);

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      userTokenAccount, // source
      treasuryTokenAccount, // destination
      wallet.publicKey, // owner
      tokenAmount, // amount in token units
      [], // multiSigners
      TOKEN_PROGRAM_ID
    );

    // Add memo instruction for tracking
    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
      data: Buffer.from(`OnusOne Stake: ${type}:${postId}:${amount}`, 'utf8')
    });

    const allInstructions = [
      ...setupInstructions,
      ...treasurySetupInstructions,
      transferInstruction,
      memoInstruction
    ];

    // Create transaction
    const transaction = new Transaction();
    transaction.add(...allInstructions);

    // Set recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    return {
      transaction,
      instructions: allInstructions
    };
  }

  /**
   * Create transaction for transferring tokens to another user
   */
  async createTransferTransaction(
    params: TransferTransactionParams,
    wallet: WalletContextState
  ): Promise<{ transaction: Transaction; instructions: TransactionInstruction[] }> {
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const { amount, recipientAddress, memo } = params;
    const recipientPublicKey = new PublicKey(recipientAddress);
    
    // Convert amount to token units
    const tokenAmount = BigInt(amount * Math.pow(10, SOLANA_CONFIG.TOKEN_DECIMALS));

    // Get sender's token account
    const { tokenAccount: senderTokenAccount, instructions: senderSetupInstructions } = 
      await this.getOrCreateTokenAccount(wallet.publicKey, wallet);

    // Get recipient's token account
    const { tokenAccount: recipientTokenAccount, instructions: recipientSetupInstructions } = 
      await this.getOrCreateTokenAccount(recipientPublicKey, wallet, false);

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      senderTokenAccount, // source
      recipientTokenAccount, // destination
      wallet.publicKey, // owner
      tokenAmount, // amount in token units
      [], // multiSigners
      TOKEN_PROGRAM_ID
    );

    const instructions = [
      ...senderSetupInstructions,
      ...recipientSetupInstructions,
      transferInstruction
    ];

    // Add memo if provided
    if (memo) {
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: Buffer.from(`OnusOne: ${memo}`, 'utf8')
      });
      instructions.push(memoInstruction);
    }

    // Create transaction
    const transaction = new Transaction();
    transaction.add(...instructions);

    // Set recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    return {
      transaction,
      instructions
    };
  }

  /**
   * Execute transaction using wallet
   */
  async executeTransaction(
    transaction: Transaction,
    wallet: WalletContextState,
    description?: string
  ): Promise<SolanaTransactionResult> {
    try {
      if (!wallet.publicKey || !wallet.signTransaction) {
        return {
          success: false,
          error: 'Wallet not properly connected'
        };
      }

      console.log(`🔗 Executing Solana transaction: ${description || 'Unknown'}`);

      // Sign transaction with wallet
      const signedTransaction = await wallet.signTransaction(transaction);

      // Send transaction
      const txSig = await this.connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        }
      );

      console.log(`📡 Transaction sent: ${txSig}`);

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(
        txSig,
        'confirmed'
      );

      if (confirmation.value.err) {
        return {
          success: false,
          error: `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
          txSig
        };
      }

      console.log(`✅ Transaction confirmed: ${txSig}`);

      return {
        success: true,
        txSig,
        details: {
          slot: confirmation.context.slot,
          confirmationStatus: 'confirmed'
        }
      };

    } catch (error) {
      console.error('Transaction execution failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown transaction error',
        details: error
      };
    }
  }

  /**
   * Execute stake transaction (complete flow)
   */
  async executeStakeTransaction(
    params: StakeTransactionParams,
    wallet: WalletContextState
  ): Promise<SolanaTransactionResult> {
    try {
      // Create transaction
      const { transaction } = await this.createStakeTransaction(params, wallet);

      // Execute transaction
      const result = await this.executeTransaction(
        transaction,
        wallet,
        `Stake ${params.amount} ONU on ${params.type} ${params.postId}`
      );

      return result;

    } catch (error) {
      console.error('Stake transaction failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stake transaction failed'
      };
    }
  }

  /**
   * Execute transfer transaction (complete flow)
   */
  async executeTransferTransaction(
    params: TransferTransactionParams,
    wallet: WalletContextState
  ): Promise<SolanaTransactionResult> {
    try {
      // Create transaction
      const { transaction } = await this.createTransferTransaction(params, wallet);

      // Execute transaction
      const result = await this.executeTransaction(
        transaction,
        wallet,
        `Transfer ${params.amount} ONU to ${params.recipientAddress.slice(0, 8)}...`
      );

      return result;

    } catch (error) {
      console.error('Transfer transaction failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transfer transaction failed'
      };
    }
  }

  /**
   * Get user's token balance
   */
  async getTokenBalance(userPublicKey: PublicKey): Promise<number> {
    try {
      const tokenAccount = await getAssociatedTokenAddress(
        this.tokenMint,
        userPublicKey,
        false,
        TOKEN_PROGRAM_ID
      );

      const account = await getAccount(this.connection, tokenAccount);
      const balance = Number(account.amount) / Math.pow(10, SOLANA_CONFIG.TOKEN_DECIMALS);
      
      return balance;

    } catch (error) {
      if (error instanceof TokenAccountNotFoundError) {
        return 0; // No token account means 0 balance
      }
      throw error;
    }
  }

  /**
   * Get SOL balance for transaction fees
   */
  async getSolBalance(userPublicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(userPublicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get SOL balance:', error);
      return 0;
    }
  }

  /**
   * Estimate transaction fees
   */
  async estimateTransactionFee(transaction: Transaction): Promise<number> {
    try {
      const feeCalculator = await this.connection.getFeeForMessage(
        transaction.compileMessage(),
        'confirmed'
      );
      
      return (feeCalculator?.value || 5000) / LAMPORTS_PER_SOL; // Return in SOL
    } catch (error) {
      console.error('Failed to estimate transaction fee:', error);
      return 0.001; // Default estimate: 0.001 SOL
    }
  }

  /**
   * Validate transaction parameters
   */
  validateStakeParams(params: StakeTransactionParams): { isValid: boolean; error?: string } {
    const { amount, postId, type } = params;

    if (amount <= 0) {
      return { isValid: false, error: 'Amount must be positive' };
    }

    if (amount > 1000000) {
      return { isValid: false, error: 'Amount too large (max 1M tokens)' };
    }

    if (!postId || postId.length < 5) {
      return { isValid: false, error: 'Invalid post ID' };
    }

    if (!['post', 'boost'].includes(type)) {
      return { isValid: false, error: 'Invalid stake type' };
    }

    return { isValid: true };
  }

  validateTransferParams(params: TransferTransactionParams): { isValid: boolean; error?: string } {
    const { amount, recipientAddress } = params;

    if (amount <= 0) {
      return { isValid: false, error: 'Amount must be positive' };
    }

    if (amount > 1000000) {
      return { isValid: false, error: 'Amount too large (max 1M tokens)' };
    }

    try {
      new PublicKey(recipientAddress);
    } catch {
      return { isValid: false, error: 'Invalid recipient address' };
    }

    return { isValid: true };
  }
}

// Global instance
let solanaManager: SolanaTransactionManager | null = null;

/**
 * Get global Solana transaction manager instance
 */
export function getSolanaTransactionManager(): SolanaTransactionManager {
  if (!solanaManager) {
    solanaManager = new SolanaTransactionManager();
  }
  return solanaManager;
}

export default SolanaTransactionManager;
