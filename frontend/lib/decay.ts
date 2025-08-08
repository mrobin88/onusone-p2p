export interface DecayConfig {
  lambdaPerHour?: number; // points lost per hour
  engagementBonus?: number; // bonus per engagement
  closeThreshold?: number; // score below which message is closed
  maxScore?: number;
}

export function computeDecayScore(
  createdAtISO: string,
  engagements: number,
  config: DecayConfig = {}
): number {
  const {
    lambdaPerHour = 8,
    engagementBonus = 2,
    closeThreshold = 15,
    maxScore = 100,
  } = config;

  const createdAt = new Date(createdAtISO).getTime();
  const hours = Math.max(0, (Date.now() - createdAt) / 36e5);
  const raw = maxScore - lambdaPerHour * hours + engagementBonus * (engagements || 0);
  return Math.max(0, Math.min(maxScore, Math.round(raw)));
}

export function isClosed(score: number, threshold = 15): boolean {
  return score <= threshold;
}


