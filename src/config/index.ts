/**
 * Application Configuration
 */

import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  baseUrl: string;
  appSecret: string;
  hubspot: HubSpotConfig;
}

export interface HubSpotConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  appSecret: process.env.APP_SECRET || 'default-secret-change-in-production',
  hubspot: {
    clientId: process.env.HUBSPOT_CLIENT_ID || '',
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET || '',
    redirectUri: process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:3000/oauth/callback',
    scopes: (process.env.HUBSPOT_SCOPES || 'crm.objects.contacts.read,crm.objects.deals.read').split(','),
  },
};

export function validateConfig(): void {
  const requiredInProduction = ['HUBSPOT_CLIENT_ID', 'HUBSPOT_CLIENT_SECRET', 'APP_SECRET'];
  
  if (config.nodeEnv === 'production') {
    for (const key of requiredInProduction) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }
  }
}

export default config;
