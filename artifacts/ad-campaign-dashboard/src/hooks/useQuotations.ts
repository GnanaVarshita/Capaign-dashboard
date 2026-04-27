import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VendorQuotation, VendorQuotationItem, User } from '../types';
import { api } from '../lib/api';

const QUOTATIONS_QUERY_KEY = ['quotations'];

export function useQuotations(currentUser: User | null) {
  const queryClient = useQueryClient();

  const { data: vendorQuotations = [] } = useQuery<VendorQuotation[]>({
    queryKey: QUOTATIONS_QUERY_KEY,
    queryFn: () => api.get('/api/quotations'),
    enabled: !!currentUser,
  });

  const fetchQuotations = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY });
  }, [queryClient]);

  const upsertMutation = useMutation({
    mutationFn: (data: any) => {
      const existing = vendorQuotations.find(q => q.poId === data.poId && q.vendorId === currentUser?.id && q.region === data.region);
      if (existing) {
        return api.put(`/api/quotations/${existing.id}`, data);
      }
      return api.post('/api/quotations', data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/quotations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY }),
  });

  return {
    vendorQuotations,
    fetchQuotations,
    upsertVendorQuotation: (poId: string, poNumber: string, region: string, items: VendorQuotationItem[], status: 'draft' | 'submitted') => {
      if (!currentUser) return;
      return upsertMutation.mutateAsync({
        poId, poNumber,
        vendorId: currentUser.id,
        vendorName: currentUser.name,
        vendorCode: currentUser.territory?.vendorCode,
        region, items, status
      });
    },
    deleteVendorQuotation: (id: string) => deleteMutation.mutateAsync(id),
    getVendorQuotations: () => {
      if (!currentUser || currentUser.role !== 'Vendor') return [];
      return vendorQuotations.filter(q => q.vendorId === currentUser.id);
    },
    getAdminQuotations: () => vendorQuotations,
  };
}
