// ONU Token Configuration
export const ONU_CONFIG = {
  // Deployed ONU Token Program
  TOKEN_MINT: 'G3UL7e6JoWgNBxMuzCNRYesPSB35WR4zbBwaMUYNqNmM',
  TREASURY_ADDRESS: 'G3UL7e6JoWgNBxMuzCNRYesPSB35WR4zbBwaMUYNqNmM',
  PROGRAM_ID: 'G3UL7e6JoWgNBxMuzCNRYesPSB35WR4zbBwaMUYNqNmM',
  
  // Solana Network
  NETWORK: 'mainnet',
  RPC_URL: 'https://solana-mainnet.g.alchemy.com/v2/LBo6Iza6EaQqGcoqRF83h',
  
  // Token Economics
  INITIAL_SUPPLY: 1_000_000_000, // 1 billion ONU tokens
  DECAY_TAX_RATE: 0.1, // 10% tax to treasury when content decays
  STAKE_REWARD_RATE: 0.05, // 5% APY for staking
  
  // Decay Configuration
  BASE_DECAY_RATE: 8, // 8 points per hour
  ENGAGEMENT_BONUS: 2, // +2 points per engagement
  CLOSE_THRESHOLD: 15, // Content closes below 15 points
};

// P2P Network Configuration
export const P2P_CONFIG = {
  // Backend node URLs - will be overridden by environment variables
  BOOTSTRAP_NODES: [
    process.env.NEXT_PUBLIC_P2P_BACKEND_URL || 'https://onusone-p2p.onrender.com',
    process.env.NEXT_PUBLIC_P2P_BACKEND_URL_2 || 'http://localhost:8889',
    process.env.NEXT_PUBLIC_P2P_BACKEND_URL_3 || 'http://localhost:8890'
  ],

  // WebSocket endpoints
  WEBSOCKET_ENDPOINTS: [
    (process.env.NEXT_PUBLIC_P2P_BACKEND_URL || 'https://onusone-p2p.onrender.com').replace('http://', 'ws://').replace('https://', 'wss://'),
    (process.env.NEXT_PUBLIC_P2P_BACKEND_URL_2 || 'http://localhost:8889').replace('http://', 'ws://').replace('https://', 'wss://'),
    (process.env.NEXT_PUBLIC_P2P_BACKEND_URL_3 || 'http://localhost:8890').replace('http://', 'ws://').replace('https://', 'wss://')
  ],

  // API endpoints for the working backend
  API_ENDPOINTS: {
    BOARDS: '/api/boards',
    MESSAGES: '/api/boards/:slug/messages',
    USERS: '/api/users/:username',
    HEALTH: '/health',
    TEST: '/api/test'
  },
  
  // Connection settings
  CONNECTION_TIMEOUT: 10000,
  RECONNECT_ATTEMPTS: 5,
  HEARTBEAT_INTERVAL: 30000,
  
  // Node requirements
  MIN_STAKE_ONU: 100,
  EARNINGS_RATE: 0.4, // 40% of fees go to edge nodes
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
