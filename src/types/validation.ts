/**
 * Validation Types
 */

import { LifecycleStage, DealStage } from './hubspot';

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  currentValue?: string;
  requiredValue?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  recommendation?: string;
}

// Stage gate rule definition
export interface StageGateRule {
  id: string;
  name: string;
  description: string;
  fromStage: LifecycleStage | DealStage | string;
  toStage: LifecycleStage | DealStage | string;
  requiredFields: RequiredFieldRule[];
  dependencies?: StageDependency[];
  conditions?: StageCondition[];
  active: boolean;
}

export interface RequiredFieldRule {
  field: string;
  label: string;
  type: 'required' | 'non_empty' | 'regex' | 'min_length' | 'email' | 'phone';
  pattern?: string;
  minLength?: number;
  errorMessage?: string;
}

export interface StageDependency {
  type: 'association' | 'property' | 'stage';
  target: string;
  condition: string;
  errorMessage: string;
}

export interface StageCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
  value?: string | number;
  errorMessage: string;
}

// Validation request
export interface ValidationRequest {
  objectType: 'contact' | 'deal';
  objectId: string;
  currentStage: string;
  targetStage: string;
  properties: Record<string, string | undefined>;
  userId?: string;
}

// Validation context
export interface ValidationContext {
  request: ValidationRequest;
  rules: StageGateRule[];
  timestamp: Date;
}
