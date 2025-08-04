/**
 * Simple logger utility for OnusOne P2P Node
 */

export class Logger {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  info(message: string, ...args: any[]) {
    console.log(`[${new Date().toISOString()}] [INFO] [${this.prefix}] ${message}`, ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(`[${new Date().toISOString()}] [ERROR] [${this.prefix}] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]) {
    console.warn(`[${new Date().toISOString()}] [WARN] [${this.prefix}] ${message}`, ...args);
  }

  debug(message: string, ...args: any[]) {
    console.debug(`[${new Date().toISOString()}] [DEBUG] [${this.prefix}] ${message}`, ...args);
  }
}