/**
 * Enhanced Decay System - Intelligent Content Decay with Economic Integration
 * 
 * Features:
 * - Network-aware decay acceleration
 * - Quality-based decay rates
 * - Economic incentive alignment
 * - Real-time decay monitoring
 * - Stake preservation mechanisms
 */

import { EventEmitter } from 'events';
import { EnhancedEconomics, NetworkMetrics } from './enhanced-economics';

export interface DecayableContent {
  id: string;
  userId: string;
  contentType: 'post' | 'comment' | 'stake' | 'node';
  contentHash: string;
  qualityScore: number; // 0-100
  stakeAmount: number;
  createdAt: number;
  lastActivity: number;
  decayScore: number; // 0-100, 100 = perfect, 0 = completely decayed
  decayRate: number; // Base decay rate per hour
  accelerationFactor: number; // Current acceleration multiplier
  expiryTime: number; // Estimated time until complete decay
  isPreserved: boolean; // Whether content is preserved from decay
  preservationReason?: string;
}

export interface DecayMetrics {
  totalContent: number;
  decayingContent: number;
  preservedContent: number;
  averageDecayScore: number;
  averageAccelerationFactor: number;
  networkCongestionLevel: 'low' | 'medium' | 'high' | 'critical';
  estimatedTreasuryTaxRate: number; // Tokens taxed to treasury per hour
  qualityDecayCorrelation: number; // Correlation between quality and decay
  estimatedBurnRate: number; // Estimated burn rate per hour
}

export interface DecayAccelerationEvent {
  contentId: string;
  userId: string;
  previousAcceleration: number;
  newAcceleration: number;
  reason: string;
  networkImpact: 'low' | 'medium' | 'high';
  estimatedTimeSaved: number; // Hours saved in decay
}

export interface QualityMetrics {
  contentId: string;
  engagementScore: number;
  reputationImpact: number;
  networkContribution: number;
  overallQuality: number;
}

export class EnhancedDecay extends EventEmitter {
  private content: Map<string, DecayableContent> = new Map();
  private qualityMetrics: Map<string, QualityMetrics> = new Map();
  private decayHistory: DecayAccelerationEvent[] = [];
  private enhancedEconomics: EnhancedEconomics;

  // Decay configuration
  private baseDecayRates = {
    post: 2.5,      // 2.5% per hour
    comment: 3.0,   // 3.0% per hour
    stake: 1.0,     // 1.0% per hour
    node: 0.5       // 0.5% per hour
  };
  
  // Quality thresholds
  private qualityThresholds = {
    excellent: 85,
    good: 70,
    poor: 40
  };
  
  // Network congestion thresholds
  private congestionThresholds = {
    low: 0.3,
    medium: 0.6,
    high: 0.8,
    critical: 0.95
  };

  constructor() {
    super();
    
    // Initialize enhanced economics integration
    this.enhancedEconomics = new EnhancedEconomics();
    
    this.enhancedEconomics.on('parameters:adjusted', (config) => {
      // Handle parameter adjustments if needed
      console.log('Enhanced economics parameters adjusted:', config);
    });
  }

  /**
   * Register new content for decay tracking
   */
  registerContent(content: Omit<DecayableContent, 'decayScore' | 'decayRate' | 'accelerationFactor' | 'expiryTime' | 'isPreserved'>): DecayableContent {
    const decayRate = this.calculateBaseDecayRate(content.contentType, content.qualityScore);
    const accelerationFactor = this.calculateInitialAcceleration(content);
    const expiryTime = this.calculateExpiryTime(content, decayRate, accelerationFactor);
    
    const decayableContent: DecayableContent = {
      ...content,
      decayScore: 100,
      decayRate,
      accelerationFactor,
      expiryTime,
      isPreserved: false
    };

    this.content.set(content.id, decayableContent);
    
    // Initialize quality metrics
    this.initializeQualityMetrics(content.id);
    
    this.emit('content:registered', decayableContent);
    return decayableContent;
  }

