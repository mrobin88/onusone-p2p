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
  
  // Production (Render backend)
  PROD: {
    SERVER_URL: process.env.NEXT_PUBLIC_ORBIT_SERVER_URL || 'https://onusone-p2p.onrender.com',
    WEBSOCKET_URL: process.env.NEXT_PUBLIC_ORBIT_WS_URL || 'wss://onusone-p2p.onrender.com'
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
// NEXT_PUBLIC_ORBIT_SERVER_URL=https://onusone-p2p.onrender.com
// NEXT_PUBLIC_ORBIT_WS_URL=wss://onusone-p2p.onrender.com

export default ORBIT_CONFIG;
