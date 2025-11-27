/**
 * Scorecard Service Unit Tests
 */

import {
  getOrCreateScorecard,
  recordStageTransition,
  getScorecard,
  getUserViolations,
  resolveViolation,
  getAllScorecards,
} from '../../src/services/scorecard.service';

describe('Scorecard Service', () => {
  const testUserId = 'test-user-1';
  const testUserName = 'Test User';

  describe('getOrCreateScorecard', () => {
    it('should create a new scorecard for a new user', () => {
      const scorecard = getOrCreateScorecard(testUserId, testUserName);

      expect(scorecard.userId).toBe(testUserId);
      expect(scorecard.userName).toBe(testUserName);
      expect(scorecard.complianceScore).toBe(100);
      expect(scorecard.metrics.totalStageTransitions).toBe(0);
    });

    it('should return existing scorecard for known user', () => {
      const scorecard1 = getOrCreateScorecard(testUserId, testUserName);
      const scorecard2 = getOrCreateScorecard(testUserId, testUserName);

      expect(scorecard1).toBe(scorecard2);
    });
  });

  describe('recordStageTransition', () => {
    it('should record a valid transition', () => {
      const userId = 'transition-test-user';
      
      recordStageTransition(
        userId,
        'Transition Test User',
        'contact',
        'contact-123',
        'lead',
        'mql',
        true
      );

      const scorecard = getScorecard(userId);
      expect(scorecard).toBeDefined();
      expect(scorecard?.metrics.totalStageTransitions).toBe(1);
      expect(scorecard?.metrics.validTransitions).toBe(1);
      expect(scorecard?.metrics.contactsStagedCorrectly).toBe(1);
    });

    it('should record an invalid transition with violation', () => {
      const userId = 'invalid-transition-user';
      
      recordStageTransition(
        userId,
        'Invalid Transition User',
        'deal',
        'deal-123',
        'appointment',
        'qualified',
        false,
        ['amount', 'owner'],
        'rule-1',
        'Test Rule'
      );

      const scorecard = getScorecard(userId);
      expect(scorecard).toBeDefined();
      expect(scorecard?.metrics.totalStageTransitions).toBe(1);
      expect(scorecard?.metrics.invalidAttempts).toBe(1);
      expect(scorecard?.violations.length).toBe(1);
      expect(scorecard?.complianceScore).toBeLessThan(100);
    });

    it('should update compliance score based on transitions', () => {
      const userId = 'compliance-score-user';
      
      // Record valid transitions
      for (let i = 0; i < 8; i++) {
        recordStageTransition(
          userId,
          'Compliance Score User',
          'contact',
          `contact-${i}`,
          'lead',
          'mql',
          true
        );
      }

      // Record invalid transitions
      for (let i = 0; i < 2; i++) {
        recordStageTransition(
          userId,
          'Compliance Score User',
          'contact',
          `contact-fail-${i}`,
          'lead',
          'mql',
          false,
          ['email'],
          'rule-1',
          'Test Rule'
        );
      }

      const scorecard = getScorecard(userId);
      expect(scorecard?.metrics.totalStageTransitions).toBe(10);
      expect(scorecard?.metrics.validTransitions).toBe(8);
      // 80% valid * 0.6 + 100% field compliance * 0.4 = 48 + 40 = 88
      expect(scorecard?.complianceScore).toBeCloseTo(88, 0);
    });
  });

  describe('getUserViolations', () => {
    it('should return user violations', () => {
      const userId = 'violation-user';
      
      recordStageTransition(
        userId,
        'Violation User',
        'deal',
        'deal-1',
        'appointment',
        'qualified',
        false,
        ['amount'],
        'rule-1',
        'Amount Required'
      );

      const violations = getUserViolations(userId);
      expect(violations.length).toBe(1);
      expect(violations[0].missingFields).toContain('amount');
    });

    it('should filter violations by resolved status', () => {
      const userId = 'filter-violation-user';
      
      recordStageTransition(
        userId,
        'Filter Violation User',
        'deal',
        'deal-1',
        'appointment',
        'qualified',
        false,
        ['amount'],
        'rule-1',
        'Amount Required'
      );

      const unresolved = getUserViolations(userId, { resolved: false });
      expect(unresolved.length).toBe(1);

      const resolved = getUserViolations(userId, { resolved: true });
      expect(resolved.length).toBe(0);
    });
  });

  describe('resolveViolation', () => {
    it('should resolve a violation', () => {
      const userId = 'resolve-violation-user';
      
      recordStageTransition(
        userId,
        'Resolve Violation User',
        'deal',
        'deal-1',
        'appointment',
        'qualified',
        false,
        ['amount'],
        'rule-1',
        'Amount Required'
      );

      const violations = getUserViolations(userId);
      const violationId = violations[0].id;

      const success = resolveViolation(userId, violationId);
      expect(success).toBe(true);

      const resolvedViolations = getUserViolations(userId, { resolved: true });
      expect(resolvedViolations.length).toBe(1);
      expect(resolvedViolations[0].resolvedAt).toBeDefined();
    });

    it('should return false for non-existent violation', () => {
      const success = resolveViolation('unknown-user', 'unknown-violation');
      expect(success).toBe(false);
    });
  });

  describe('getAllScorecards', () => {
    it('should return all scorecards sorted by compliance score', () => {
      // Create some scorecards
      getOrCreateScorecard('all-1', 'User 1');
      getOrCreateScorecard('all-2', 'User 2');

      const all = getAllScorecards();
      expect(all.length).toBeGreaterThan(0);
      
      // Check sorted by compliance score descending
      for (let i = 1; i < all.length; i++) {
        expect(all[i - 1].complianceScore).toBeGreaterThanOrEqual(all[i].complianceScore);
      }
    });
  });
});
