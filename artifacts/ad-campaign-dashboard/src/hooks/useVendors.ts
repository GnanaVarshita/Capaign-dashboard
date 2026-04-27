import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ServiceReceiver, VendorProfile, User } from '../types';
import { api } from '../lib/api';

const RECEIVERS_QUERY_KEY = ['service-receivers'];
const PROFILES_QUERY_KEY = ['vendor-profiles'];

export function useVendors(currentUser: User | null) {
  const queryClient = useQueryClient();

  const { data: serviceReceivers = [] } = useQuery<ServiceReceiver[]>({
    queryKey: RECEIVERS_QUERY_KEY,
    queryFn: () => api.get('/api/service-receivers'),
  });

  const { data: vendorProfiles = {} } = useQuery<Record<string, VendorProfile>>({
    queryKey: PROFILES_QUERY_KEY,
    queryFn: () => api.get('/api/vendor-profiles'),
    enabled: !!currentUser,
  });

  const fetchVendorData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: RECEIVERS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
  }, [queryClient]);

  // --- Mutations ---
  const addReceiverMutation = useMutation({
    mutationFn: (data: Omit<ServiceReceiver, 'id'>) => api.post('/api/service-receivers', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RECEIVERS_QUERY_KEY }),
  });

  const updateReceiverMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ServiceReceiver> }) => 
      api.put(`/api/service-receivers/${id}`, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RECEIVERS_QUERY_KEY }),
  });

  const deleteReceiverMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/service-receivers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RECEIVERS_QUERY_KEY }),
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ vendorId, updates }: { vendorId: string; updates: Partial<VendorProfile> }) => 
      api.put(`/api/vendor-profiles/${vendorId}`, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY }),
  });

  return {
    serviceReceivers,
    vendorProfiles,
    fetchVendorData,
    addServiceReceiver: (data: Omit<ServiceReceiver, 'id'>) => addReceiverMutation.mutateAsync(data),
    updateServiceReceiver: (id: string, updates: Partial<ServiceReceiver>) => updateReceiverMutation.mutateAsync({ id, updates }),
    deleteServiceReceiver: (id: string) => deleteReceiverMutation.mutateAsync(id),
    updateVendorProfile: (vendorId: string, updates: Partial<VendorProfile>) => updateProfileMutation.mutateAsync({ vendorId, updates }),
    getServiceReceiversForVendor: (vendorId: string) => serviceReceivers.filter(r => r.vendorId === vendorId),
    getVendorProfile: (vendorId: string) => vendorProfiles[vendorId],
  };
}
