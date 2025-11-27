/**
 * OAuth Service for HubSpot Authentication
 */

import axios from 'axios';
import config from '../config';
import { OAuthTokens, TokenRefreshResult } from '../types';
import { logger } from '../utils';

const HUBSPOT_AUTH_URL = 'https://app.hubspot.com/oauth/authorize';
const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token';

// In-memory token storage (use Redis/DB in production)
const tokenStore = new Map<number, OAuthTokens>();

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.hubspot.clientId,
    redirect_uri: config.hubspot.redirectUri,
    scope: config.hubspot.scopes.join(' '),
    state,
  });

  return `${HUBSPOT_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
  try {
    const response = await axios.post(
      HUBSPOT_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.hubspot.clientId,
        client_secret: config.hubspot.clientSecret,
        redirect_uri: config.hubspot.redirectUri,
        code,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const tokens: OAuthTokens = {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
      tokenType: response.data.token_type,
      portalId: response.data.hub_id,
    };

    // Store tokens
    tokenStore.set(tokens.portalId, tokens);

    logger.info('OAuth tokens obtained', { portalId: tokens.portalId });

    return tokens;
  } catch (error) {
    logger.error('Failed to exchange code for tokens', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(portalId: number): Promise<TokenRefreshResult> {
  const tokens = tokenStore.get(portalId);

  if (!tokens) {
    return { success: false, error: 'No tokens found for portal' };
  }

  try {
    const response = await axios.post(
      HUBSPOT_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.hubspot.clientId,
        client_secret: config.hubspot.clientSecret,
        refresh_token: tokens.refreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const newTokens: OAuthTokens = {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
      tokenType: response.data.token_type,
      portalId,
    };

    tokenStore.set(portalId, newTokens);

    logger.info('OAuth tokens refreshed', { portalId });

    return { success: true, tokens: newTokens };
  } catch (error) {
    logger.error('Failed to refresh tokens', {
      portalId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { success: false, error: 'Failed to refresh tokens' };
  }
}

/**
 * Get current access token (refreshing if needed)
 */
export async function getAccessToken(portalId: number): Promise<string | null> {
  const tokens = tokenStore.get(portalId);

  if (!tokens) {
    return null;
  }

  // Check if token is expired or will expire in 5 minutes
  const expirationBuffer = 5 * 60 * 1000; // 5 minutes
  if (new Date(tokens.expiresAt).getTime() - expirationBuffer < Date.now()) {
    const result = await refreshAccessToken(portalId);
    if (result.success && result.tokens) {
      return result.tokens.accessToken;
    }
    return null;
  }

  return tokens.accessToken;
}

/**
 * Check if portal is authenticated
 */
export function isAuthenticated(portalId: number): boolean {
  return tokenStore.has(portalId);
}

/**
 * Remove tokens (logout)
 */
export function removeTokens(portalId: number): void {
  tokenStore.delete(portalId);
  logger.info('OAuth tokens removed', { portalId });
}

/**
 * Get stored tokens (for testing)
 */
export function getStoredTokens(portalId: number): OAuthTokens | undefined {
  return tokenStore.get(portalId);
}
