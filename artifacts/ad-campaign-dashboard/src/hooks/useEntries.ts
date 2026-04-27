import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Entry, User } from '../types';
import { api } from '../lib/api';

const ENTRIES_QUERY_KEY = ['entries'];

export function useEntries(currentUser: User | null) {
  const queryClient = useQueryClient();

  const { data: entries = [], refetch: fetchEntries } = useQuery<Entry[]>({
    queryKey: ENTRIES_QUERY_KEY,
    queryFn: () => api.get('/api/entries'),
    enabled: !!currentUser,
  });

  const addEntryMutation = useMutation({
    mutationFn: (entryData: Omit<Entry, 'id' | 'status' | 'decidedBy' | 'decidedAt'>) => 
      api.post('/api/entries', entryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: ({ id, updates, editedBy }: { id: string; updates: Partial<Entry>; editedBy: string }) => 
      api.put(`/api/entries/${id}`, { ...updates, editedBy }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
    },
  });

  const updateEntryStatusMutation = useMutation({
    mutationFn: ({ id, status, remarks }: { id: string; status: 'approved' | 'rejected'; remarks?: string }) => 
      api.put(`/api/entries/${id}/status`, { status, remarks: remarks || '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/entries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
    },
  });

  const addEntry = useCallback(async (entryData: Omit<Entry, 'id' | 'status' | 'decidedBy' | 'decidedAt'>) => {
    return await addEntryMutation.mutateAsync(entryData);
  }, [addEntryMutation]);

  const updateEntry = useCallback(async (id: string, updates: Partial<Entry>, editedByName: string) => {
    await updateEntryMutation.mutateAsync({ id, updates, editedBy: editedByName });
  }, [updateEntryMutation]);

  const updateEntryStatus = useCallback(async (
    id: string,
    status: 'approved' | 'rejected',
    decidedBy: string,
    decidedByDesignation?: string
  ) => {
    await updateEntryStatusMutation.mutateAsync({ id, status });
  }, [updateEntryStatusMutation]);

  const deleteEntry = useCallback(async (id: string) => {
    await deleteEntryMutation.mutateAsync(id);
  }, [deleteEntryMutation]);

  const getScopedEntries = useCallback((allUsers: User[]): Entry[] => {
    if (!currentUser) return [];
    const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));

    if (['Owner', 'All India Manager'].includes(currentUser.role)) return entries;

    if (currentUser.role === 'Regional Manager') {
      return entries.filter(e => {
        const eu = userMap[e.userId];
        return eu?.territory?.region === currentUser.territory.region;
      });
    }
    if (currentUser.role === 'Zonal Manager') {
      return entries.filter(e => {
        const eu = userMap[e.userId];
        return eu?.territory?.zone === currentUser.territory.zone &&
               eu?.territory?.region === currentUser.territory.region;
      });
    }
    if (currentUser.role === 'Area Manager') return entries.filter(e => e.userId === currentUser.id);
    if (currentUser.role === 'Vendor') return entries.filter(e => e.vendorId === currentUser.id);
    return [];
  }, [currentUser, entries]);

  const getMyEntries = useCallback((): Entry[] => {
    if (!currentUser) return [];
    return entries.filter(e => e.userId === currentUser.id);
  }, [currentUser, entries]);

  const getVisiblePendingEntries = useCallback((allUsers: User[]): Entry[] => {
    if (!currentUser) return [];
    const pending = entries.filter(e => e.status === 'pending');
    const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));
    if (['Owner', 'All India Manager'].includes(currentUser.role)) return pending;
    if (currentUser.role === 'Regional Manager') {
      return pending.filter(e => {
        const eu = userMap[e.userId];
        return eu?.territory?.region === currentUser.territory.region &&
          ['Zonal Manager', 'Area Manager', 'Vendor'].includes(eu?.role);
      });
    }
    if (currentUser.role === 'Zonal Manager') {
      return pending.filter(e => {
        const eu = userMap[e.userId];
        return eu?.territory?.zone === currentUser.territory.zone &&
               eu?.territory?.region === currentUser.territory.region &&
               ['Area Manager', 'Vendor'].includes(eu?.role);
      });
    }
    return [];
  }, [currentUser, entries]);

  const calcLiveSpent = useCallback((filters: any, allUsers: User[]) => {
    return entries.filter(e => {
      if (e.status !== 'approved') return false;
      if (filters.po && e.po !== filters.po) return false;
      if (filters.product && e.product !== filters.product) return false;
      if (filters.activity && e.activity !== filters.activity) return false;
      if (filters.vendorId && e.vendorId !== filters.vendorId) return false;
      if (filters.area && e.area !== filters.area) return false;
      if (filters.areaManagerId && e.userId !== filters.areaManagerId) return false;
      if (filters.dateFrom && e.date < filters.dateFrom) return false;
      if (filters.dateTo && e.date > filters.dateTo) return false;
      if (filters.region) {
        const u = allUsers.find(x => x.id === e.userId);
        if (u?.territory?.region !== filters.region) return false;
      }
      if (filters.zone) {
        const u = allUsers.find(x => x.id === e.userId);
        if (u?.territory?.zone !== filters.zone) return false;
      }
      return true;
    }).reduce((s, e) => s + e.amount, 0);
  }, [entries]);

  const calcPendingSpent = useCallback((filters: any, allUsers: User[]) => {
    return entries.filter(e => {
      if (e.status !== 'pending') return false;
      if (filters.po && e.po !== filters.po) return false;
      if (filters.product && e.product !== filters.product) return false;
      if (filters.activity && e.activity !== filters.activity) return false;
      if (filters.vendorId && e.vendorId !== filters.vendorId) return false;
      if (filters.area && e.area !== filters.area) return false;
      if (filters.region) {
        const u = allUsers.find(x => x.id === e.userId);
        if (u?.territory?.region !== filters.region) return false;
      }
      if (filters.zone) {
        const u = allUsers.find(x => x.id === e.userId);
        if (u?.territory?.zone !== filters.zone) return false;
      }
      return true;
    }).reduce((s, e) => s + e.amount, 0);
  }, [entries]);

  return {
    entries, 
    fetchEntries,
    addEntry, updateEntry, updateEntryStatus, deleteEntry,
    getScopedEntries, getMyEntries, getVisiblePendingEntries,
    calcLiveSpent, calcPendingSpent,
  };
}
