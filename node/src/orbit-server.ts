/**
 * Main OrbitDB Server
 * Integrates OrbitMessaging with RealtimeAPI
 * Provides real-time, peer-to-peer messaging with IPFS storage
 */

import { OrbitMessaging } from './messaging/orbit-messaging';
import { RealtimeAPI } from './messaging/realtime-api';
import { Logger } from './utils/logger';

export class OrbitServer {
  private orbitMessaging: OrbitMessaging;
  private realtimeAPI: RealtimeAPI;
  private logger: Logger;
  private isRunning: boolean = false;

  constructor() {
    this.logger = new Logger('OrbitServer');
    this.orbitMessaging = new OrbitMessaging();
    this.realtimeAPI = new RealtimeAPI(this.orbitMessaging);
  }

  async start(): Promise<void> {
    try {
      this.logger.info('Starting OrbitDB Server...');
      
      // Use environment port or default to 8889
      const port = process.env.PORT ? parseInt(process.env.PORT) : 8889;
      
      // Start the real-time API (this will also initialize OrbitMessaging)
      await this.realtimeAPI.start(port);
      
      this.isRunning = true;
      this.logger.info('OrbitDB Server started successfully');
      this.logger.info(`Real-time API running on port ${port}`);
      this.logger.info('OrbitMessaging system initialized');
      
      // Set up graceful shutdown
      this.setupGracefulShutdown();
      
    } catch (error) {
      this.logger.error('Failed to start OrbitDB Server:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      this.logger.info('Stopping OrbitDB Server...');
      
      // Stop real-time API
      await this.realtimeAPI.stop();
      
      // Shutdown OrbitMessaging
      await this.orbitMessaging.shutdown();
      
      this.isRunning = false;
      this.logger.info('OrbitDB Server stopped successfully');
      
    } catch (error) {
      this.logger.error('Error stopping OrbitDB Server:', error);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      this.logger.info(`Received ${signal}, shutting down gracefully...`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGQUIT', () => shutdown('SIGQUIT'));
  }

  // Public methods for external access
  getOrbitMessaging(): OrbitMessaging {
    return this.orbitMessaging;
  }

  getRealtimeAPI(): RealtimeAPI {
    return this.realtimeAPI;
  }

  getStatus(): any {
    return {
      isRunning: this.isRunning,
      orbit: this.orbitMessaging.getStatus(),
      realtime: {
        connections: this.realtimeAPI.getConnectionCount(),
        isRunning: this.realtimeAPI.isRunning
      }
    };
  }
}

// Main entry point
async function main() {
  const server = new OrbitServer();
  
  try {
    await server.start();
    
    // Keep the process alive
    process.stdin.resume();
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export default OrbitServer;
