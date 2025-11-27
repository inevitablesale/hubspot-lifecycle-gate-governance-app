/**
 * OAuth Types
 */

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tokenType: string;
  portalId: number;
}

export interface OAuthState {
  state: string;
  redirectUri: string;
  createdAt: Date;
}

export interface OAuthCallbackParams {
  code: string;
  state: string;
}

export interface TokenRefreshResult {
  success: boolean;
  tokens?: OAuthTokens;
  error?: string;
}
