/**
 * Governance Alerts Service
 * Manages alerts for stage-gate violations and compliance issues
 * 
 * PRODUCTION NOTE: This implementation uses in-memory storage.
 * For production deployments, implement:
 * - Database storage (PostgreSQL, MongoDB) with proper indexing
 * - Message queue for alert delivery (RabbitMQ, Redis Pub/Sub)
 * - Email/Slack notifications for critical alerts
 */

import { GovernanceAlert, AlertType, ComplianceViolation } from '../types';
import { generateId, logger } from '../utils';

// In-memory storage - Replace with database for production
const alertStore = new Map<string, GovernanceAlert>();
const alertsByPortal = new Map<number, string[]>();
const alertsByUser = new Map<string, string[]>();

/**
 * Create a new governance alert
 */
export function createAlert(
  portalId: number,
  alert: Omit<GovernanceAlert, 'id' | 'timestamp' | 'acknowledged'>
): GovernanceAlert {
  const newAlert: GovernanceAlert = {
    ...alert,
    id: generateId(),
    timestamp: new Date(),
    acknowledged: false,
  };

  alertStore.set(newAlert.id, newAlert);

  // Index by portal
  const portalAlerts = alertsByPortal.get(portalId) || [];
  portalAlerts.push(newAlert.id);
  alertsByPortal.set(portalId, portalAlerts);

  // Index by user
  const userAlerts = alertsByUser.get(alert.userId) || [];
  userAlerts.push(newAlert.id);
  alertsByUser.set(alert.userId, userAlerts);

  logger.info('Alert created', {
    alertId: newAlert.id,
    type: newAlert.type,
    severity: newAlert.severity,
    userId: newAlert.userId,
  });

  return newAlert;
}

/**
 * Create alert from compliance violation
 */
export function createAlertFromViolation(
  portalId: number,
  violation: ComplianceViolation,
  userId: string
): GovernanceAlert {
  const severityMap: Record<string, 'info' | 'warning' | 'error' | 'critical'> = {
    low: 'info',
    medium: 'warning',
    high: 'error',
    critical: 'critical',
  };

  return createAlert(portalId, {
    type: mapViolationTypeToAlertType(violation.violationType),
    severity: severityMap[violation.severity] || 'warning',
    title: `Stage Gate Violation: ${violation.ruleName}`,
    message: buildViolationMessage(violation),
    objectType: violation.objectType,
    objectId: violation.objectId,
    userId,
    metadata: {
      ruleId: violation.ruleId,
      fromStage: violation.fromStage,
      toStage: violation.toStage,
      missingFields: violation.missingFields,
    },
  });
}

/**
 * Map violation type to alert type
 */
function mapViolationTypeToAlertType(violationType: string): AlertType {
  const typeMap: Record<string, AlertType> = {
    missing_required_field: 'required_field_missing',
    invalid_stage_progression: 'stage_gate_violation',
    skipped_stage: 'stage_gate_violation',
    dependency_not_met: 'stage_gate_violation',
    condition_failed: 'stage_gate_violation',
    backward_progression: 'stage_gate_violation',
  };

  return typeMap[violationType] || 'stage_gate_violation';
}

/**
 * Build human-readable violation message
 */
function buildViolationMessage(violation: ComplianceViolation): string {
  const messages: Record<string, string> = {
    missing_required_field: `Missing required fields: ${violation.missingFields?.join(', ') || 'unknown'}`,
    invalid_stage_progression: `Invalid stage progression from ${violation.fromStage} to ${violation.toStage}`,
    skipped_stage: `Stages were skipped in the progression from ${violation.fromStage} to ${violation.toStage}`,
    dependency_not_met: `Required dependencies not met for progression to ${violation.toStage}`,
    condition_failed: `Stage conditions not met for ${violation.toStage}`,
    backward_progression: `Backward progression detected from ${violation.fromStage} to ${violation.toStage}`,
  };

  return messages[violation.violationType] || 'Stage gate violation detected';
}

/**
 * Get alert by ID
 */
export function getAlert(alertId: string): GovernanceAlert | undefined {
  return alertStore.get(alertId);
}

/**
 * Get alerts for a portal
 */
export function getPortalAlerts(
  portalId: number,
  options?: {
    acknowledged?: boolean;
    severity?: string;
    type?: AlertType;
    limit?: number;
  }
): GovernanceAlert[] {
  const alertIds = alertsByPortal.get(portalId) || [];
  let alerts = alertIds.map((id) => alertStore.get(id)).filter(Boolean) as GovernanceAlert[];

  // Apply filters
  if (options?.acknowledged !== undefined) {
    alerts = alerts.filter((a) => a.acknowledged === options.acknowledged);
  }

  if (options?.severity) {
    alerts = alerts.filter((a) => a.severity === options.severity);
  }

  if (options?.type) {
    alerts = alerts.filter((a) => a.type === options.type);
  }

  // Sort by timestamp descending
  alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Apply limit
  if (options?.limit) {
    alerts = alerts.slice(0, options.limit);
  }

  return alerts;
}

/**
 * Get alerts for a user
 */
export function getUserAlerts(
  userId: string,
  options?: {
    acknowledged?: boolean;
    limit?: number;
  }
): GovernanceAlert[] {
  const alertIds = alertsByUser.get(userId) || [];
  let alerts = alertIds.map((id) => alertStore.get(id)).filter(Boolean) as GovernanceAlert[];

  if (options?.acknowledged !== undefined) {
    alerts = alerts.filter((a) => a.acknowledged === options.acknowledged);
  }

  alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (options?.limit) {
    alerts = alerts.slice(0, options.limit);
  }

  return alerts;
}

/**
 * Acknowledge an alert
 */
export function acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
  const alert = alertStore.get(alertId);

  if (!alert) {
    return false;
  }

  alert.acknowledged = true;
  alert.acknowledgedBy = acknowledgedBy;
  alert.acknowledgedAt = new Date();

  logger.info('Alert acknowledged', { alertId, acknowledgedBy });

  return true;
}

/**
 * Get unacknowledged alert count for a user
 */
export function getUnacknowledgedAlertCount(userId: string): number {
  return getUserAlerts(userId, { acknowledged: false }).length;
}

/**
 * Delete old alerts (cleanup)
 */
export function cleanupOldAlerts(olderThanDays: number = 30): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  let deletedCount = 0;

  for (const [alertId, alert] of alertStore.entries()) {
    if (alert.timestamp < cutoffDate && alert.acknowledged) {
      alertStore.delete(alertId);
      deletedCount++;
    }
  }

  logger.info('Alert cleanup completed', { deletedCount });

  return deletedCount;
}
