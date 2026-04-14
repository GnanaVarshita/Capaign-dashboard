import { useState, useCallback } from 'react';
import { Quotation, QuotationSubmission, User } from '../types';

function loadFromStorage(): Quotation[] {
  try {
    const raw = localStorage.getItem('ad_campaign_db');
    if (raw) return JSON.parse(raw).quotations ?? [];
  } catch {}
  return [];
}

export function useQuotations(currentUser: User | null) {
  const [quotations, setQuotations] = useState<Quotation[]>(loadFromStorage);

  const fetchQuotations = useCallback(() => {
    setQuotations(loadFromStorage());
  }, []);

  const addQuotation = useCallback((data: Omit<Quotation, 'id' | 'submissions'>): string => {
    const q: Quotation = {
      ...data,
      id: `quot-${Date.now()}`,
      submissions: {}
    };
    setQuotations(prev => [q, ...prev]);
    return q.id;
  }, []);

  const updateQuotation = useCallback((id: string, updates: Partial<Quotation>) => {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  }, []);

  const deleteQuotation = useCallback((id: string) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
  }, []);

  const submitQuotation = useCallback((
    quotationId: string,
    vendorId: string,
    submission: Omit<QuotationSubmission, 'submittedAt'>
  ) => {
    setQuotations(prev => prev.map(q => {
      if (q.id !== quotationId) return q;
      return {
        ...q,
        submissions: {
          ...q.submissions,
          [vendorId]: {
            ...submission,
            submittedAt: new Date().toISOString().split('T')[0],
            status: 'submitted'
          }
        }
      };
    }));
  }, []);

  const saveDraftQuotation = useCallback((
    quotationId: string,
    vendorId: string,
    submission: Omit<QuotationSubmission, 'submittedAt' | 'status'>
  ) => {
    setQuotations(prev => prev.map(q => {
      if (q.id !== quotationId) return q;
      const existing = q.submissions[vendorId];
      return {
        ...q,
        submissions: {
          ...q.submissions,
          [vendorId]: {
            ...submission,
            submittedAt: existing?.submittedAt || new Date().toISOString().split('T')[0],
            status: 'draft'
          }
        }
      };
    }));
  }, []);

  const getVendorQuotations = useCallback((): Quotation[] => {
    if (!currentUser || currentUser.role !== 'Vendor') return [];
    return quotations.filter(q => q.vendorIds.includes(currentUser.id) && q.status === 'open');
  }, [quotations, currentUser]);

  const getAdminQuotations = useCallback((): Quotation[] => {
    return quotations;
  }, [quotations]);

  return {
    quotations,
    setQuotations,
    fetchQuotations,
    addQuotation,
    updateQuotation,
    deleteQuotation,
    submitQuotation,
    saveDraftQuotation,
    getVendorQuotations,
    getAdminQuotations,
  };
}
