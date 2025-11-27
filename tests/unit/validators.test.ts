/**
 * Validators Utility Unit Tests
 */

import {
  isValidEmail,
  isValidPhone,
  isNonEmpty,
  exists,
  matchesPattern,
  hasMinLength,
  parseNumeric,
} from '../../src/utils/validators';

describe('Validators', () => {
  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@gmail.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct phone numbers', () => {
      expect(isValidPhone('+1-555-555-5555')).toBe(true);
      expect(isValidPhone('5555555555')).toBe(true);
      expect(isValidPhone('+44 20 7946 0958')).toBe(true);
      expect(isValidPhone('(555) 555-5555')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abc')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('isNonEmpty', () => {
    it('should return true for non-empty values', () => {
      expect(isNonEmpty('hello')).toBe(true);
      expect(isNonEmpty('  hello  ')).toBe(true);
      expect(isNonEmpty(0)).toBe(true);
      expect(isNonEmpty(false)).toBe(true);
    });

    it('should return false for empty values', () => {
      expect(isNonEmpty('')).toBe(false);
      expect(isNonEmpty('   ')).toBe(false);
      expect(isNonEmpty(null)).toBe(false);
      expect(isNonEmpty(undefined)).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing values', () => {
      expect(exists('hello')).toBe(true);
      expect(exists('')).toBe(true);
      expect(exists(0)).toBe(true);
      expect(exists(false)).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(exists(null)).toBe(false);
      expect(exists(undefined)).toBe(false);
    });
  });

  describe('matchesPattern', () => {
    it('should validate patterns correctly', () => {
      expect(matchesPattern('ABC123', '^[A-Z]+[0-9]+$')).toBe(true);
      expect(matchesPattern('abc', '^[a-z]+$')).toBe(true);
    });

    it('should reject non-matching patterns', () => {
      expect(matchesPattern('abc', '^[0-9]+$')).toBe(false);
      expect(matchesPattern('123', '^[a-z]+$')).toBe(false);
    });

    it('should handle invalid regex gracefully', () => {
      expect(matchesPattern('test', '[invalid')).toBe(false);
    });
  });

  describe('hasMinLength', () => {
    it('should validate minimum length', () => {
      expect(hasMinLength('hello', 5)).toBe(true);
      expect(hasMinLength('hello', 3)).toBe(true);
      expect(hasMinLength('hi', 5)).toBe(false);
    });
  });

  describe('parseNumeric', () => {
    it('should parse numeric strings', () => {
      expect(parseNumeric('100')).toBe(100);
      expect(parseNumeric('$1,000.50')).toBe(1000.5);
      expect(parseNumeric('-50')).toBe(-50);
    });

    it('should handle numbers directly', () => {
      expect(parseNumeric(42)).toBe(42);
      expect(parseNumeric(3.14)).toBe(3.14);
    });

    it('should return 0 for invalid values', () => {
      expect(parseNumeric('abc')).toBe(0);
      expect(parseNumeric(undefined)).toBe(0);
    });
  });
});
