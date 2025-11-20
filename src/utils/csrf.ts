/**
 * CSRF Token Management
 *
 * Handles fetching, storing, and refreshing CSRF tokens for API requests.
 * Tokens are required for all state-changing operations (POST, PUT, PATCH, DELETE).
 */

interface CsrfTokenResponse {
  csrfToken: string;
  expiresIn: number;
}

// In-memory storage for CSRF token
let csrfToken: string | null = null;
let tokenExpiresAt: number | null = null;

/**
 * Fetch a new CSRF token from the server
 */
export async function fetchCsrfToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include', // Important: include cookies
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }

    const data: CsrfTokenResponse = await response.json();

    csrfToken = data.csrfToken;
    // Set expiration 1 minute before actual expiry for safety
    tokenExpiresAt = Date.now() + data.expiresIn - 60000;

    console.log('[CSRF] Token fetched successfully');
    return csrfToken;
  } catch (error) {
    console.error('[CSRF] Failed to fetch token:', error);
    throw error;
  }
}

/**
 * Get the current CSRF token
 * Returns null if no token is available
 */
export function getCsrfToken(): string | null {
  return csrfToken;
}

/**
 * Check if the current token is expired or about to expire
 */
export function isTokenExpired(): boolean {
  if (!csrfToken || !tokenExpiresAt) {
    return true;
  }
  return Date.now() >= tokenExpiresAt;
}

/**
 * Refresh the CSRF token if it's expired or about to expire
 */
export async function refreshCsrfTokenIfNeeded(): Promise<string | null> {
  if (isTokenExpired()) {
    try {
      return await fetchCsrfToken();
    } catch (error) {
      console.error('[CSRF] Failed to refresh token:', error);
      return null;
    }
  }
  return csrfToken;
}

/**
 * Clear the stored CSRF token (useful on logout)
 */
export function clearCsrfToken(): void {
  csrfToken = null;
  tokenExpiresAt = null;
  console.log('[CSRF] Token cleared');
}

/**
 * Initialize CSRF token on app startup
 * Call this when the application loads
 */
export async function initializeCsrf(): Promise<void> {
  try {
    await fetchCsrfToken();
    console.log('[CSRF] Initialized successfully');
  } catch (error) {
    // Don't throw - allow app to continue without CSRF if backend doesn't support it yet
    console.warn('[CSRF] Initialization failed (backend may not support CSRF yet):', error);
  }
}
