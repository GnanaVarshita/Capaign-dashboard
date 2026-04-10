import { useState, useCallback } from 'react';
import { Entry, User } from '../types';
import { INITIAL_ENTRIES } from '../lib/mock-data';
import { api } from '../lib/api';

function loadFromStorage(): Entry[] {
  try {
    const raw = localStorage.getItem('ad_campaign_db');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.entries ?? INITIAL_ENTRIES;
    }
  } catch {}
  return INITIAL_ENTRIES;
}

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export function useEntries(currentUser: User | null) {
  const [entries, setEntries] = useState<Entry[]>(loadFromStorage);

  // Scope entries client-side (mirrors backend scoping when API is unavailable)
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

  const fetchEntries = useCallback(async () => {
    if (!API_URL) return;
    try {
      const data = await api.get('/api/entries');
      setEntries(data);
    } catch {}
  }, []);

  const addEntry = useCallback(async (entryData: Omit<Entry, 'id' | 'status' | 'decidedBy' | 'decidedAt'>) => {
    const optimistic: Entry = {
      ...entryData, id: `e-${Date.now()}`, status: 'pending', decidedBy: '', decidedAt: ''
    };

    if (API_URL) {
      try {
        const created = await api.post('/api/entries', entryData);
        setEntries(prev => [created, ...prev]);
        return created;
      } catch {}
    }
    setEntries(prev => [optimistic, ...prev]);
    return optimistic;
  }, []);

  const updateEntry = useCallback(async (id: string, updates: Partial<Entry>, editedByName: string) => {
    if (API_URL) {
      try {
        const updated = await api.put(`/api/entries/${id}`, { ...updates, editedBy: editedByName });
        setEntries(prev => prev.map(e => e.id === id ? updated : e));
        return;
      } catch {}
    }
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates, editedBy: editedByName } : e));
  }, []);

  const updateEntryStatus = useCallback(async (
    id: string,
    status: 'approved' | 'rejected',
    decidedBy: string,
    decidedByDesignation?: string
  ) => {
    if (API_URL) {
      try {
        const updated = await api.put(`/api/entries/${id}/status`, { status, remarks: '' });
        setEntries(prev => prev.map(e => e.id === id ? updated : e));
        return;
      } catch {}
    }
    setEntries(prev => prev.map(e => e.id === id ? {
      ...e, status, decidedBy, decidedByDesignation, decidedAt: new Date().toISOString().split('T')[0]
    } : e));
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    if (API_URL) {
      try {
        await api.delete(`/api/entries/${id}`);
        setEntries(prev => prev.filter(e => e.id !== id));
        return;
      } catch {}
    }
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const calcLiveSpent = useCallback((filters: {
    po?: string; region?: string; zone?: string; area?: string;
    areaManagerId?: string; product?: string; activity?: string;
    vendorId?: string; crop?: string; dateFrom?: string; dateTo?: string;
  }, allUsers: User[]) => {
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

  const calcPendingSpent = useCallback((filters: {
    po?: string; region?: string; zone?: string; area?: string;
    product?: string; activity?: string; vendorId?: string;
  }, allUsers: User[]) => {
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
    entries, setEntries,
    fetchEntries,
    addEntry, updateEntry, updateEntryStatus, deleteEntry,
    getScopedEntries, getMyEntries, getVisiblePendingEntries,
    calcLiveSpent, calcPendingSpent,
  };
}
