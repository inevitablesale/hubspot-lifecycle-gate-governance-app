/**
 * Validation Engine - Core Stage Gate Validation Logic
 */

import {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationRequest,
  StageGateRule,
  RequiredFieldRule,
  StageCondition,
} from '../types';
import {
  LIFECYCLE_STAGE_ORDER,
  DEAL_STAGE_ORDER,
} from '../types/hubspot';
import { getRulesForObjectType, getRuleForTransition } from '../config/rules';
import {
  isValidEmail,
  isValidPhone,
  isNonEmpty,
  exists,
  matchesPattern,
  hasMinLength,
  parseNumeric,
} from '../utils/validators';
import { logger } from '../utils';

/**
 * Validate a stage transition request
 */
export function validateStageTransition(request: ValidationRequest): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  logger.info('Validating stage transition', {
    objectType: request.objectType,
    objectId: request.objectId,
    from: request.currentStage,
    to: request.targetStage,
  });

  // Check for backward progression
  const backwardResult = checkBackwardProgression(request);
  if (backwardResult) {
    warnings.push(backwardResult);
  }

  // Check for skipped stages
  const skippedResult = checkSkippedStages(request);
  if (skippedResult) {
    warnings.push(skippedResult);
  }

  // Get the rule for this transition
  const rule = getRuleForTransition(request.objectType, request.currentStage, request.targetStage);

  if (rule) {
    // Validate required fields
    const fieldErrors = validateRequiredFields(rule.requiredFields, request.properties);
    errors.push(...fieldErrors);

    // Validate conditions
    if (rule.conditions) {
      const conditionErrors = validateConditions(rule.conditions, request.properties);
      errors.push(...conditionErrors);
    }
  }

  const result: ValidationResult = {
    isValid: errors.length === 0,
    errors,
    warnings,
  };

  logger.info('Validation complete', {
    objectId: request.objectId,
    isValid: result.isValid,
    errorCount: errors.length,
    warningCount: warnings.length,
  });

  return result;
}

/**
 * Check if transition is a backward progression
 */
function checkBackwardProgression(request: ValidationRequest): ValidationWarning | null {
  const stageOrder: Record<string, number> =
    request.objectType === 'contact' ? LIFECYCLE_STAGE_ORDER : DEAL_STAGE_ORDER;

  const currentOrder = stageOrder[request.currentStage];
  const targetOrder = stageOrder[request.targetStage];

  if (currentOrder !== undefined && targetOrder !== undefined && targetOrder < currentOrder) {
    return {
      code: 'BACKWARD_PROGRESSION',
      message: `Moving from ${request.currentStage} to ${request.targetStage} is a backward progression`,
      recommendation:
        'Backward progressions may require manager approval. Ensure this is intentional.',
    };
  }

  return null;
}

/**
 * Check if stages were skipped
 */
function checkSkippedStages(request: ValidationRequest): ValidationWarning | null {
  const stageOrder: Record<string, number> =
    request.objectType === 'contact' ? LIFECYCLE_STAGE_ORDER : DEAL_STAGE_ORDER;

  const currentOrder = stageOrder[request.currentStage];
  const targetOrder = stageOrder[request.targetStage];

  if (
    currentOrder !== undefined &&
    targetOrder !== undefined &&
    targetOrder > currentOrder + 1
  ) {
    // Find skipped stages
    const stageEntries = Object.entries(stageOrder) as [string, number][];
    const skipped = stageEntries
      .filter(([, order]) => order > currentOrder && order < targetOrder)
      .map(([stage]) => stage);

    if (skipped.length > 0) {
      return {
        code: 'SKIPPED_STAGES',
        message: `Skipping stages: ${skipped.join(', ')}`,
        recommendation: 'Consider whether all stage requirements have been met.',
      };
    }
  }

  return null;
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  rules: RequiredFieldRule[],
  properties: Record<string, string | undefined>
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const rule of rules) {
    const value = properties[rule.field];
    let isValid = true;
    let errorMessage = rule.errorMessage || `${rule.label} is invalid`;

    switch (rule.type) {
      case 'required':
        isValid = exists(value);
        errorMessage = rule.errorMessage || `${rule.label} is required`;
        break;

      case 'non_empty':
        isValid = isNonEmpty(value);
        errorMessage = rule.errorMessage || `${rule.label} cannot be empty`;
        break;

      case 'email':
        isValid = typeof value === 'string' && isValidEmail(value);
        errorMessage = rule.errorMessage || `${rule.label} must be a valid email`;
        break;

      case 'phone':
        isValid = typeof value === 'string' && isValidPhone(value);
        errorMessage = rule.errorMessage || `${rule.label} must be a valid phone number`;
        break;

      case 'regex':
        isValid =
          typeof value === 'string' && rule.pattern !== undefined && matchesPattern(value, rule.pattern);
        errorMessage = rule.errorMessage || `${rule.label} format is invalid`;
        break;

      case 'min_length':
        isValid =
          typeof value === 'string' &&
          rule.minLength !== undefined &&
          hasMinLength(value, rule.minLength);
        errorMessage = rule.errorMessage || `${rule.label} must be at least ${rule.minLength} characters`;
        break;
    }

    if (!isValid) {
      errors.push({
        code: `INVALID_${rule.field.toUpperCase()}`,
        message: errorMessage,
        field: rule.field,
        currentValue: value,
      });
    }
  }

  return errors;
}

/**
 * Validate stage conditions
 */
export function validateConditions(
  conditions: StageCondition[],
  properties: Record<string, string | undefined>
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const condition of conditions) {
    const value = properties[condition.field];
    let isValid = true;

    switch (condition.operator) {
      case 'equals':
        isValid = value === condition.value;
        break;

      case 'not_equals':
        isValid = value !== condition.value;
        break;

      case 'contains':
        isValid =
          typeof value === 'string' &&
          typeof condition.value === 'string' &&
          value.includes(condition.value);
        break;

      case 'greater_than':
        isValid =
          typeof condition.value === 'number' && parseNumeric(value) > condition.value;
        break;

      case 'less_than':
        isValid =
          typeof condition.value === 'number' && parseNumeric(value) < condition.value;
        break;

      case 'exists':
        isValid = exists(value) && isNonEmpty(value);
        break;
    }

    if (!isValid) {
      errors.push({
        code: `CONDITION_FAILED_${condition.field.toUpperCase()}`,
        message: condition.errorMessage,
        field: condition.field,
        currentValue: value,
      });
    }
  }

  return errors;
}

/**
 * Get all validation rules for an object type
 */
export function getValidationRules(objectType: 'contact' | 'deal'): StageGateRule[] {
  return getRulesForObjectType(objectType);
}

/**
 * Validate properties against all applicable rules
 */
export function validateAllRules(
  objectType: 'contact' | 'deal',
  properties: Record<string, string | undefined>
): ValidationResult {
  const rules = getValidationRules(objectType);
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const rule of rules) {
    const fieldErrors = validateRequiredFields(rule.requiredFields, properties);

    // Only add errors if this rule would be applicable
    if (fieldErrors.length > 0) {
      warnings.push({
        code: `RULE_${rule.id.toUpperCase().replace(/-/g, '_')}`,
        message: `Rule "${rule.name}" would fail for this record`,
        recommendation: `Missing fields: ${fieldErrors.map((e) => e.field).join(', ')}`,
      });
    }
  }

  return {
    isValid: true, // This is for informational purposes, so always valid
    errors,
    warnings,
  };
}