  /**
   * Update content quality and recalculate decay
   */
  updateContentQuality(contentId: string, qualityMetrics: Partial<QualityMetrics>): void {
    const content = this.content.get(contentId);
    if (!content) return;

    // Update quality metrics
    const existing = this.qualityMetrics.get(contentId) || {
      contentId,
      engagementScore: 0,
      reputationImpact: 0,
      networkContribution: 0,
      overallQuality: 0
    };

    const updated = { ...existing, ...qualityMetrics };
    this.qualityMetrics.set(contentId, updated);

    // Recalculate overall quality
    const overallQuality = this.calculateOverallQuality(updated);
    updated.overallQuality = overallQuality;

    // Update content quality score
    content.qualityScore = overallQuality;

    // Recalculate decay parameters
    this.recalculateDecayParameters(contentId);

    this.emit('quality:updated', { contentId, qualityMetrics: updated });
  }

  /**
   * Calculate overall quality score from metrics
   */
  private calculateOverallQuality(metrics: QualityMetrics): number {
    const weights = {
      engagementScore: 0.4,
      reputationImpact: 0.3,
      networkContribution: 0.3
    };

    return (
      metrics.engagementScore * weights.engagementScore +
      metrics.reputationImpact * weights.reputationImpact +
      metrics.networkContribution * weights.networkContribution
    );
  }

  /**
   * Calculate base decay rate for content type and quality
   */
  private calculateBaseDecayRate(contentType: string, qualityScore: number): number {
    const baseRate = this.baseDecayRates[contentType] || this.baseDecayRates.post;
    
    // Quality-based adjustment
    let qualityMultiplier = 1.0;
    
    if (qualityScore >= this.qualityThresholds.excellent) {
      qualityMultiplier = 0.5; // Excellent content decays 50% slower
    } else if (qualityScore >= this.qualityThresholds.good) {
      qualityMultiplier = 0.8; // Good content decays 20% slower
    } else if (qualityScore <= this.qualityThresholds.poor) {
      qualityMultiplier = 2.0; // Poor content decays 2x faster
    }

    return baseRate * qualityMultiplier;
  }

  /**
   * Calculate initial acceleration factor
   */
  private calculateInitialAcceleration(content: any): number {
    const networkMetrics = EnhancedEconomics.getNetworkMetrics();
    const congestionLevel = this.getCongestionLevel(networkMetrics.messageVolume / networkMetrics.maxNetworkCapacity);
    
    let acceleration = 1.0;
    
    // Network congestion acceleration
    switch (congestionLevel) {
      case 'critical':
        acceleration = 5.0;
        break;
      case 'high':
        acceleration = 2.0;
        break;
      case 'medium':
        acceleration = 1.5;
        break;
      case 'low':
        acceleration = 1.0;
        break;
    }
    
    // Quality-based acceleration
    if (content.qualityScore < this.qualityThresholds.fair) {
      acceleration *= 1.5;
    }
    
    return acceleration;
  }

  /**
   * Calculate expiry time based on decay rate and acceleration
   */
  private calculateExpiryTime(content: any, decayRate: number, accelerationFactor: number): number {
    const effectiveDecayRate = decayRate * accelerationFactor;
    const hoursToDecay = 100 / effectiveDecayRate; // Time to go from 100 to 0
    return Date.now() + (hoursToDecay * 60 * 60 * 1000);
  }

