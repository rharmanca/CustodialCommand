import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Inspection } from '@shared/schema';
import { getCsrfToken, refreshCsrfTokenIfNeeded } from '@/utils/csrf';
import { PENDING_COUNT_UPDATED_EVENT } from '@/hooks/usePendingCount';

export interface PendingInspection extends Inspection {
  photoCount?: number;
  thumbnailUrl?: string;
}

export interface PendingInspectionsOptions {
  school?: string;
  page?: number;
  limit?: number;
}

export interface PendingInspectionsResponse {
  data: PendingInspection[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

export interface CompleteInspectionData {
  floors: number;
  verticalHorizontalSurfaces: number;
  ceiling: number;
  restrooms: number;
  customerSatisfaction: number;
  trash: number;
  projectCleaning: number;
  activitySupport: number;
  safetyCompliance: number;
  equipment: number;
  monitoring: number;
  notes?: string;
  tags?: string[];
}

interface UsePendingInspectionsReturn {
  // Data
  inspections: PendingInspection[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  } | null;

  // Actions
  refetch: () => Promise<void>;
  completeInspection: (id: number, data: CompleteInspectionData) => Promise<boolean>;
  discardInspection: (id: number) => Promise<boolean>;

  // Individual operation states
  isCompleting: boolean;
  isDiscarding: boolean;
  completeError: string | null;
  discardError: string | null;
}

export const usePendingInspections = (
  options: PendingInspectionsOptions = {}
): UsePendingInspectionsReturn => {
  const { toast } = useToast();
  const [inspections, setInspections] = useState<PendingInspection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UsePendingInspectionsReturn['pagination']>(null);

  // Operation states
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [discardError, setDiscardError] = useState<string | null>(null);

  const fetchPendingInspections = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.school) params.append('school', options.school);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());

      const queryString = params.toString();
      const url = `/api/inspections/pending${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result: PendingInspectionsResponse = await response.json();
      setInspections(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pending inspections';
      setError(errorMessage);
      console.error('Error fetching pending inspections:', err);
    } finally {
      setIsLoading(false);
    }
  }, [options.school, options.page, options.limit]);

  // Initial fetch
  useEffect(() => {
    fetchPendingInspections();
  }, [fetchPendingInspections]);

  const completeInspection = useCallback(async (
    id: number,
    data: CompleteInspectionData
  ): Promise<boolean> => {
    setIsCompleting(true);
    setCompleteError(null);

    try {
      await refreshCsrfTokenIfNeeded();
      const csrfToken = getCsrfToken();

      const response = await fetch(`/api/inspections/${id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Remove completed inspection from list
      setInspections(prev => prev.filter(insp => insp.id !== id));

      toast({
        title: 'Inspection Completed',
        description: 'The inspection has been marked as complete.',
      });

      // Refresh the list to update pagination
      await fetchPendingInspections();
      window.dispatchEvent(new Event(PENDING_COUNT_UPDATED_EVENT));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete inspection';
      setCompleteError(errorMessage);
      console.error('Error completing inspection:', err);

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      return false;
    } finally {
      setIsCompleting(false);
    }
  }, [fetchPendingInspections, toast]);

  const discardInspection = useCallback(async (id: number): Promise<boolean> => {
    setIsDiscarding(true);
    setDiscardError(null);

    try {
      await refreshCsrfTokenIfNeeded();
      const csrfToken = getCsrfToken();

      const response = await fetch(`/api/inspections/${id}/discard`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Remove discarded inspection from list
      setInspections(prev => prev.filter(insp => insp.id !== id));

      toast({
        title: 'Inspection Discarded',
        description: 'The inspection has been discarded.',
      });

      // Refresh the list to update pagination
      await fetchPendingInspections();
      window.dispatchEvent(new Event(PENDING_COUNT_UPDATED_EVENT));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to discard inspection';
      setDiscardError(errorMessage);
      console.error('Error discarding inspection:', err);

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      return false;
    } finally {
      setIsDiscarding(false);
    }
  }, [fetchPendingInspections, toast]);

  return {
    inspections,
    isLoading,
    error,
    pagination,
    refetch: fetchPendingInspections,
    completeInspection,
    discardInspection,
    isCompleting,
    isDiscarding,
    completeError,
    discardError,
  };
};

export default usePendingInspections;
