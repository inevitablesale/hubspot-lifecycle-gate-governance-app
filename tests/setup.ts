/**
 * Jest Test Setup
 */

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.HUBSPOT_CLIENT_ID = 'test-client-id';
process.env.HUBSPOT_CLIENT_SECRET = 'test-client-secret';
process.env.HUBSPOT_REDIRECT_URI = 'http://localhost:3001/oauth/callback';
process.env.APP_SECRET = 'test-secret';
process.env.BASE_URL = 'http://localhost:3001';
process.env.LOG_LEVEL = 'error'; // Suppress logs during tests

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(() => {
  // Any cleanup needed
});
