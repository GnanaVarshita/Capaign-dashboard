import { useState, useCallback } from 'react';
import { VendorQuotation, VendorQuotationItem, User } from '../types';

function loadFromStorage(): VendorQuotation[] {
  try {
    const raw = localStorage.getItem('ad_campaign_db');
    if (raw) return JSON.parse(raw).vendorQuotations ?? [];
  } catch {}
  return [];
}

export function useQuotations(currentUser: User | null) {
  const [vendorQuotations, setVendorQuotations] = useState<VendorQuotation[]>(loadFromStorage);

  const fetchQuotations = useCallback(() => {
    setVendorQuotations(loadFromStorage());
  }, []);

  const upsertVendorQuotation = useCallback((
    poId: string,
    poNumber: string,
    region: string,
    items: VendorQuotationItem[],
    status: 'draft' | 'submitted'
  ) => {
    if (!currentUser) return;
    const now = new Date().toISOString().split('T')[0];
    setVendorQuotations(prev => {
      const existing = prev.find(q => q.poId === poId && q.vendorId === currentUser.id && q.region === region);
      if (existing) {
        return prev.map(q =>
          q.id === existing.id
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
  }, [currentUser]);

  const deleteVendorQuotation = useCallback((id: string) => {
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
