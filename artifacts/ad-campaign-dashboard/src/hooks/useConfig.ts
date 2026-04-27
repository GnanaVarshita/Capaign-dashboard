import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Region } from '../types';
import { api } from '../lib/api';

const CONFIG_QUERY_KEY = ['config'];
const REGIONS_QUERY_KEY = ['regions'];

export function useConfig() {
  const queryClient = useQueryClient();

  const { data: config = { products: [], crops: [], activities: [] } } = useQuery({
    queryKey: CONFIG_QUERY_KEY,
    queryFn: () => api.get('/api/config'),
  });

  const { data: regions = [] } = useQuery<Region[]>({
    queryKey: REGIONS_QUERY_KEY,
    queryFn: () => api.get('/api/regions'),
  });

  const products = config.products || [];
  const crops = config.crops || [];
  const activities = config.activities || [];

  const fetchConfig = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: REGIONS_QUERY_KEY });
  }, [queryClient]);

  // --- Mutations ---
  const addProductMutation = useMutation({
    mutationFn: (name: string) => api.post('/api/config/products', { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY }),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ oldName, newName }: { oldName: string; newName: string }) => 
      api.put(`/api/config/products/${encodeURIComponent(oldName)}`, { name: newName }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (name: string) => api.delete(`/api/config/products/${encodeURIComponent(name)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY }),
  });

  const addActivityMutation = useMutation({
    mutationFn: (name: string) => api.post('/api/config/activities', { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY }),
  });

  const updateActivityMutation = useMutation({
    mutationFn: ({ oldName, newName }: { oldName: string; newName: string }) => 
      api.put(`/api/config/activities/${encodeURIComponent(oldName)}`, { name: newName }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY }),
  });

  const deleteActivityMutation = useMutation({
    mutationFn: (name: string) => api.delete(`/api/config/activities/${encodeURIComponent(name)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY }),
  });

  const addRegionMutation = useMutation({
    mutationFn: (region: Region) => api.post('/api/regions', region),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REGIONS_QUERY_KEY }),
  });

  const updateRegionMutation = useMutation({
    mutationFn: ({ name, updates }: { name: string; updates: Partial<Region> }) => 
      api.put(`/api/regions/${encodeURIComponent(name)}`, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REGIONS_QUERY_KEY }),
  });

  return {
    products, crops, activities, regions,
    fetchConfig,
    addProduct: (name: string) => addProductMutation.mutateAsync(name),
    updateProduct: (oldName: string, newName: string) => updateProductMutation.mutateAsync({ oldName, newName }),
    deleteProduct: (name: string) => deleteProductMutation.mutateAsync(name),
    addActivity: (name: string) => addActivityMutation.mutateAsync(name),
    updateActivity: (oldName: string, newName: string) => updateActivityMutation.mutateAsync({ oldName, newName }),
    deleteActivity: (name: string) => deleteActivityMutation.mutateAsync(name),
    addRegion: (region: Region) => addRegionMutation.mutateAsync(region),
    updateRegion: (name: string, updates: Partial<Region>) => updateRegionMutation.mutateAsync({ name, updates }),
  };
}
