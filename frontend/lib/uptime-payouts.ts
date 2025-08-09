/**
 * Uptime to Payout Calculator
 * Real calculations: Time online → ONU earned
 */

export interface UptimeSession {
  startTime: number;
  endTime?: number;
  messagesServed: number;
  stakesWitnessed: number;
  uptimeSeconds: number;
}

export interface PayoutCalculation {
  baseRate: number; // ONU per hour
  uptimeHours: number;
  messagesBonus: number;
  stakeWitnessBonus: number;
  totalEarned: number;
  estimatedDaily: number;
  estimatedMonthly: number;
}

export class UptimePayouts {
  private static BASE_RATE_PER_HOUR = 0.5; // 0.5 ONU per hour base
  private static MESSAGE_BONUS_RATE = 0.01; // 0.01 ONU per message served
  private static STAKE_WITNESS_RATE = 0.1; // 0.1 ONU per stake transaction witnessed

  /**
   * Calculate earnings from uptime session
   */
  static calculateEarnings(session: UptimeSession): PayoutCalculation {
    const uptimeHours = session.uptimeSeconds / 3600;
    const baseEarnings = uptimeHours * this.BASE_RATE_PER_HOUR;
    const messagesBonus = session.messagesServed * this.MESSAGE_BONUS_RATE;
    const stakeWitnessBonus = session.stakesWitnessed * this.STAKE_WITNESS_RATE;
    
    const totalEarned = baseEarnings + messagesBonus + stakeWitnessBonus;
    
    // Calculate daily estimate based on current rate
    const currentHourlyRate = totalEarned / Math.max(uptimeHours, 0.1);
    const estimatedDaily = currentHourlyRate * 24;
    const estimatedMonthly = estimatedDaily * 30;

    return {
      baseRate: this.BASE_RATE_PER_HOUR,
      uptimeHours,
      messagesBonus,
      stakeWitnessBonus,
      totalEarned,
      estimatedDaily,
      estimatedMonthly
    };
  }

  /**
   * Track current uptime session
   */
  static startSession(nodeId: string): UptimeSession {
    const session: UptimeSession = {
      startTime: Date.now(),
      messagesServed: 0,
      stakesWitnessed: 0,
      uptimeSeconds: 0
    };

    // Save to localStorage for persistence
    localStorage.setItem(`uptime_session_${nodeId}`, JSON.stringify(session));
    return session;
  }

  /**
   * Update ongoing session
   */
  static updateSession(
    nodeId: string, 
    messagesServed: number, 
    stakesWitnessed: number
  ): UptimeSession | null {
    try {
      const stored = localStorage.getItem(`uptime_session_${nodeId}`);
      if (!stored) return null;

      const session: UptimeSession = JSON.parse(stored);
      session.messagesServed = messagesServed;
      session.stakesWitnessed = stakesWitnessed;
      session.uptimeSeconds = (Date.now() - session.startTime) / 1000;

      localStorage.setItem(`uptime_session_${nodeId}`, JSON.stringify(session));
      return session;
    } catch (error) {
      console.error('Failed to update uptime session:', error);
      return null;
    }
  }

  /**
   * End session and calculate final payout
   */
  static endSession(nodeId: string): PayoutCalculation | null {
    try {
      const stored = localStorage.getItem(`uptime_session_${nodeId}`);
      if (!stored) return null;

      const session: UptimeSession = JSON.parse(stored);
      session.endTime = Date.now();
      session.uptimeSeconds = (session.endTime - session.startTime) / 1000;

      const calculation = this.calculateEarnings(session);

      // Archive completed session
      const completedSessions = JSON.parse(
        localStorage.getItem(`completed_sessions_${nodeId}`) || '[]'
      );
      completedSessions.push({ session, calculation });
      localStorage.setItem(`completed_sessions_${nodeId}`, JSON.stringify(completedSessions));

      // Clear current session
      localStorage.removeItem(`uptime_session_${nodeId}`);

      return calculation;
    } catch (error) {
      console.error('Failed to end uptime session:', error);
      return null;
    }
  }

  /**
   * Get total lifetime earnings for a node
   */
  static getTotalEarnings(nodeId: string): number {
    try {
      const completedSessions = JSON.parse(
        localStorage.getItem(`completed_sessions_${nodeId}`) || '[]'
      );
      
      return completedSessions.reduce(
        (total: number, sessionData: any) => total + sessionData.calculation.totalEarned,
        0
      );
    } catch (error) {
      console.error('Failed to get total earnings:', error);
      return 0;
    }
  }
}
