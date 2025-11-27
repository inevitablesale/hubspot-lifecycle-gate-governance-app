/**
 * API Integration Tests
 */

import request from 'supertest';
import { createApp } from '../../src/app';
import { Express } from 'express';

describe('API Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  describe('Health Endpoints', () => {
    it('GET /health should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
    });

    it('GET /health/detailed should return detailed info', async () => {
      const response = await request(app).get('/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.memory).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });

  describe('Root Endpoint', () => {
    it('GET / should return app info', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('HubSpot Lifecycle Gate Governance App');
      expect(response.body.endpoints).toBeDefined();
    });
  });

  describe('Validation Endpoints', () => {
    it('POST /api/validation/validate should validate stage transition', async () => {
      const response = await request(app)
        .post('/api/validation/validate')
        .send({
          objectType: 'contact',
          objectId: '12345',
          currentStage: 'lead',
          targetStage: 'marketingqualifiedlead',
          properties: {
            email: 'test@example.com',
            firstname: 'John',
            lastname: 'Doe',
            company: 'Acme Corp',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result).toBeDefined();
      expect(response.body.result.isValid).toBe(true);
    });

    it('POST /api/validation/validate should fail with missing fields', async () => {
      const response = await request(app)
        .post('/api/validation/validate')
        .send({
          objectType: 'contact',
          objectId: '12345',
          currentStage: 'lead',
          targetStage: 'marketingqualifiedlead',
          properties: {
            email: 'test@example.com',
            // Missing other required fields
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.result.isValid).toBe(false);
      expect(response.body.result.errors.length).toBeGreaterThan(0);
    });

    it('POST /api/validation/validate should reject invalid object type', async () => {
      const response = await request(app)
        .post('/api/validation/validate')
        .send({
          objectType: 'invalid',
          objectId: '12345',
          currentStage: 'lead',
          targetStage: 'mql',
          properties: {},
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('GET /api/validation/rules/contact should return contact rules', async () => {
      const response = await request(app).get('/api/validation/rules/contact');

      expect(response.status).toBe(200);
      expect(response.body.objectType).toBe('contact');
      expect(response.body.rules).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('GET /api/validation/rules/deal should return deal rules', async () => {
      const response = await request(app).get('/api/validation/rules/deal');

      expect(response.status).toBe(200);
      expect(response.body.objectType).toBe('deal');
      expect(response.body.rules).toBeInstanceOf(Array);
    });

    it('POST /api/validation/validate/batch should handle batch validation', async () => {
      const response = await request(app)
        .post('/api/validation/validate/batch')
        .send({
          requests: [
            {
              objectType: 'contact',
              objectId: '1',
              currentStage: 'lead',
              targetStage: 'marketingqualifiedlead',
              properties: {
                email: 'test1@example.com',
                firstname: 'Test',
                lastname: 'User',
                company: 'Company',
              },
            },
            {
              objectType: 'contact',
              objectId: '2',
              currentStage: 'lead',
              targetStage: 'marketingqualifiedlead',
              properties: {},
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      expect(response.body.valid).toBe(1);
      expect(response.body.invalid).toBe(1);
    });
  });

  describe('CRM Card Endpoints', () => {
    it('GET /crm-cards/contact should return contact card', async () => {
      const response = await request(app)
        .get('/crm-cards/contact')
        .query({
          portalId: '12345',
          associatedObjectId: '67890',
          lifecyclestage: 'lead',
        });

      expect(response.status).toBe(200);
      expect(response.body.results).toBeInstanceOf(Array);
    });

    it('GET /crm-cards/deal should return deal card', async () => {
      const response = await request(app)
        .get('/crm-cards/deal')
        .query({
          portalId: '12345',
          associatedObjectId: '67890',
          dealstage: 'appointmentscheduled',
        });

      expect(response.status).toBe(200);
      expect(response.body.results).toBeInstanceOf(Array);
    });
  });

  describe('Scorecard Endpoints', () => {
    it('GET /api/scorecards should return all scorecards', async () => {
      const response = await request(app).get('/api/scorecards');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.scorecards).toBeInstanceOf(Array);
    });

    it('GET /api/scorecards/:userId should return 404 for unknown user', async () => {
      const response = await request(app).get('/api/scorecards/unknown-user-xyz');

      expect(response.status).toBe(404);
    });

    it('GET /api/scorecards/:userId/card should return scorecard card', async () => {
      const response = await request(app)
        .get('/api/scorecards/test-user/card')
        .query({ userName: 'Test User' });

      expect(response.status).toBe(200);
      expect(response.body.results).toBeInstanceOf(Array);
    });
  });

  describe('Alert Endpoints', () => {
    it('GET /api/alerts/portal/:portalId should return portal alerts', async () => {
      const response = await request(app).get('/api/alerts/portal/12345');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.alerts).toBeInstanceOf(Array);
    });

    it('GET /api/alerts/user/:userId should return user alerts', async () => {
      const response = await request(app).get('/api/alerts/user/test-user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.alerts).toBeInstanceOf(Array);
    });

    it('GET /api/alerts/:alertId should return 404 for unknown alert', async () => {
      const response = await request(app).get('/api/alerts/unknown-alert-id');

      expect(response.status).toBe(404);
    });
  });

  describe('OAuth Endpoints', () => {
    it('GET /oauth/status/:portalId should return auth status', async () => {
      const response = await request(app).get('/oauth/status/12345');

      expect(response.status).toBe(200);
      expect(response.body.authenticated).toBe(false);
      expect(response.body.portalId).toBe(12345);
    });

    it('GET /oauth/status/invalid should return 400', async () => {
      const response = await request(app).get('/oauth/status/invalid');

      expect(response.status).toBe(400);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown/route');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
