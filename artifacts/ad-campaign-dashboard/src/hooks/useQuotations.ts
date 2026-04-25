import { useState, useCallback } from 'react';
import { VendorQuotation, VendorQuotationItem, User } from '../types';
import { api } from '../lib/api';

function loadFromStorage(): VendorQuotation[] {
  try {
    const raw = localStorage.getItem('ad_campaign_db');
    if (raw) return JSON.parse(raw).vendorQuotations ?? [];
  } catch {}
  return [];
}

export function useQuotations(currentUser: User | null) {
  const [vendorQuotations, setVendorQuotations] = useState<VendorQuotation[]>(loadFromStorage);

  const fetchQuotations = useCallback(async () => {
    try {
      const data = await api.get('/api/quotations');
      setVendorQuotations(data);
      return;
    } catch {}
    setVendorQuotations(loadFromStorage());
  }, []);

  const upsertVendorQuotation = useCallback(async (
    poId: string,
    poNumber: string,
    region: string,
    items: VendorQuotationItem[],
    status: 'draft' | 'submitted'
  ) => {
    if (!currentUser) return;
    const now = new Date().toISOString().split('T')[0];

    // First find if existing
    const existing = vendorQuotations.find(q => q.poId === poId && q.vendorId === currentUser.id && q.region === region);

    try {
      if (existing) {
        const updates = { items, status, submittedAt: status === 'submitted' ? now : existing.submittedAt };
        const updated = await api.put(`/api/quotations/${existing.id}`, updates);
        setVendorQuotations(prev => prev.map(q => q.id === existing.id ? updated : q));
        return;
      } else {
        const newQ = {
          poId, poNumber,
          vendorId: currentUser.id,
          vendorName: currentUser.name,
          vendorCode: currentUser.territory?.vendorCode,
          region, items, status,
          submittedAt: status === 'submitted' ? now : undefined,
        };
        const created = await api.post('/api/quotations', newQ);
        setVendorQuotations(prev => [created, ...prev]);
        return;
      }
    } catch {}

    setVendorQuotations(prev => {
      const existingInPrev = prev.find(q => q.poId === poId && q.vendorId === currentUser.id && q.region === region);
      if (existingInPrev) {
        return prev.map(q =>
          q.id === existingInPrev.id
            ? { ...q, items, status, submittedAt: status === 'submitted' ? now : q.submittedAt }
            : q
        );
      }
      const newQ: VendorQuotation = {
        id: `vq-${Date.now()}`,
        poId, poNumber,
        vendorId: currentUser.id,
        vendorName: currentUser.name,
        vendorCode: currentUser.territory?.vendorCode,
        region, items, status,
        submittedAt: status === 'submitted' ? now : undefined,
        createdAt: now
      };
      return [newQ, ...prev];
    });
  }, [currentUser, vendorQuotations]);

  const deleteVendorQuotation = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/quotations/${id}`);
      setVendorQuotations(prev => prev.filter(q => q.id !== id));
      return;
    } catch {}
    setVendorQuotations(prev => prev.filter(q => q.id !== id));
  }, []);

  const getVendorQuotations = useCallback((): VendorQuotation[] => {
    if (!currentUser || currentUser.role !== 'Vendor') return [];
    return vendorQuotations.filter(q => q.vendorId === currentUser.id);
  }, [vendorQuotations, currentUser]);

  const getAdminQuotations = useCallback((): VendorQuotation[] => {
    return vendorQuotations;
  }, [vendorQuotations]);

  return {
    vendorQuotations,
    setVendorQuotations,
    fetchQuotations,
    upsertVendorQuotation,
    deleteVendorQuotation,
    getVendorQuotations,
    getAdminQuotations,
  };
}
