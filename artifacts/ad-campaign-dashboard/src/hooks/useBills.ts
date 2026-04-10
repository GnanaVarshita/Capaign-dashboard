import { useState, useCallback } from 'react';
import { Bill, User } from '../types';
import { api } from '../lib/api';

function loadFromStorage(): Bill[] {
  try {
    const raw = localStorage.getItem('ad_campaign_db');
    if (raw) return JSON.parse(raw).bills ?? [];
  } catch {}
  return [];
}

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export function useBills(currentUser: User | null) {
  const [bills, setBills] = useState<Bill[]>(loadFromStorage);

  const generateInvoiceNumber = useCallback((): string => {
    const year = new Date().getFullYear();
    const count = bills.filter(b => b.invoiceNumber?.startsWith(`INV/${year}/`)).length + 1;
    return `INV/${year}/${String(count).padStart(3, '0')}`;
  }, [bills]);

  const fetchBills = useCallback(async () => {
    if (!API_URL) return;
    try {
      const data = await api.get('/api/bills');
      setBills(data);
    } catch {}
  }, []);

  const addBill = useCallback(async (billData: Omit<Bill, 'id'>): Promise<string> => {
    if (API_URL) {
      try {
        const created = await api.post('/api/bills', billData);
        setBills(prev => [created, ...prev]);
        return created.id;
      } catch {}
    }
    const bill: Bill = { ...billData, id: `bill-${Date.now()}` };
    setBills(prev => [bill, ...prev]);
    return bill.id;
  }, []);

  const updateBill = useCallback(async (id: string, updates: Partial<Bill>) => {
    if (API_URL) {
      try {
        const updated = await api.put(`/api/bills/${id}`, updates);
        setBills(prev => prev.map(b => b.id === id ? updated : b));
        return;
      } catch {}
    }
    setBills(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const submitBill = useCallback(async (id: string) => {
    if (API_URL) {
      try {
        const updated = await api.put(`/api/bills/${id}/submit`, {});
        setBills(prev => prev.map(b => b.id === id ? updated : b));
        return;
      } catch {}
    }
    setBills(prev => prev.map(b => b.id === id
      ? { ...b, status: 'submitted', submittedAt: new Date().toISOString().split('T')[0] }
      : b
    ));
  }, []);

  const markBillPaid = useCallback(async (id: string, paymentId: string, paymentDate: string) => {
    if (API_URL) {
      try {
        const updated = await api.put(`/api/bills/${id}/pay`, { paymentId, paymentDate });
        setBills(prev => prev.map(b => b.id === id ? updated : b));
        return;
      } catch {}
    }
    setBills(prev => prev.map(b => b.id === id
      ? { ...b, status: 'paid', paymentId, paymentDate, paidAt: paymentDate }
      : b
    ));
  }, []);

  const getVendorBills = useCallback((vendorId: string): Bill[] => {
    return bills.filter(b => b.vendorId === vendorId);
  }, [bills]);

  const getScopedBills = useCallback((): Bill[] => {
    if (!currentUser) return [];
    if (['Owner', 'All India Manager', 'Finance Administrator'].includes(currentUser.role)) return bills;
    if (currentUser.role === 'Vendor') return bills.filter(b => b.vendorId === currentUser.id);
    return bills;
  }, [currentUser, bills]);

  return {
    bills, setBills,
    fetchBills, addBill, updateBill, submitBill, markBillPaid,
    generateInvoiceNumber, getVendorBills, getScopedBills,
  };
}
