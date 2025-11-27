/**
 * Alerts Service Unit Tests
 */

import {
  createAlert,
  getAlert,
  getPortalAlerts,
  getUserAlerts,
  acknowledgeAlert,
  getUnacknowledgedAlertCount,
} from '../../src/alerts';
import { AlertType } from '../../src/types';

describe('Alerts Service', () => {
  const testPortalId = 12345;
  const testUserId = 'alert-test-user';

  describe('createAlert', () => {
    it('should create a new alert', () => {
      const alert = createAlert(testPortalId, {
        type: 'stage_gate_violation' as AlertType,
        severity: 'warning',
        title: 'Test Alert',
        message: 'This is a test alert',
        objectType: 'contact',
        objectId: 'contact-123',
        userId: testUserId,
      });

      expect(alert.id).toBeDefined();
      expect(alert.timestamp).toBeInstanceOf(Date);
      expect(alert.acknowledged).toBe(false);
      expect(alert.title).toBe('Test Alert');
    });
  });

  describe('getAlert', () => {
    it('should retrieve an existing alert', () => {
      const created = createAlert(testPortalId, {
        type: 'required_field_missing' as AlertType,
        severity: 'error',
        title: 'Missing Field',
        message: 'Required field is missing',
        objectType: 'deal',
        objectId: 'deal-456',
        userId: testUserId,
      });

      const retrieved = getAlert(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return undefined for non-existent alert', () => {
      const retrieved = getAlert('non-existent-id');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getPortalAlerts', () => {
    it('should return alerts for a portal', () => {
      const portalId = 99999;
      
      createAlert(portalId, {
        type: 'stage_gate_violation' as AlertType,
        severity: 'warning',
        title: 'Portal Alert 1',
        message: 'First alert',
        objectType: 'contact',
        objectId: 'contact-1',
        userId: 'user-1',
      });

      createAlert(portalId, {
        type: 'stage_gate_violation' as AlertType,
        severity: 'error',
        title: 'Portal Alert 2',
        message: 'Second alert',
        objectType: 'deal',
        objectId: 'deal-1',
        userId: 'user-1',
      });

      const alerts = getPortalAlerts(portalId);
      expect(alerts.length).toBe(2);
    });

    it('should filter by acknowledged status', () => {
      const portalId = 88888;
      
      const alert = createAlert(portalId, {
        type: 'stage_gate_violation' as AlertType,
        severity: 'warning',
        title: 'Filter Alert',
        message: 'Test',
        objectType: 'contact',
        objectId: 'contact-1',
        userId: 'user-1',
      });

      acknowledgeAlert(alert.id, 'admin');

      const acknowledged = getPortalAlerts(portalId, { acknowledged: true });
      expect(acknowledged.length).toBe(1);

      const unacknowledged = getPortalAlerts(portalId, { acknowledged: false });
      expect(unacknowledged.length).toBe(0);
    });
  });

  describe('getUserAlerts', () => {
    it('should return alerts for a user', () => {
      const userId = 'user-alerts-test';
      const portalId = 77777;
      
      createAlert(portalId, {
        type: 'stage_gate_violation' as AlertType,
        severity: 'warning',
        title: 'User Alert',
        message: 'Test',
        objectType: 'contact',
        objectId: 'contact-1',
        userId,
      });

      const alerts = getUserAlerts(userId);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.every((a) => a.userId === userId)).toBe(true);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge an alert', () => {
      const alert = createAlert(66666, {
        type: 'stage_gate_violation' as AlertType,
        severity: 'warning',
        title: 'Ack Test',
        message: 'Test',
        objectType: 'contact',
        objectId: 'contact-1',
        userId: 'ack-user',
      });

      const success = acknowledgeAlert(alert.id, 'admin-user');
      expect(success).toBe(true);

      const updated = getAlert(alert.id);
      expect(updated?.acknowledged).toBe(true);
      expect(updated?.acknowledgedBy).toBe('admin-user');
      expect(updated?.acknowledgedAt).toBeInstanceOf(Date);
    });

    it('should return false for non-existent alert', () => {
      const success = acknowledgeAlert('non-existent', 'admin');
      expect(success).toBe(false);
    });
  });

  describe('getUnacknowledgedAlertCount', () => {
    it('should return count of unacknowledged alerts', () => {
      const userId = 'count-test-user';
      const portalId = 55555;
      
      createAlert(portalId, {
        type: 'stage_gate_violation' as AlertType,
        severity: 'warning',
        title: 'Count Test 1',
        message: 'Test',
        objectType: 'contact',
        objectId: 'contact-1',
        userId,
      });

      createAlert(portalId, {
        type: 'stage_gate_violation' as AlertType,
        severity: 'warning',
        title: 'Count Test 2',
        message: 'Test',
        objectType: 'contact',
        objectId: 'contact-2',
        userId,
      });

      const count = getUnacknowledgedAlertCount(userId);
      expect(count).toBe(2);
    });
  });
});
