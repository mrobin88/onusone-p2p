import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { kv } from './kv-wrapper';

// Enhanced rate limiting configuration
export const RATE_LIMITS = {
  // Authentication endpoints
  login: { requests: 5, windowSeconds: 300 },      // 5 attempts per 5 minutes
  register: { requests: 3, windowSeconds: 300 },   // 3 registrations per 5 minutes
  
  // Content creation
  createPost: { requests: 10, windowSeconds: 300 }, // 10 posts per 5 minutes
  engage: { requests: 30, windowSeconds: 60 },      // 30 engagements per minute
  
  // Financial operations
  stakeConfirm: { requests: 5, windowSeconds: 60 },  // 5 stake confirmations per minute
  burnTokens: { requests: 2, windowSeconds: 300 },   // 2 burns per 5 minutes
  
  // Data access
  fetchPosts: { requests: 100, windowSeconds: 60 },  // 100 fetches per minute
  fetchStats: { requests: 20, windowSeconds: 60 },   // 20 stats calls per minute
  
  // Admin operations
  adminAction: { requests: 10, windowSeconds: 300 }, // 10 admin actions per 5 minutes
} as const;

// Input validation schemas
export const ValidationSchemas = {
  // User input schemas
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
    
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email cannot exceed 100 characters'),
    
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  // Content schemas
  postContent: z.string()
    .min(1, 'Content cannot be empty')
    .max(2000, 'Content cannot exceed 2000 characters')
    .refine(content => content.trim().length > 0, 'Content cannot be only whitespace'),
    
  boardType: z.string()
    .min(1, 'Board type is required')
    .max(50, 'Board type cannot exceed 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Board type can only contain lowercase letters, numbers, and hyphens'),
    
  // Financial schemas
  tokenAmount: z.number()
    .int('Amount must be a whole number')
    .positive('Amount must be positive')
    .max(1000000, 'Amount cannot exceed 1,000,000 tokens'),
    
  solanaSignature: z.string()
    .min(80, 'Invalid Solana transaction signature')
    .max(100, 'Invalid Solana transaction signature')
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, 'Invalid base58 encoding'),
    
  solanaAddress: z.string()
    .length(44, 'Solana address must be exactly 44 characters')
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, 'Invalid base58 encoding'),
    
  // ID schemas
  postId: z.string()
    .min(1, 'Post ID is required')
    .max(200, 'Post ID too long'),
    
  userId: z.string()
    .min(1, 'User ID is required')
    .max(100, 'User ID too long'),
} as const;

// Comprehensive input sanitization
export class InputSanitizer {
  static sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .slice(0, 2000); // Ensure max length
  }
  
  static sanitizeUsername(username: string): string {
    return username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 20);
  }
  
  static sanitizeEmail(email: string): string {
    return email
      .trim()
      .toLowerCase()
      .slice(0, 100);
  }
  
  static sanitizeAmount(amount: any): number {
    const num = Number(amount);
    if (isNaN(num) || !isFinite(num)) return 0;
    return Math.max(0, Math.min(1000000, Math.floor(num)));
  }
}

// Enhanced rate limiting with multiple strategies
export class SecurityManager {
  static async checkRateLimit(
    req: NextApiRequest, 
    res: NextApiResponse, 
    operation: keyof typeof RATE_LIMITS,
    customKey?: string
  ): Promise<boolean> {
    const config = RATE_LIMITS[operation];
    const ip = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Multiple rate limiting strategies
    const keys = [
      `ratelimit:${operation}:ip:${ip}`,
      customKey ? `ratelimit:${operation}:custom:${customKey}` : null,
      `ratelimit:${operation}:ua:${this.hashUserAgent(userAgent)}`
    ].filter(Boolean) as string[];
    
    for (const key of keys) {
      const count = await kv.incr(key);
      if (count === 1) {
        await kv.expire(key, config.windowSeconds);
      }
      
      if (count > config.requests) {
        const remainingTime = await kv.ttl(key);
        res.status(429).json({ 
          error: 'Rate limit exceeded',
          operation,
          retryAfter: remainingTime,
          message: `Too many ${operation} requests. Try again in ${Math.ceil(remainingTime / 60)} minutes.`
        });
        return false;
      }
    }
    
    return true;
  }
  
  // Detect suspicious patterns
  static async detectSuspiciousActivity(
    req: NextApiRequest,
    operation: string
  ): Promise<{ isSuspicious: boolean; reason?: string }> {
    const ip = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      // Bot detection
      { pattern: /bot|crawler|spider|scraper/i, reason: 'Bot user agent detected' },
      { pattern: /curl|wget|python|php/i, reason: 'Automated tool detected' },
      
      // Suspicious user agents
      { pattern: /^$/, reason: 'Empty user agent' },
      { pattern: /^.{0,10}$/, reason: 'Suspiciously short user agent' },
    ];
    
