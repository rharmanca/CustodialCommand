import { useCallback } from 'react';
import { useToast } from './use-toast';

interface ErrorHandlerOptions {
  showSuccess?: (title: string, description?: string, duration?: number) => string;
  showError?: (title: string, description?: string, duration?: number) => string;
  showInfo?: (title: string, description?: string, duration?: number) => string;
}

export function useErrorHandler(options?: ErrorHandlerOptions) {
  const { toast } = useToast();

  const handleError = useCallback((error: unknown, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);
    
    let message = 'An unexpected error occurred';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    if (options?.showError) {
      options.showError('Error', message);
    } else {
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
        duration: 5000
      });
    }
  }, [toast, options]);

  const handleSuccess = useCallback((title: string, description?: string) => {
    if (options?.showSuccess) {
      options.showSuccess(title, description);
    } else {
      toast({
        title,
        description,
        duration: 4000
      });
    }
  }, [toast, options]);

  const handleApiError = useCallback(async (response: Response, context?: string) => {
    try {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      const message = errorData.error || errorData.message || `HTTP ${response.status}`;
      handleError(new Error(message), context);
    } catch (parseError) {
      handleError(new Error(`HTTP ${response.status}: ${response.statusText}`), context);
    }
  }, [handleError]);

  return {
    handleError,
    handleSuccess,
    handleApiError
  };
}