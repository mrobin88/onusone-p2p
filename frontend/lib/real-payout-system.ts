/**
 * REAL Payout System - Actual ONU Token Transfers
 * When posts decay, users get paid, treasury gets taxed
 */

import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  getAccount,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { ONU_CONFIG, TREASURY_CONFIG } from '../env.config';

export interface DecayPayout {
  contentId: string;
  userId: string;
  userAddress: string;
  stakeAmount: number;
  decayScore: number;
  payoutAmount: number;
  treasuryTax: number;
  timestamp: number;
  transactionSignature?: string;
}

export interface TreasuryTax {
  contentId: string;
  amount: number;
  timestamp: number;
  transactionSignature?: string;
}

export class RealPayoutSystem {
  private connection: Connection;
  private treasuryAddress: PublicKey;
  private onuMint: PublicKey;

  constructor() {
    this.connection = new Connection(ONU_CONFIG.RPC_URL, 'confirmed');
    this.treasuryAddress = new PublicKey(ONU_CONFIG.TREASURY_ADDRESS);
    this.onuMint = new PublicKey(ONU_CONFIG.TOKEN_MINT);
  }

  /**
   * Process payout when content decays
   * User gets 90% of their stake, treasury gets 10% tax
   */
  async processDecayPayout(
    contentId: string,
    userId: string,
    userAddress: string,
    stakeAmount: number,
    decayScore: number
  ): Promise<DecayPayout> {
    try {
      console.log(`💰 Processing decay payout for content ${contentId}`);
      
      // Calculate amounts
      const treasuryTax = Math.floor(stakeAmount * TREASURY_CONFIG.TAX_RATE);
      const userPayout = stakeAmount - treasuryTax;
      
      const payout: DecayPayout = {
        contentId,
        userId,
        userAddress,
        stakeAmount,
        decayScore,
        payoutAmount: userPayout,
        treasuryTax,
        timestamp: Date.now()
      };

      // Transfer tokens to user
      if (userPayout > 0) {
        const userSignature = await this.transferTokensToUser(
          userAddress,
          userPayout,
          `Decay payout for content ${contentId}`
        );
        payout.transactionSignature = userSignature;
        console.log(`✅ Paid ${userPayout} ONU to user ${userAddress}`);
      }

      // Collect treasury tax
      if (treasuryTax > 0) {
        const treasurySignature = await this.collectTreasuryTax(
          contentId,
          treasuryTax
        );
        console.log(`💰 Collected ${treasuryTax} ONU tax to treasury`);
      }

      return payout;

    } catch (error) {
      console.error('Failed to process decay payout:', error);
      throw error;
    }
  }

  /**
   * Transfer ONU tokens to user wallet
   */
  private async transferTokensToUser(
    userAddress: string,
    amount: number,
    memo: string
  ): Promise<string> {
    try {
      const userPubkey = new PublicKey(userAddress);
      
      // Get treasury token account
      const treasuryTokenAccount = await getAssociatedTokenAddress(
        this.onuMint,
        this.treasuryAddress
      );

      // Get user token account
      let userTokenAccount = await getAssociatedTokenAddress(
        this.onuMint,
        userPubkey
      );

      // Check if user has token account, create if not
      try {
        await getAccount(this.connection, userTokenAccount);
      } catch (error) {
        // Create token account for user
        const createAccountIx = createAssociatedTokenAccountInstruction(
          this.treasuryAddress, // payer
          userTokenAccount,
          userPubkey,
          this.onuMint
        );
        
        const transaction = new Transaction().add(createAccountIx);
        await sendAndConfirmTransaction(this.connection, transaction, []);
      }

      // Transfer tokens from treasury to user
      const transferIx = createTransferInstruction(
        treasuryTokenAccount,
        userTokenAccount,
        this.treasuryAddress,
        amount
      );

      const transaction = new Transaction().add(transferIx);
      const signature = await sendAndConfirmTransaction(this.connection, transaction, []);
      
      return signature;

    } catch (error) {
      console.error('Failed to transfer tokens to user:', error);
      throw error;
    }
  }

  /**
   * Collect treasury tax (tokens already in treasury from decay)
   */
  private async collectTreasuryTax(
    contentId: string,
    amount: number
  ): Promise<string> {
    try {
      // Tax is already collected when content decays
      // This function logs the tax collection
      console.log(`💰 Treasury tax collected: ${amount} ONU from content ${contentId}`);
      
      // In a real implementation, you might want to:
      // 1. Distribute some to node operators
      // 2. Keep some for platform development
      // 3. Burn a small portion for deflation
      
      return 'tax_collected'; // Placeholder for actual transaction

    } catch (error) {
      console.error('Failed to collect treasury tax:', error);
      throw error;
    }
  }

  /**
   * Get user's ONU token balance
   */
  async getUserBalance(userAddress: string): Promise<number> {
    try {
      const userPubkey = new PublicKey(userAddress);
      const userTokenAccount = await getAssociatedTokenAddress(
        this.onuMint,
        userPubkey
      );

      try {
        const account = await getAccount(this.connection, userTokenAccount);
        return Number(account.amount);
      } catch (error) {
        return 0; // No token account
      }

    } catch (error) {
      console.error('Failed to get user balance:', error);
      return 0;
    }
  }

  /**
   * Get treasury balance
   */
  async getTreasuryBalance(): Promise<number> {
    try {
      const treasuryTokenAccount = await getAssociatedTokenAddress(
        this.onuMint,
        this.treasuryAddress
      );

      try {
        const account = await getAccount(this.connection, treasuryTokenAccount);
        return Number(account.amount);
      } catch (error) {
        return 0; // No treasury account
      }

    } catch (error) {
      console.error('Failed to get treasury balance:', error);
      return 0;
    }
  }

  /**
   * Process batch payouts for multiple decayed content
   */
  async processBatchPayouts(payouts: Array<{
    contentId: string;
    userId: string;
    userAddress: string;
    stakeAmount: number;
    decayScore: number;
  }>): Promise<DecayPayout[]> {
    const results: DecayPayout[] = [];
    
    for (const payout of payouts) {
      try {
        const result = await this.processDecayPayout(
          payout.contentId,
          payout.userId,
          payout.userAddress,
          payout.stakeAmount,
          payout.decayScore
        );
        results.push(result);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Failed to process payout for content ${payout.contentId}:`, error);
        // Continue with other payouts
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const realPayoutSystem = new RealPayoutSystem();
