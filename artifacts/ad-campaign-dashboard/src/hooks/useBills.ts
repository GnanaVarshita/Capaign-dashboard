import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bill, User } from '../types';
import { api } from '../lib/api';

const BILLS_QUERY_KEY = ['bills'];

export function useBills(currentUser: User | null) {
  const queryClient = useQueryClient();

  const { data: bills = [], refetch: fetchBills } = useQuery<Bill[]>({
    queryKey: BILLS_QUERY_KEY,
    queryFn: () => api.get('/api/bills'),
    enabled: !!currentUser,
  });

  const generateInvoiceNumber = useCallback((): string => {
    const year = new Date().getFullYear();
    const count = bills.filter(b => b.invoiceNumber?.startsWith(`INV/${year}/`)).length + 1;
    return `INV/${year}/${String(count).padStart(3, '0')}`;
  }, [bills]);

  const addBillMutation = useMutation({
    mutationFn: (billData: Omit<Bill, 'id'>) => api.post('/api/bills', billData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLS_QUERY_KEY });
    },
  });

  const updateBillMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Bill> }) => 
      api.put(`/api/bills/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLS_QUERY_KEY });
    },
  });

  const submitBillMutation = useMutation({
    mutationFn: (id: string) => api.put(`/api/bills/${id}/submit`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLS_QUERY_KEY });
    },
  });

  const markBillPaidMutation = useMutation({
    mutationFn: ({ id, paymentId, paymentDate }: { id: string; paymentId: string; paymentDate: string }) => 
      api.put(`/api/bills/${id}/pay`, { paymentId, paymentDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLS_QUERY_KEY });
    },
  });

  const addBill = useCallback(async (billData: Omit<Bill, 'id'>): Promise<string> => {
    const result = await addBillMutation.mutateAsync(billData);
    return result.id;
  }, [addBillMutation]);

  const updateBill = useCallback(async (id: string, updates: Partial<Bill>) => {
    await updateBillMutation.mutateAsync({ id, updates });
  }, [updateBillMutation]);

  const submitBill = useCallback(async (id: string) => {
    await submitBillMutation.mutateAsync(id);
  }, [submitBillMutation]);

  const markBillPaid = useCallback(async (id: string, paymentId: string, paymentDate: string) => {
    await markBillPaidMutation.mutateAsync({ id, paymentId, paymentDate });
  }, [markBillPaidMutation]);

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
    bills,
    fetchBills, addBill, updateBill, submitBill, markBillPaid,
    generateInvoiceNumber, getVendorBills, getScopedBills,
  };
}