  /**
   * Get network congestion level
   */
  private getCongestionLevel(messageVolumeRatio: number): 'low' | 'medium' | 'high' | 'critical' {
    if (messageVolumeRatio >= this.congestionThresholds.critical) return 'critical';
    if (messageVolumeRatio >= this.congestionThresholds.high) return 'high';
    if (messageVolumeRatio >= this.congestionThresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Update decay rates based on network metrics
   */
  private updateDecayRates(metrics: NetworkMetrics): void {
    const congestionLevel = this.getCongestionLevel(metrics.messageVolume / metrics.maxNetworkCapacity);
    const networkHealth = metrics.networkHealth / 100;
    
    // Update acceleration factors for all content
    for (const [contentId, content] of this.content) {
      const newAcceleration = this.calculateNetworkAcceleration(content, congestionLevel, networkHealth);
      
      if (Math.abs(newAcceleration - content.accelerationFactor) > 0.1) {
        const previousAcceleration = content.accelerationFactor;
        content.accelerationFactor = newAcceleration;
        
        // Recalculate expiry time
        content.expiryTime = this.calculateExpiryTime(content, content.decayRate, newAcceleration);
        
        // Record acceleration event
        this.recordAccelerationEvent(contentId, content.userId, previousAcceleration, newAcceleration, congestionLevel);
      }
    }
  }

  /**
   * Calculate network-based acceleration
   */
  private calculateNetworkAcceleration(content: DecayableContent, congestionLevel: string, networkHealth: number): number {
    let acceleration = 1.0;
    
    // Congestion-based acceleration
    switch (congestionLevel) {
      case 'critical':
        acceleration = 10.0; // Very aggressive decay
        break;
      case 'high':
        acceleration = 3.0;
        break;
      case 'medium':
        acceleration = 1.5;
        break;
      case 'low':
        acceleration = 1.0;
        break;
    }
    
    // Network health adjustment
    if (networkHealth < 0.5) {
      acceleration *= 1.5; // Poor network health accelerates decay
    } else if (networkHealth > 0.8) {
      acceleration *= 0.8; // Good network health slows decay
    }
    
    // Quality-based adjustment
    if (content.qualityScore < this.qualityThresholds.fair) {
      acceleration *= 1.3; // Lower quality accelerates decay
    } else if (content.qualityScore >= this.qualityThresholds.excellent) {
      acceleration *= 0.7; // Higher quality slows decay
    }
    
    return acceleration;
  }

  /**
   * Record acceleration event for analysis
   */
  private recordAccelerationEvent(contentId: string, userId: string, previousAcceleration: number, newAcceleration: number, congestionLevel: string): void {
    const event: DecayAccelerationEvent = {
      contentId,
      userId,
      previousAcceleration,
      newAcceleration,
      reason: `Network congestion: ${congestionLevel}`,
      networkImpact: this.calculateNetworkImpact(newAcceleration),
      estimatedTimeSaved: this.calculateTimeSaved(previousAcceleration, newAcceleration)
    };
    
    this.decayHistory.push(event);
    
    // Keep only last 1000 events
    if (this.decayHistory.length > 1000) {
      this.decayHistory = this.decayHistory.slice(-1000);
    }
    
    this.emit('acceleration:changed', event);
  }

  /**
   * Calculate network impact level
   */
  private calculateNetworkImpact(acceleration: number): 'low' | 'medium' | 'high' {
    if (acceleration >= 5.0) return 'high';
    if (acceleration >= 2.0) return 'medium';
    return 'low';
  }

  /**
   * Calculate time saved in decay
   */
  private calculateTimeSaved(previousAcceleration: number, newAcceleration: number): number {
    if (newAcceleration <= previousAcceleration) return 0;
    
    const timeDifference = (newAcceleration - previousAcceleration) / newAcceleration;
    return timeDifference * 24; // Convert to hours
  }

  /**
   * Preserve content from decay
   */
  preserveContent(contentId: string, reason: string): boolean {
    const content = this.content.get(contentId);
    if (!content) return false;
    
    content.isPreserved = true;
    content.preservationReason = reason;
    content.accelerationFactor = 0; // No decay
    content.expiryTime = Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 year
    
    this.emit('content:preserved', { contentId, reason });
    return true;
  }

  /**
   * Remove content preservation
   */
  removePreservation(contentId: string): boolean {
    const content = this.content.get(contentId);
    if (!content) return false;
    
    content.isPreserved = false;
    delete content.preservationReason;
    
    // Recalculate decay parameters
    this.recalculateDecayParameters(contentId);
    
    this.emit('preservation:removed', { contentId });
    return true;
  }

  /**
   * Recalculate decay parameters for content
   */
  private recalculateDecayParameters(contentId: string): void {
    const content = this.content.get(contentId);
    if (!content) return;
    
    // Recalculate base decay rate
    content.decayRate = this.calculateBaseDecayRate(content.contentType, content.qualityScore);
    
    // Recalculate acceleration factor
    const networkMetrics = EnhancedEconomics.getNetworkMetrics();
    const congestionLevel = this.getCongestionLevel(networkMetrics.messageVolume / networkMetrics.maxNetworkCapacity);
    const networkHealth = networkMetrics.networkHealth / 100;
    
    content.accelerationFactor = this.calculateNetworkAcceleration(content, congestionLevel, networkHealth);
    
    // Recalculate expiry time
    content.expiryTime = this.calculateExpiryTime(content, content.decayRate, content.accelerationFactor);
  }

  /**
   * Initialize quality metrics for content
   */
  private initializeQualityMetrics(contentId: string): void {
    const content = this.content.get(contentId);
    if (!content) return;
    
    const metrics: QualityMetrics = {
      contentId,
      engagementScore: 50, // Default starting score
      reputationImpact: 50,
      networkContribution: 50,
      overallQuality: content.qualityScore
    };
    
    this.qualityMetrics.set(contentId, metrics);
  }

  /**
   * Start decay processing
   */
  private startDecayProcessing(): void {
    // Process decay every minute
    setInterval(() => {
      this.processDecay();
    }, 60000);
    
    // Generate decay metrics every 5 minutes
    setInterval(() => {
      this.generateDecayMetrics();
    }, 300000);
  }

  /**
   * Process decay for all content
   */
  private processDecay(): void {
    const now = Date.now();
    const decayedContent: string[] = [];
    
    for (const [contentId, content] of this.content) {
      if (content.isPreserved) continue;
      
      // Calculate decay since last processing
      const timeSinceLastActivity = (now - content.lastActivity) / (1000 * 60 * 60); // Hours
      const decayAmount = content.decayRate * content.accelerationFactor * timeSinceLastActivity;
      
      // Apply decay
      content.decayScore = Math.max(0, content.decayScore - decayAmount);
      content.lastActivity = now;
      
      // Check if content is completely decayed
      if (content.decayScore <= 0) {
        decayedContent.push(contentId);
        
                  // Collect treasury tax
        this.collectDecayTax(content);
      }
    }
    
    // Remove completely decayed content
    for (const contentId of decayedContent) {
      this.content.delete(contentId);
      this.qualityMetrics.delete(contentId);
    }
    
    if (decayedContent.length > 0) {
      this.emit('content:decayed', decayedContent);
    }
  }

  /**
   * Collect treasury tax from decayed content
   */
  private collectDecayTax(content: DecayableContent): void {
    if (content.stakeAmount > 0) {
      // Calculate tax amount - goes to treasury, not burned
      const taxAmount = Math.floor(content.stakeAmount * 0.1); // 10% tax to treasury
      
      // Emit treasury tax event
      EnhancedEconomics.emit('tokens:treasury_tax', {
        amount: taxAmount,
        reason: 'content_decay_tax',
        contentId: content.id,
        userId: content.userId,
        treasuryDestination: 'main_treasury'
      });
      
      console.log(`💰 Collected ${taxAmount} tokens as decay tax from content ${content.id} - sent to treasury`);
    }
  }

  /**
   * Generate comprehensive decay metrics
   */
  private generateDecayMetrics(): void {
    const metrics: DecayMetrics = {
      totalContent: this.content.size,
      decayingContent: Array.from(this.content.values()).filter(c => !c.isPreserved).length,
      preservedContent: Array.from(this.content.values()).filter(c => c.isPreserved).length,
      averageDecayScore: this.calculateAverageDecayScore(),
      averageAccelerationFactor: this.calculateAverageAccelerationFactor(),
      networkCongestionLevel: this.getCurrentCongestionLevel(),
      estimatedTreasuryTaxRate: this.calculateEstimatedTreasuryTaxRate(),
      qualityDecayCorrelation: this.calculateQualityDecayCorrelation(),
      estimatedBurnRate: this.calculateEstimatedBurnRate()
    };
    
    this.emit('metrics:generated', metrics);
  }

  /**
   * Calculate average decay score
   */
  private calculateAverageDecayScore(): number {
    const content = Array.from(this.content.values());
    if (content.length === 0) return 0;
    
    const totalScore = content.reduce((sum, c) => sum + c.decayScore, 0);
    return totalScore / content.length;
  }

  /**
   * Calculate average acceleration factor
   */
  private calculateAverageAccelerationFactor(): number {
    const content = Array.from(this.content.values());
    if (content.length === 0) return 1;
    
    const totalAcceleration = content.reduce((sum, c) => sum + c.accelerationFactor, 0);
    return totalAcceleration / content.length;
  }

  /**
   * Get current congestion level
   */
  private getCurrentCongestionLevel(): 'low' | 'medium' | 'high' | 'critical' {
    const networkMetrics = EnhancedEconomics.getNetworkMetrics();
    const ratio = networkMetrics.messageVolume / networkMetrics.maxNetworkCapacity;
    return this.getCongestionLevel(ratio);
  }

  /**
   * Calculate estimated treasury tax rate
   */
  private calculateEstimatedTreasuryTaxRate(): number {
    let totalTaxRate = 0;
    
    for (const content of this.content.values()) {
      if (!content.isPreserved) {
        const hourlyTax = content.stakeAmount * (content.decayRate * content.accelerationFactor) / 100;
        totalTaxRate += hourlyTax;
      }
    }
    
    return totalTaxRate;
  }

  /**
   * Calculate correlation between quality and decay
   */
  private calculateQualityDecayCorrelation(): number {
    const content = Array.from(this.content.values());
    if (content.length < 2) return 0;
    
    const qualityScores = content.map(c => c.qualityScore);
    const decayScores = content.map(c => c.decayScore);
    
    return this.calculateCorrelation(qualityScores, decayScores);
  }

  /**
   * Calculate correlation coefficient between two arrays
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate estimated burn rate
   */
  private calculateEstimatedBurnRate(): number {
    let totalBurnRate = 0;
    
    for (const content of this.content.values()) {
      if (!content.isPreserved) {
        const hourlyBurn = content.stakeAmount * (content.decayRate * content.accelerationFactor) / 100;
        totalBurnRate += hourlyBurn;
      }
    }
    
    return totalBurnRate;
  }

  /**
   * Get decay metrics
   */
  getDecayMetrics(): DecayMetrics {
    return {
      totalContent: this.content.size,
      decayingContent: Array.from(this.content.values()).filter(c => !c.isPreserved).length,
      preservedContent: Array.from(this.content.values()).filter(c => c.isPreserved).length,
      averageDecayScore: this.calculateAverageDecayScore(),
      averageAccelerationFactor: this.calculateAverageAccelerationFactor(),
      networkCongestionLevel: this.getCurrentCongestionLevel(),
      estimatedTreasuryTaxRate: this.calculateEstimatedTreasuryTaxRate(),
      qualityDecayCorrelation: this.calculateQualityDecayCorrelation(),
      estimatedBurnRate: this.calculateEstimatedBurnRate()
    };
  }

  /**
   * Get content by ID
   */
  getContent(contentId: string): DecayableContent | undefined {
    return this.content.get(contentId);
  }

  /**
   * Get all content
   */
  getAllContent(): DecayableContent[] {
    return Array.from(this.content.values());
  }

  /**
   * Get quality metrics for content
   */
  getQualityMetrics(contentId: string): QualityMetrics | undefined {
    return this.qualityMetrics.get(contentId);
  }

  /**
   * Get decay history
   */
  getDecayHistory(): DecayAccelerationEvent[] {
    return [...this.decayHistory];
  }
}

// Export singleton instance
export const enhancedDecay = new EnhancedDecay();
export default EnhancedDecay;
