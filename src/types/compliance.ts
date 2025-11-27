/**
 * Compliance and Scorecard Types
 */

export interface RepScorecard {
  userId: string;
  userName: string;
  period: ScorecardPeriod;
  metrics: ScorecardMetrics;
  complianceScore: number;
  trend: 'improving' | 'stable' | 'declining';
  violations: ComplianceViolation[];
  lastUpdated: Date;
}

export interface ScorecardPeriod {
  startDate: Date;
  endDate: Date;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface ScorecardMetrics {
  totalStageTransitions: number;
  validTransitions: number;
  invalidAttempts: number;
  requiredFieldsCompliance: number;
  averageStageVelocity: number; // days
  dealsStagedCorrectly: number;
  contactsStagedCorrectly: number;
}

export interface ComplianceViolation {
  id: string;
  timestamp: Date;
  objectType: 'contact' | 'deal';
  objectId: string;
  violationType: ViolationType;
  fromStage: string;
  toStage: string;
  missingFields?: string[];
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolvedAt?: Date;
}

export type ViolationType = 
  | 'missing_required_field'
  | 'invalid_stage_progression'
  | 'skipped_stage'
  | 'dependency_not_met'
  | 'condition_failed'
  | 'backward_progression';

// Alert types
export interface GovernanceAlert {
  id: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  objectType: 'contact' | 'deal';
  objectId: string;
  userId: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  metadata?: Record<string, unknown>;
}

export type AlertType =
  | 'stage_gate_violation'
  | 'required_field_missing'
  | 'compliance_threshold'
  | 'sla_breach'
  | 'bulk_violation'
  | 'system_error';

// Timeline event
export interface TimelineEvent {
  eventTemplateId: string;
  objectId: string;
  tokens: Record<string, string>;
  extraData?: Record<string, unknown>;
}
