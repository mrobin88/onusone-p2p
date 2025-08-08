/**
 * Fixed Token Economics - Sustainable Supply Management
 * Prevents early adopter domination and ensures long-term viability
 */

export interface TokenLimits {
  maxStakePerPost: number;
  maxStakePerUserDaily: number;
  maxTotalStakePerUser: number;
  stakingFeeRate: number;
  diminishingReturnsThreshold: number;
}

export interface TokenomicsConfig {
  totalSupply: number;
  circulatingSupply: number;
  newUserAllocation: number;
  dailyFaucetLimit: number;
  contentRewards: {
    postCreation: number;
    engagementBonus: number;
    curationReward: number;
  };
  burnRates: {
    decayBurn: number;
    penaltyBurn: number;
    transactionFee: number;
  };
  stakingRewards: {
    annualInflationRate: number;
    stakingAPY: number;
  };
}

// EMERGENCY: Ultra-conservative token economics to prevent collapse
export const SUSTAINABLE_TOKENOMICS: TokenomicsConfig = {
  totalSupply: 1_000_000_000,        // 1B tokens (fixed)
  circulatingSupply: 1_000_000,      // REDUCED: Only 1M initial circulation
  
  // EMERGENCY: No free tokens - all must be earned
  newUserAllocation: 0,              // ZERO free tokens (down from 1K)
  dailyFaucetLimit: 0,               // ZERO daily free tokens
  
  // NEW: Content creation rewards
  contentRewards: {
    postCreation: 50,                // 50 ONU for quality posts
    engagementBonus: 25,             // 25 ONU for popular content
    curationReward: 10,              // 10 ONU for good curation
  },
  
  // EMERGENCY: Aggressive burn mechanisms to prevent inflation
  burnRates: {
    decayBurn: 0.5,                  // 50% of stake when content decays (up from 10%)
    penaltyBurn: 0.8,                // 80% of stake for violations (up from 50%)
    transactionFee: 10,              // 10 ONU transaction fee (up from 1)
  },
  
  // NEW: Staking rewards from protocol
  stakingRewards: {
    annualInflationRate: 0.05,       // 5% annual inflation for rewards
    stakingAPY: 0.08,                // 8% APY for legitimate stakers
  }
};

// EMERGENCY: Ultra-strict staking limits to prevent depletion
export const STAKING_LIMITS: TokenLimits = {
  maxStakePerPost: 50,               // REDUCED: Maximum 50 ONU per post (90% reduction)
  maxStakePerUserDaily: 200,         // REDUCED: Daily limit 200 ONU (96% reduction)
  maxTotalStakePerUser: 2_000,       // REDUCED: Total stakes 2K ONU (96% reduction)
  stakingFeeRate: 0.1,               // INCREASED: 10% staking fee (up from 2%)
  diminishingReturnsThreshold: 25,   // REDUCED: Diminishing returns above 25 ONU
};

/**
 * Sustainable Token Economics Manager
 */
export class SustainableTokenEconomics {
  private config: TokenomicsConfig;
  private limits: TokenLimits;

  constructor(
    config: TokenomicsConfig = SUSTAINABLE_TOKENOMICS,
    limits: TokenLimits = STAKING_LIMITS
  ) {
    this.config = config;
    this.limits = limits;
  }

  /**
   * Calculate staking limits with diminishing returns
   */
  calculateStakeEfficiency(stakeAmount: number): {
    effectiveStake: number;
    efficiency: number;
    fee: number;
  } {
    // Apply staking fee
    const fee = stakeAmount * this.limits.stakingFeeRate;
    const netStake = stakeAmount - fee;
    
    // Calculate efficiency with diminishing returns
    let effectiveStake: number;
    let efficiency: number;
    
    // EMERGENCY: Much more aggressive diminishing returns
    if (netStake <= 25) {
      effectiveStake = netStake;
      efficiency = 1.0; // 100% efficiency (only for very small stakes)
    } else if (netStake <= 50) {
      effectiveStake = 25 + (netStake - 25) * 0.5;
      efficiency = 0.5; // 50% efficiency (diminishing returns start early)
    } else {
      effectiveStake = 37.5; // Hard cap at ~38 effective stake
      efficiency = 0.0; // 0% efficiency above 50 ONU
    }
    
    return { effectiveStake, efficiency, fee };
  }

  /**
   * Validate staking transaction against limits
   */
  validateStakeTransaction(
    userId: string,
    postId: string,
    stakeAmount: number,
    userTotalStake: number,
    userDailyStake: number
  ): { isValid: boolean; errors: string[]; adjustedAmount?: number } {
    const errors: string[] = [];
    let adjustedAmount = stakeAmount;
    
    // Check per-post limit
    if (stakeAmount > this.limits.maxStakePerPost) {
      errors.push(`Maximum stake per post is ${this.limits.maxStakePerPost} ONU`);
      adjustedAmount = this.limits.maxStakePerPost;
    }
    
    // Check daily staking limit
    if (userDailyStake + stakeAmount > this.limits.maxStakePerUserDaily) {
      const remainingDaily = this.limits.maxStakePerUserDaily - userDailyStake;
      errors.push(`Daily staking limit exceeded. Remaining: ${remainingDaily} ONU`);
      adjustedAmount = Math.min(adjustedAmount, remainingDaily);
    }
    
    // Check total stake limit
    if (userTotalStake + stakeAmount > this.limits.maxTotalStakePerUser) {
      const remainingTotal = this.limits.maxTotalStakePerUser - userTotalStake;
      errors.push(`Total stake limit exceeded. Remaining: ${remainingTotal} ONU`);
      adjustedAmount = Math.min(adjustedAmount, remainingTotal);
    }
    
    // Check minimum stake
    if (adjustedAmount < 1) {
      errors.push('Minimum stake is 1 ONU');
      adjustedAmount = 0;
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      adjustedAmount: adjustedAmount > 0 ? adjustedAmount : undefined
    };
  }

