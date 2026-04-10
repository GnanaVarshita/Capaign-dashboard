import { useState, useCallback } from 'react';
import { PO, User, Entry } from '../types';
import { INITIAL_POS } from '../lib/mock-data';
import { api } from '../lib/api';

function loadFromStorage(): PO[] {
  try {
    const raw = localStorage.getItem('ad_campaign_db');
    if (raw) return JSON.parse(raw).pos ?? INITIAL_POS;
  } catch {}
  return INITIAL_POS;
}

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export function usePOs(currentUser: User | null) {
  const [pos, setPOs] = useState<PO[]>(loadFromStorage);

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

  const fetchPOs = useCallback(async () => {
    if (!API_URL) return;
    try {
      const data = await api.get('/api/pos');
      setPOs(data);
    } catch {}
  }, []);

  const addPO = useCallback(async (poData: Omit<PO, 'id'>) => {
    if (API_URL) {
      try {
        const created = await api.post('/api/pos', poData);
        setPOs(prev => [created, ...prev]);
        return;
      } catch {}
    }
    const po: PO = { ...poData, id: `po-${Date.now()}` };
    setPOs(prev => [po, ...prev]);
  }, []);

  const updatePO = useCallback(async (id: string, updates: Partial<PO>) => {
    if (API_URL) {
      try {
        const updated = await api.put(`/api/pos/${id}`, updates);
        setPOs(prev => prev.map(p => p.id === id ? updated : p));
        return;
      } catch {}
    }
    setPOs(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const approvePO = useCallback(async (id: string, approvedBy: string) => {
    if (API_URL) {
      try {
        const updated = await api.put(`/api/pos/${id}/approve`, {});
        setPOs(prev => prev.map(p => p.id === id ? updated : p));
        return;
      } catch {}
    }
    setPOs(prev => prev.map(p => p.id === id ? {
      ...p, approvalStatus: 'approved', approvedBy, approvedAt: new Date().toISOString().split('T')[0], status: 'Active'
    } : p));
  }, []);

  const rejectPO = useCallback(async (id: string, reason = '') => {
    if (API_URL) {
      try {
        const updated = await api.put(`/api/pos/${id}/reject`, { reason });
        setPOs(prev => prev.map(p => p.id === id ? updated : p));
        return;
      } catch {}
    }
    setPOs(prev => prev.map(p => p.id === id ? { ...p, approvalStatus: 'rejected', rejectionReason: reason, status: 'Draft' } : p));
  }, []);

  const lapsePO = useCallback(async (id: string) => {
    if (API_URL) {
      try {
        const updated = await api.put(`/api/pos/${id}/lapse`, {});
        setPOs(prev => prev.map(p => p.id === id ? updated : p));
        return;
      } catch {}
    }
    setPOs(prev => prev.map(p => p.id === id ? { ...p, status: 'Lapsed' } : p));
  }, []);

  return { pos, setPOs, fetchPOs, addPO, updatePO, approvePO, rejectPO, lapsePO, getVisiblePOs };
}