    for (const { pattern, reason } of suspiciousPatterns) {
      if (pattern.test(userAgent)) {
        // Log suspicious activity
        await this.logSuspiciousActivity(ip, userAgent, operation, reason);
        return { isSuspicious: true, reason };
      }
    }
    
    // Check request frequency patterns
    const recentRequests = await kv.get(`suspicious:${ip}:count`) || 0;
    if (recentRequests > 100) { // More than 100 requests from same IP recently
      return { isSuspicious: true, reason: 'High request frequency' };
    }
    
    return { isSuspicious: false };
  }
  
  // Comprehensive input validation
  static validateInput<T>(
    data: any, 
    schema: z.ZodSchema<T>
  ): { success: true; data: T } | { success: false; errors: string[] } {
    try {
      const result = schema.safeParse(data);
      
      if (!result.success) {
        const errors = result.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        );
        return { success: false, errors };
      }
      
      return { success: true, data: result.data };
    } catch (error) {
      return { 
        success: false, 
        errors: ['Validation error: ' + (error instanceof Error ? error.message : 'Unknown error')]
      };
    }
  }
  
  // Security headers
  static setSecurityHeaders(res: NextApiResponse): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
  }
  
  // Helper methods
  static getClientIP(req: NextApiRequest): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
    return ip || 'unknown';
  }
  
  private static hashUserAgent(userAgent: string): string {
    // Simple hash for user agent (for rate limiting by UA)
    let hash = 0;
    for (let i = 0; i < userAgent.length; i++) {
      const char = userAgent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  private static async logSuspiciousActivity(
    ip: string, 
    userAgent: string, 
    operation: string, 
    reason: string
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ip,
      userAgent,
      operation,
      reason
    };
    
    // Store in KV for monitoring
    await kv.lpush('security:suspicious_activity', JSON.stringify(logEntry));
    await kv.ltrim('security:suspicious_activity', 0, 99); // Keep last 100 entries
    
    // Increment counter
    await kv.incr(`suspicious:${ip}:count`);
    await kv.expire(`suspicious:${ip}:count`, 3600); // 1 hour
    
    console.warn('🚨 Suspicious activity detected:', logEntry);
  }
}

// Predefined validation schemas for common use cases
export const CommonSchemas = {
  createPost: z.object({
    content: ValidationSchemas.postContent,
    boardType: ValidationSchemas.boardType,
    authorId: ValidationSchemas.userId.optional(),
    stake: ValidationSchemas.tokenAmount.optional(),
  }),
  
  engage: z.object({
    postId: ValidationSchemas.postId,
    type: z.enum(['like', 'comment', 'share']),
    userId: ValidationSchemas.userId.optional(),
  }),
  
  stakeConfirm: z.object({
    postId: ValidationSchemas.postId,
    amount: ValidationSchemas.tokenAmount,
    type: z.enum(['post', 'boost']),
    txSig: ValidationSchemas.solanaSignature,
  }),
  
  userRegistration: z.object({
    username: ValidationSchemas.username,
    email: ValidationSchemas.email,
    password: ValidationSchemas.password,
    walletAddress: ValidationSchemas.solanaAddress.optional(),
  }),
  
  userLogin: z.object({
    username: ValidationSchemas.username,
    password: z.string().min(1, 'Password is required'),
  }),
} as const;

// Security middleware wrapper
export function withSecurity(
  operation: keyof typeof RATE_LIMITS,
  schema?: z.ZodSchema
) {
  return function securityMiddleware(
    handler: (req: NextApiRequest, res: NextApiResponse, validatedData?: any) => Promise<void>
  ) {
    return async function (req: NextApiRequest, res: NextApiResponse) {
      try {
        // Set security headers
        SecurityManager.setSecurityHeaders(res);
        
        // Check for suspicious activity
        const suspiciousCheck = await SecurityManager.detectSuspiciousActivity(req, operation);
        if (suspiciousCheck.isSuspicious) {
          return res.status(403).json({ 
            error: 'Suspicious activity detected',
            reason: suspiciousCheck.reason
          });
        }
        
        // Rate limiting
        if (!(await SecurityManager.checkRateLimit(req, res, operation))) {
          return; // Response already sent by checkRateLimit
        }
        
        // Input validation if schema provided
        let validatedData;
        if (schema && req.method !== 'GET') {
          const validation = SecurityManager.validateInput(req.body, schema);
          if (!validation.success) {
            return res.status(400).json({
              error: 'Input validation failed',
              details: validation.errors
            });
          }
          validatedData = validation.data;
        }
        
        // Call the actual handler
        await handler(req, res, validatedData);
        
      } catch (error) {
        console.error(`Security middleware error in ${operation}:`, error);
        res.status(500).json({ 
          error: 'Internal server error',
          details: 'Security processing failed'
        });
      }
    };
  };
}

export default SecurityManager;
