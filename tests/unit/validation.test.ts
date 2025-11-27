/**
 * Validation Engine Unit Tests
 */

import {
  validateStageTransition,
  validateRequiredFields,
  validateConditions,
  getValidationRules,
} from '../../src/validation';
import { ValidationRequest, RequiredFieldRule, StageCondition } from '../../src/types';
import { LifecycleStage, DealStage } from '../../src/types/hubspot';

describe('Validation Engine', () => {
  describe('validateStageTransition', () => {
    it('should validate a valid contact transition', () => {
      const request: ValidationRequest = {
        objectType: 'contact',
        objectId: '12345',
        currentStage: LifecycleStage.LEAD,
        targetStage: LifecycleStage.MARKETING_QUALIFIED_LEAD,
        properties: {
          email: 'test@example.com',
          firstname: 'John',
          lastname: 'Doe',
          company: 'Acme Corp',
        },
      };

      const result = validateStageTransition(request);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when required fields are missing', () => {
      const request: ValidationRequest = {
        objectType: 'contact',
        objectId: '12345',
        currentStage: LifecycleStage.LEAD,
        targetStage: LifecycleStage.MARKETING_QUALIFIED_LEAD,
        properties: {
          email: 'test@example.com',
          // Missing firstname, lastname, company
        },
      };

      const result = validateStageTransition(request);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with invalid email', () => {
      const request: ValidationRequest = {
        objectType: 'contact',
        objectId: '12345',
        currentStage: LifecycleStage.LEAD,
        targetStage: LifecycleStage.MARKETING_QUALIFIED_LEAD,
        properties: {
          email: 'invalid-email',
          firstname: 'John',
          lastname: 'Doe',
          company: 'Acme Corp',
        },
      };

      const result = validateStageTransition(request);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'email')).toBe(true);
    });

    it('should warn on backward progression', () => {
      const request: ValidationRequest = {
        objectType: 'contact',
        objectId: '12345',
        currentStage: LifecycleStage.OPPORTUNITY,
        targetStage: LifecycleStage.LEAD,
        properties: {},
      };

      const result = validateStageTransition(request);

      expect(result.warnings.some((w) => w.code === 'BACKWARD_PROGRESSION')).toBe(true);
    });

    it('should warn on skipped stages', () => {
      const request: ValidationRequest = {
        objectType: 'contact',
        objectId: '12345',
        currentStage: LifecycleStage.SUBSCRIBER,
        targetStage: LifecycleStage.OPPORTUNITY,
        properties: {},
      };

      const result = validateStageTransition(request);

      expect(result.warnings.some((w) => w.code === 'SKIPPED_STAGES')).toBe(true);
    });
  });

  describe('validateRequiredFields', () => {
    it('should validate required fields correctly', () => {
      const rules: RequiredFieldRule[] = [
        { field: 'email', label: 'Email', type: 'email' },
        { field: 'name', label: 'Name', type: 'non_empty' },
      ];

      const properties = {
        email: 'test@example.com',
        name: 'John Doe',
      };

      const errors = validateRequiredFields(rules, properties);

      expect(errors).toHaveLength(0);
    });

    it('should fail on invalid email', () => {
      const rules: RequiredFieldRule[] = [
        { field: 'email', label: 'Email', type: 'email' },
      ];

      const properties = {
        email: 'not-an-email',
      };

      const errors = validateRequiredFields(rules, properties);

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('email');
    });

    it('should fail on empty non_empty field', () => {
      const rules: RequiredFieldRule[] = [
        { field: 'name', label: 'Name', type: 'non_empty' },
      ];

      const properties = {
        name: '',
      };

      const errors = validateRequiredFields(rules, properties);

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('name');
    });

    it('should validate phone numbers', () => {
      const rules: RequiredFieldRule[] = [
        { field: 'phone', label: 'Phone', type: 'phone' },
      ];

      // Valid phone
      let errors = validateRequiredFields(rules, { phone: '+1-555-555-5555' });
      expect(errors).toHaveLength(0);

      // Invalid phone
      errors = validateRequiredFields(rules, { phone: '123' });
      expect(errors).toHaveLength(1);
    });
  });

  describe('validateConditions', () => {
    it('should validate equals condition', () => {
      const conditions: StageCondition[] = [
        {
          field: 'status',
          operator: 'equals',
          value: 'active',
          errorMessage: 'Status must be active',
        },
      ];

      let errors = validateConditions(conditions, { status: 'active' });
      expect(errors).toHaveLength(0);

      errors = validateConditions(conditions, { status: 'inactive' });
      expect(errors).toHaveLength(1);
    });

    it('should validate greater_than condition', () => {
      const conditions: StageCondition[] = [
        {
          field: 'amount',
          operator: 'greater_than',
          value: 0,
          errorMessage: 'Amount must be greater than 0',
        },
      ];

      let errors = validateConditions(conditions, { amount: '1000' });
      expect(errors).toHaveLength(0);

      errors = validateConditions(conditions, { amount: '0' });
      expect(errors).toHaveLength(1);
    });

    it('should validate exists condition', () => {
      const conditions: StageCondition[] = [
        {
          field: 'owner',
          operator: 'exists',
          errorMessage: 'Owner must be set',
        },
      ];

      let errors = validateConditions(conditions, { owner: '12345' });
      expect(errors).toHaveLength(0);

      errors = validateConditions(conditions, { owner: '' });
      expect(errors).toHaveLength(1);

      errors = validateConditions(conditions, {});
      expect(errors).toHaveLength(1);
    });
  });

  describe('getValidationRules', () => {
    it('should return contact rules', () => {
      const rules = getValidationRules('contact');
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every((r) => r.active)).toBe(true);
    });

    it('should return deal rules', () => {
      const rules = getValidationRules('deal');
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every((r) => r.active)).toBe(true);
    });
  });
});
