import { getCsrfToken, refreshCsrfTokenIfNeeded } from './csrf';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add CSRF token for state-changing operations
    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      // Refresh token if needed
      await refreshCsrfTokenIfNeeded();

      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      } else {
        // Log warning but don't block request (backend may not support CSRF yet)
        console.warn('[CSRF] No token available for', method, url);
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `HTTP ${response.status}: ${response.statusText}` 
      }));
      
      throw new ApiError(
        errorData.error || errorData.message || `Request failed with status ${response.status}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

export async function apiGet<T = any>(url: string): Promise<T> {
  return apiRequest<T>(url, { method: 'GET' });
}

export async function apiPost<T = any>(url: string, data?: any): Promise<T> {
  return apiRequest<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiPut<T = any>(url: string, data?: any): Promise<T> {
  return apiRequest<T>(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiPatch<T = any>(url: string, data?: any): Promise<T> {
  return apiRequest<T>(url, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  return apiRequest<T>(url, { method: 'DELETE' });
}

export { ApiError };