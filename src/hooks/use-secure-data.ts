
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SecureDataService } from "@/services/SecureDataService";

/**
 * Hook for securely handling sensitive data
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

  // Query to fetch data
  const {
    data,
    isLoading,
    refetch
  } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await SecureDataService.getSecure(table, queryParams);
      
      if (error) {
        setError(error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
      
      return data as T[];
    }
  });

  // Mutation to add data
  const addMutation = useMutation({
    mutationFn: async (newData: Partial<T>) => {
      const { data, error } = await SecureDataService.insertSecure(table, newData);
      
      if (error) {
        setError(error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: key });
    }
  });

  // Mutation to update data
  const updateMutation = useMutation({
    mutationFn: async ({ id, data, idField = 'id' }: { id: string | number; data: Partial<T>; idField?: string }) => {
      const { data: updatedData, error } = await SecureDataService.updateSecure(table, id, data, idField);
      
      if (error) {
        setError(error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
      
      return updatedData;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: key });
    }
  });

  // Mutation to delete data
  const deleteMutation = useMutation({
    mutationFn: async ({ id, idField = 'id' }: { id: string | number; idField?: string }) => {
      const { success, error } = await SecureDataService.deleteSecure(table, id, idField);
      
      if (error || !success) {
        setError(error instanceof Error ? error : new Error(String(error || 'Failed to delete')));
        throw error || new Error('Failed to delete');
      }
      
      return { id };
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: key });
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
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: deleteMutation.isPending
  };
}
