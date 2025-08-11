// ONU Token Configuration
export const ONU_CONFIG = {
  // Deployed ONU Token Program
  TOKEN_MINT: 'G3UL7e6JoWgNBxMuzCNRYesPSB35WR4zbBwaMUYNqNmM',
  TREASURY_ADDRESS: 'G3UL7e6JoWgNBxMuzCNRYesPSB35WR4zbBwaMUYNqNmM',
  PROGRAM_ID: 'G3UL7e6JoWgNBxMuzCNRYesPSB35WR4zbBwaMUYNqNmM',
  
  // Solana Network
  NETWORK: 'devnet',
  RPC_URL: 'https://api.devnet.solana.com',
  
  // Token Economics
  INITIAL_SUPPLY: 1_000_000_000, // 1 billion ONU tokens
  DECAY_TAX_RATE: 0.1, // 10% tax to treasury when content decays
  STAKE_REWARD_RATE: 0.05, // 5% APY for staking
  
  // Decay Configuration
  BASE_DECAY_RATE: 8, // 8 points per hour
  ENGAGEMENT_BONUS: 2, // +2 points per engagement
  CLOSE_THRESHOLD: 15, // Content closes below 15 points
};

// Treasury Configuration
export const TREASURY_CONFIG = {
  ADDRESS: 'G3UL7e6JoWgNBxMuzCNRYesPSB35WR4zbBwaMUYNqNmM',
  TAX_RATE: 0.1, // 10% of decayed content goes to treasury
  DISTRIBUTION: {
    NODE_OPERATORS: 0.7, // 70% to node operators
    STAKERS: 0.2, // 20% to stakers
    PLATFORM: 0.1, // 10% to platform (you)
  }
};
