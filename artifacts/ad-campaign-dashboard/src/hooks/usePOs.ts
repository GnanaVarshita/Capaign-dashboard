import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PO, User, Entry } from '../types';
import { api } from '../lib/api';

const POS_QUERY_KEY = ['pos'];

export function usePOs(currentUser: User | null) {
  const queryClient = useQueryClient();

  const { data: pos = [], refetch: fetchPOs } = useQuery<PO[]>({
    queryKey: POS_QUERY_KEY,
    queryFn: () => api.get('/api/pos'),
    enabled: !!currentUser,
  });

  const addPOMutation = useMutation({
    mutationFn: (poData: Omit<PO, 'id'>) => api.post('/api/pos', poData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_QUERY_KEY });
    },
  });

  const updatePOMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PO> }) => 
      api.put(`/api/pos/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_QUERY_KEY });
    },
  });

  const approvePOMutation = useMutation({
    mutationFn: (id: string) => api.put(`/api/pos/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_QUERY_KEY });
    },
  });

  const rejectPOMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      api.put(`/api/pos/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_QUERY_KEY });
    },
  });

  const lapsePOMutation = useMutation({
    mutationFn: (id: string) => api.put(`/api/pos/${id}/lapse`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_QUERY_KEY });
    },
  });

  const addPO = useCallback(async (poData: Omit<PO, 'id'>) => {
    await addPOMutation.mutateAsync(poData);
  }, [addPOMutation]);

  const updatePO = useCallback(async (id: string, updates: Partial<PO>) => {
    await updatePOMutation.mutateAsync({ id, updates });
  }, [updatePOMutation]);

  const approvePO = useCallback(async (id: string, approvedBy: string) => {
    await approvePOMutation.mutateAsync(id);
  }, [approvePOMutation]);

  const rejectPO = useCallback(async (id: string, reason = '') => {
    await rejectPOMutation.mutateAsync({ id, reason });
  }, [rejectPOMutation]);

  const lapsePO = useCallback(async (id: string) => {
    await lapsePOMutation.mutateAsync(id);
  }, [lapsePOMutation]);

  const getVisiblePOs = useCallback((entries: Entry[]): PO[] => {
    if (!currentUser) return [];
    if (['Owner', 'All India Manager'].includes(currentUser.role)) return pos;

    if (currentUser.role === 'Vendor') {
      const myRegions = (currentUser.territory.assignedZones || []).map(z => z.region);
      return pos.filter(po =>
        myRegions.some(r => po.regionBudgets[r]) ||
        entries.some(e => e.po === po.poNumber && e.vendorId === currentUser.id)
      );
    }

    const myRegion = currentUser.territory.region;
    if (!myRegion) return pos;
    return pos.filter(po => {
      if (!po.regionBudgets[myRegion]) return false;
      if (currentUser.role === 'Zonal Manager') {
        const myZone = currentUser.territory.zone;
        const za = (po.zoneAllocations[myRegion] || {});
        if (Object.keys(za).length > 0 && !za[myZone!]) return false;
      }
      return true;
    });
  }, [currentUser, pos]);

  return { pos, fetchPOs, addPO, updatePO, approvePO, rejectPO, lapsePO, getVisiblePOs };
}
