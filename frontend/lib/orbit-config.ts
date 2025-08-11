/**
 * OrbitDB Configuration
 * Configure your real-time messaging server endpoints
 */

export const ORBIT_CONFIG = {
  // Development (local)
  DEV: {
    SERVER_URL: 'http://localhost:8889',
    WEBSOCKET_URL: 'ws://localhost:8889'
  },
  
  // Production (your hosted server)
  PROD: {
    SERVER_URL: process.env.NEXT_PUBLIC_ORBIT_SERVER_URL || 'https://your-server-ip.com:8889',
    WEBSOCKET_URL: process.env.NEXT_PUBLIC_ORBIT_WS_URL || 'wss://your-server-ip.com:8889'
  },
  
  // Auto-detect environment
  getCurrent() {
    if (process.env.NODE_ENV === 'production') {
      return this.PROD;
    }
    return this.DEV;
  },
  
  // Get server URL for current environment
  getServerUrl() {
    return this.getCurrent().SERVER_URL;
  },
  
  // Get WebSocket URL for current environment
  getWebSocketUrl() {
    return this.getCurrent().WEBSOCKET_URL;
  }
};

// Environment variables you need to set:
// NEXT_PUBLIC_ORBIT_SERVER_URL=https://your-server-ip.com:8889
// NEXT_PUBLIC_ORBIT_WS_URL=wss://your-server-ip.com:8889

export default ORBIT_CONFIG;
