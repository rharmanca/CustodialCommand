import { useState, useCallback } from 'react';
import { apiRequest, ApiError } from '@/utils/api';
import { useErrorHandler } from './use-error-handler';

interface UseApiOptions {
  showSuccess?: (title: string, description?: string, duration?: number) => string;
  showError?: (title: string, description?: string, duration?: number) => string;
  showInfo?: (title: string, description?: string, duration?: number) => string;
}

export function useApi(options?: UseApiOptions) {
  const [loading, setLoading] = useState(false);
  const { handleError, handleSuccess, handleApiError } = useErrorHandler(options);

  const execute = useCallback(async <T = any>(
    url: string,
    requestOptions: RequestInit = {},
    successMessage?: string
  ): Promise<T | null> => {
    setLoading(true);
    try {
      const data = await apiRequest<T>(url, requestOptions);

      if (successMessage) {
        handleSuccess('Success', successMessage);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        handleError(error, `API request to ${url}`);
      } else {
        handleError(error, `Network request to ${url}`);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  const get = useCallback(<T = any>(url: string, successMessage?: string) => {
    return execute<T>(url, { method: 'GET' }, successMessage);
  }, [execute]);

  const post = useCallback(<T = any>(url: string, data?: any, successMessage?: string) => {
    return execute<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, successMessage);
  }, [execute]);

  const put = useCallback(<T = any>(url: string, data?: any, successMessage?: string) => {
    return execute<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, successMessage);
  }, [execute]);

  const patch = useCallback(<T = any>(url: string, data?: any, successMessage?: string) => {
    return execute<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }, successMessage);
  }, [execute]);

  const del = useCallback(<T = any>(url: string, successMessage?: string) => {
    return execute<T>(url, { method: 'DELETE' }, successMessage);
  }, [execute]);

  return {
    loading,
    execute,
    get,
    post,
    put,
    patch,
    delete: del
  };
}

export async function createInspection(data: any) {
  // Use apiRequest which handles CSRF tokens and credentials
  return apiRequest('/api/inspections', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}