  /**
   * Calculate content creation rewards
   */
  calculateContentReward(
    type: 'post' | 'comment' | 'curation',
    quality: number, // 0-100 quality score
    engagement: number // engagement count
  ): number {
    let baseReward: number;
    
    switch (type) {
      case 'post':
        baseReward = this.config.contentRewards.postCreation;
        break;
      case 'comment':
        baseReward = this.config.contentRewards.postCreation * 0.5; // 50% of post reward
        break;
      case 'curation':
        baseReward = this.config.contentRewards.curationReward;
        break;
      default:
        return 0;
    }
    
    // Quality multiplier (0.5x to 2x)
    const qualityMultiplier = 0.5 + (quality / 100) * 1.5;
    
    // Engagement bonus (max 2x)
    const engagementBonus = Math.min(engagement * 2, baseReward);
    
    return Math.round(baseReward * qualityMultiplier + engagementBonus);
  }

  /**
   * Calculate staking rewards
   */
  calculateStakingReward(
    stakeAmount: number,
    stakingDurationDays: number
  ): number {
    const annualReward = stakeAmount * this.config.stakingRewards.stakingAPY;
    const dailyReward = annualReward / 365;
    return Math.round(dailyReward * stakingDurationDays);
  }

  /**
   * Calculate burn amount based on decay score
   */
  calculateDecayBurn(
    totalStaked: number,
    decayScore: number
  ): { burnAmount: number; rewardAmount: number } {
    let burnAmount = 0;
    let rewardAmount = 0;
    
    if (decayScore < 10) {
      burnAmount = totalStaked * 0.5; // 50% burn for very low quality
    } else if (decayScore < 25) {
      burnAmount = totalStaked * 0.2; // 20% burn for low quality
    } else if (decayScore < 50) {
      burnAmount = totalStaked * 0.1; // 10% burn for medium quality
    } else if (decayScore > 75) {
      rewardAmount = totalStaked * 0.02; // 2% reward for high quality
    }
    
    return { burnAmount: Math.round(burnAmount), rewardAmount: Math.round(rewardAmount) };
  }

  /**
   * Get current supply metrics
   */
  async getSupplyMetrics(): Promise<{
    totalSupply: number;
    circulatingSupply: number;
    burnedTokens: number;
    stakedTokens: number;
    availableSupply: number;
    inflationRate: number;
  }> {
    // TODO: Implement actual data fetching from KV
    return {
      totalSupply: this.config.totalSupply,
      circulatingSupply: this.config.circulatingSupply,
      burnedTokens: 0,
      stakedTokens: 0,
      availableSupply: this.config.circulatingSupply,
      inflationRate: this.config.stakingRewards.annualInflationRate
    };
  }

  /**
   * Check if token distribution is sustainable
   */
  async validateSupplySustainability(
    projectedUsers: number,
    projectedDailyActivity: number
  ): Promise<{
    isSustainable: boolean;
    yearsUntilDepletion?: number;
    recommendations: string[];
  }> {
    const metrics = await this.getSupplyMetrics();
    const recommendations: string[] = [];
    
    // Calculate daily token demand
    const dailyNewUsers = projectedUsers / 365;
    const dailyAllocation = dailyNewUsers * this.config.newUserAllocation;
    const dailyContentRewards = projectedDailyActivity * this.config.contentRewards.postCreation;
    const dailyFaucetDistribution = projectedUsers * this.config.dailyFaucetLimit;
    
    const totalDailyDemand = dailyAllocation + dailyContentRewards + dailyFaucetDistribution;
    
    // Calculate daily token burns
    const estimatedDailyBurns = projectedDailyActivity * 50; // Estimate
    
    const netDailyChange = totalDailyDemand - estimatedDailyBurns;
    
    if (netDailyChange > 0) {
      const yearsUntilDepletion = metrics.availableSupply / (netDailyChange * 365);
      
      if (yearsUntilDepletion < 5) {
        recommendations.push('Reduce new user allocation');
        recommendations.push('Increase burn rates');
        recommendations.push('Implement token mining mechanisms');
        
        return {
          isSustainable: false,
          yearsUntilDepletion,
          recommendations
        };
      }
    }
    
    return {
      isSustainable: true,
      recommendations: ['Token economics appear sustainable']
    };
  }
}

// Global instance
export const sustainableTokenEconomics = new SustainableTokenEconomics();
export default SustainableTokenEconomics;
