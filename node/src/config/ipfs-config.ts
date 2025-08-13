/**
 * IPFS Configuration for OnusOne P2P
 * Supports both local development and Render deployment
 */

export interface IPFSConfig {
  host: string;
  port: number;
  protocol: string;
  projectId?: string;
  projectSecret?: string;
}

export const getIPFSConfig = (): IPFSConfig => {
  // Check if we're in production (Render)
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Production: Use Infura IPFS
    return {
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
      projectId: process.env.IPFS_INFURA_PROJECT_ID,
      projectSecret: process.env.IPFS_INFURA_PROJECT_SECRET
    };
  } else {
    // Development: Use local IPFS or public gateway
    return {
      host: 'localhost',
      port: 5001,
      protocol: 'http'
    };
  }
};

export const createIPFSClient = () => {
  const config = getIPFSConfig();
  
  if (config.projectId && config.projectSecret) {
    // Infura IPFS with authentication
    return {
      host: config.host,
      port: config.port,
      protocol: config.protocol,
      headers: {
        authorization: `Basic ${Buffer.from(`${config.projectId}:${config.projectSecret}`).toString('base64')}`
      }
    };
  } else {
    // Basic IPFS configuration
    return {
      host: config.host,
      port: config.port,
      protocol: config.protocol
    };
  }
};

export const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/'
];

export const getIPFSGateway = (cid: string, gatewayIndex: number = 0): string => {
  const gateway = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length];
  return `${gateway}${cid}`;
};
