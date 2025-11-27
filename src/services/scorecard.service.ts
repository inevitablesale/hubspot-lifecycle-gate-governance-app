/**
 * Rep Scorecard Service
 * Calculates and manages rep compliance scorecards
 */

import {
  RepScorecard,
  ScorecardPeriod,
  ScorecardMetrics,
  ComplianceViolation,
} from '../types';
import { generateId, logger } from '../utils';

// In-memory scorecard storage (use database in production)
const scorecardStore = new Map<string, RepScorecard>();
const violationStore = new Map<string, ComplianceViolation[]>();

/**
 * Get or create scorecard for a user
 */
export function getOrCreateScorecard(userId: string, userName: string): RepScorecard {
  const existing = scorecardStore.get(userId);
  if (existing) {
    return existing;
  }

  const newScorecard: RepScorecard = {
    userId,
    userName,
    period: getCurrentPeriod(),
    metrics: createEmptyMetrics(),
    complianceScore: 100,
    trend: 'stable',
    violations: [],
    lastUpdated: new Date(),
  };

  scorecardStore.set(userId, newScorecard);
  return newScorecard;
}

/**
 * Record a stage transition
 */
export function recordStageTransition(
  userId: string,
  userName: string,
  objectType: 'contact' | 'deal',
  objectId: string,
  fromStage: string,
  toStage: string,
  isValid: boolean,
  missingFields?: string[],
  ruleId?: string,
  ruleName?: string
): void {
  const scorecard = getOrCreateScorecard(userId, userName);

  scorecard.metrics.totalStageTransitions++;

  if (isValid) {
    scorecard.metrics.validTransitions++;
    if (objectType === 'contact') {
      scorecard.metrics.contactsStagedCorrectly++;
    } else {
      scorecard.metrics.dealsStagedCorrectly++;
    }
  } else {
    scorecard.metrics.invalidAttempts++;

    // Record violation
    if (ruleId && ruleName) {
      const violation: ComplianceViolation = {
        id: generateId(),
        timestamp: new Date(),
        objectType,
        objectId,
        violationType: missingFields?.length
          ? 'missing_required_field'
          : 'invalid_stage_progression',
        fromStage,
        toStage,
        missingFields,
        ruleId,
        ruleName,
        severity: determineSeverity(missingFields?.length || 0),
        resolved: false,
      };

      scorecard.violations.push(violation);

      // Store violation separately
      const userViolations = violationStore.get(userId) || [];
      userViolations.push(violation);
      violationStore.set(userId, userViolations);
    }
  }

  // Recalculate compliance score
  scorecard.complianceScore = calculateComplianceScore(scorecard.metrics);

  // Update trend
  scorecard.trend = calculateTrend(userId);

  scorecard.lastUpdated = new Date();

  logger.info('Stage transition recorded', {
    userId,
    objectType,
    objectId,
    isValid,
    complianceScore: scorecard.complianceScore,
  });
}

/**
 * Update required fields compliance
 */
export function updateFieldsCompliance(
  userId: string,
  userName: string,
  totalFields: number,
  compliantFields: number
): void {
  const scorecard = getOrCreateScorecard(userId, userName);

  if (totalFields > 0) {
    scorecard.metrics.requiredFieldsCompliance = (compliantFields / totalFields) * 100;
  }

  scorecard.lastUpdated = new Date();
}

/**
 * Get scorecard for user
 */
export function getScorecard(userId: string): RepScorecard | undefined {
  return scorecardStore.get(userId);
}

/**
 * Get all scorecards (for admin view)
 */
export function getAllScorecards(): RepScorecard[] {
  return Array.from(scorecardStore.values()).sort(
    (a, b) => b.complianceScore - a.complianceScore
  );
}

/**
 * Get user violations
 */
export function getUserViolations(
  userId: string,
  options?: {
    resolved?: boolean;
    objectType?: 'contact' | 'deal';
    limit?: number;
  }
): ComplianceViolation[] {
  let violations = violationStore.get(userId) || [];

  if (options?.resolved !== undefined) {
    violations = violations.filter((v) => v.resolved === options.resolved);
  }

  if (options?.objectType) {
    violations = violations.filter((v) => v.objectType === options.objectType);
  }

  violations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (options?.limit) {
    violations = violations.slice(0, options.limit);
  }

  return violations;
}

/**
 * Resolve a violation
 */
export function resolveViolation(userId: string, violationId: string): boolean {
  const violations = violationStore.get(userId);
  if (!violations) return false;

  const violation = violations.find((v) => v.id === violationId);
  if (!violation) return false;

  violation.resolved = true;
  violation.resolvedAt = new Date();

  // Update scorecard
  const scorecard = scorecardStore.get(userId);
  if (scorecard) {
    const scorecardViolation = scorecard.violations.find((v) => v.id === violationId);
    if (scorecardViolation) {
      scorecardViolation.resolved = true;
      scorecardViolation.resolvedAt = new Date();
    }
  }

  return true;
}

/**
 * Calculate compliance score
 */
function calculateComplianceScore(metrics: ScorecardMetrics): number {
  if (metrics.totalStageTransitions === 0) {
    return 100;
  }

  const transitionScore = (metrics.validTransitions / metrics.totalStageTransitions) * 100;
  const fieldScore = metrics.requiredFieldsCompliance;

  // Weighted average: 60% transition compliance, 40% field compliance
  return transitionScore * 0.6 + fieldScore * 0.4;
}

/**
 * Calculate trend based on recent activity
 */
function calculateTrend(userId: string): 'improving' | 'stable' | 'declining' {
  const violations = violationStore.get(userId) || [];

  if (violations.length < 5) {
    return 'stable';
  }

  // Compare recent violations to older ones
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentViolations = violations.filter(
    (v) => v.timestamp >= oneWeekAgo && !v.resolved
  ).length;
  const olderViolations = violations.filter(
    (v) => v.timestamp < oneWeekAgo && !v.resolved
  ).length;

  if (recentViolations < olderViolations) {
    return 'improving';
  } else if (recentViolations > olderViolations) {
    return 'declining';
  }

  return 'stable';
}

/**
 * Determine severity based on missing fields
 */
function determineSeverity(missingFieldCount: number): 'low' | 'medium' | 'high' | 'critical' {
  if (missingFieldCount === 0) return 'low';
  if (missingFieldCount <= 2) return 'medium';
  if (missingFieldCount <= 4) return 'high';
  return 'critical';
}

/**
 * Get current period
 */
function getCurrentPeriod(): ScorecardPeriod {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return {
    startDate: startOfWeek,
    endDate: endOfWeek,
    type: 'weekly',
  };
}

/**
 * Create empty metrics
 */
function createEmptyMetrics(): ScorecardMetrics {
  return {
    totalStageTransitions: 0,
    validTransitions: 0,
    invalidAttempts: 0,
    requiredFieldsCompliance: 100,
    averageStageVelocity: 0,
    dealsStagedCorrectly: 0,
    contactsStagedCorrectly: 0,
  };
}

/**
 * Reset scorecard for new period
 */
export function resetScorecardForNewPeriod(userId: string): void {
  const scorecard = scorecardStore.get(userId);
  if (!scorecard) return;

  scorecard.period = getCurrentPeriod();
  scorecard.metrics = createEmptyMetrics();
  scorecard.complianceScore = 100;
  scorecard.violations = [];
  scorecard.lastUpdated = new Date();
}
