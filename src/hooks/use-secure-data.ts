
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SecureDataService } from "@/services/SecureDataService";

/**
 * Enhanced hook for securely handling sensitive data with comprehensive security features
 * @param table The database table to interact with
 * @param queryParams Additional query parameters
 * @param queryKey Optional custom query key
 */
export function useSecureData<T = any>(
  table: string, 
  queryParams?: Record<string, any>,
  queryKey?: string[]
) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  // Define the React Query key
  const key = queryKey || [table, JSON.stringify(queryParams || {})];

  // Query to fetch data with enhanced error handling
  const {
    data,
    isLoading,
    refetch
  } = useQuery({
    queryKey: key,
    queryFn: async () => {
      try {
        const { data, error } = await SecureDataService.getSecure(table, queryParams);
        
        if (error) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          setError(errorObj);
          throw errorObj;
        }
        
        setError(null);
        return data as T[];
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error occurred');
        setError(errorObj);
        throw errorObj;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('Authentication required')) {
        return false;
      }
      return failureCount < 2;
    }
  });

  // Mutation to add data with validation
  const addMutation = useMutation({
    mutationFn: async (newData: Partial<T>) => {
      if (!newData || typeof newData !== 'object') {
        throw new Error('Invalid data provided');
      }

      const { data, error } = await SecureDataService.insertSecure(table, newData);
      
      if (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setError(errorObj);
        throw errorObj;
      }
      
      setError(null);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (error) => {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setError(errorObj);
    }
  });

  // Mutation to update data with validation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data, idField = 'id' }: { id: string | number; data: Partial<T>; idField?: string }) => {
      if (!id || !data || typeof data !== 'object') {
        throw new Error('Invalid update parameters');
      }

      const { data: updatedData, error } = await SecureDataService.updateSecure(table, id, data, idField);
      
      if (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setError(errorObj);
        throw errorObj;
      }
      
      setError(null);
      return updatedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (error) => {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setError(errorObj);
    }
  });

  // Mutation to delete data with validation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, idField = 'id' }: { id: string | number; idField?: string }) => {
      if (!id) {
        throw new Error('ID is required for deletion');
      }

      const { success, error } = await SecureDataService.deleteSecure(table, id, idField);
      
      if (error || !success) {
        const errorObj = error instanceof Error ? error : new Error(String(error || 'Failed to delete'));
        setError(errorObj);
        throw errorObj;
      }
      
      setError(null);
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (error) => {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setError(errorObj);
    }
  });

  // Credit deduction mutation
  const deductCreditsMutation = useMutation({
    mutationFn: async ({ feature, credits }: { feature: string; credits: number }) => {
      if (!feature || credits <= 0) {
        throw new Error('Invalid credit deduction parameters');
      }

      const result = await SecureDataService.deductCreditsSecurely(feature, credits);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to deduct credits');
      }
      
      return result;
    },
    onError: (error) => {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setError(errorObj);
    }
  });

  return {
    data: data || [],
    isLoading,
    error,
    refetch,
    add: addMutation.mutate,
    update: updateMutation.mutate,
    remove: deleteMutation.mutate,
    deductCredits: deductCreditsMutation.mutate,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: deleteMutation.isPending,
    isDeductingCredits: deductCreditsMutation.isPending
  };
}
