import { useState, useCallback } from 'react';
import { BudgetRequest, BudgetRequestGroup, User } from '../types';
import { api } from '../lib/api';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('ad_campaign_db');
    if (raw) {
      const d = JSON.parse(raw);
      return {
        budgetRequests:      d.budgetRequests      ?? [],
        budgetRequestGroups: d.budgetRequestGroups ?? [],
      };
    }
  } catch {}
  return { budgetRequests: [] as BudgetRequest[], budgetRequestGroups: [] as BudgetRequestGroup[] };
}

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export function useBudgetRequests(currentUser: User | null) {
  const stored = loadFromStorage();
  const [budgetRequests, setBudgetRequests]           = useState<BudgetRequest[]>(stored.budgetRequests);
  const [budgetRequestGroups, setBudgetRequestGroups] = useState<BudgetRequestGroup[]>(stored.budgetRequestGroups);

  const fetchBudgetRequests = useCallback(async () => {
    if (API_URL) {
      try {
        const [requests, groups] = await Promise.all([
          api.get('/api/budget-requests'),
          api.get('/api/budget-request-groups'),
        ]);
        setBudgetRequests(requests);
        setBudgetRequestGroups(groups);
        return;
      } catch {}
    }
    const fresh = loadFromStorage();
    setBudgetRequests(fresh.budgetRequests);
    setBudgetRequestGroups(fresh.budgetRequestGroups);
  }, []);

  // --- Groups ---
  const createBudgetRequestGroup = useCallback(async (
    description?: string, targetDate?: string, selectedRegions?: string[]
  ): Promise<string> => {
    const payload = { description, targetDate, selectedRegions };

    if (API_URL) {
      try {
        const created = await api.post('/api/budget-request-groups', payload);
        setBudgetRequestGroups(prev => [created, ...prev]);
        return created.requestNumber;
      } catch {}
    }

    const groupCount = budgetRequestGroups.length + 1;
    const requestNumber = `BR-${new Date().getFullYear()}-${String(groupCount).padStart(3, '0')}`;
    const group: BudgetRequestGroup = {
      id: `brg-${Date.now()}`,
      requestNumber,
      aimId: currentUser?.id || '',
      aimName: currentUser?.name || '',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
      description,
      targetDate,
      selectedRegions: selectedRegions?.length ? selectedRegions : undefined,
    };
    setBudgetRequestGroups(prev => [group, ...prev]);
    return requestNumber;
  }, [budgetRequestGroups, currentUser]);

  const closeBudgetRequestGroup = useCallback(async (id: string) => {
    if (API_URL) {
      try {
        const updated = await api.put(`/api/budget-request-groups/${id}/close`, {});
        setBudgetRequestGroups(prev => prev.map(g => g.id === id ? updated : g));
        return;
      } catch {}
    }
    setBudgetRequestGroups(prev => prev.map(g => g.id === id ? { ...g, status: 'closed' as const } : g));
  }, []);

  // --- Requests ---
  const addBudgetRequest = useCallback(async (requestData: Omit<BudgetRequest, 'id' | 'createdAt' | 'status'>) => {
    if (API_URL) {
      try {
        const created = await api.post('/api/budget-requests', requestData);
        setBudgetRequests(prev => [created, ...prev]);
        return;
      } catch {}
    }
    const request: BudgetRequest = {
      ...requestData,
      id: `br-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'submitted',
    };
    setBudgetRequests(prev => [request, ...prev]);
  }, []);

  const addBudgetRequestToGroup = useCallback(async (
    groupId: string,
    requestData: Omit<BudgetRequest, 'id' | 'createdAt' | 'status' | 'requestGroupId' | 'requestNumber'>
  ) => {
    const group = budgetRequestGroups.find(g => g.id === groupId);
    if (!group) return;
    await addBudgetRequest({ ...requestData, requestGroupId: groupId, requestNumber: group.requestNumber });
  }, [budgetRequestGroups, addBudgetRequest]);

  const updateBudgetRequest = useCallback(async (id: string, updates: Partial<BudgetRequest>) => {
    if (API_URL) {
      try {
        const updated = await api.put(`/api/budget-requests/${id}`, updates);
        setBudgetRequests(prev => prev.map(r => r.id === id ? updated : r));
        return;
      } catch {}
    }
    setBudgetRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const approveBudgetRequest = useCallback(async (
    id: string,
    approverRole: 'zonal' | 'regional' | 'aim',
    approverName: string,
    approverId: string
  ) => {
    if (API_URL) {
      try {
        const updated = await api.put(`/api/budget-requests/${id}/approve`, {});
        setBudgetRequests(prev => prev.map(r => r.id === id ? updated : r));
        return;
      } catch {}
    }
    const today = new Date().toISOString().split('T')[0];
    setBudgetRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      if (approverRole === 'zonal')    return { ...r, status: 'zm-approved' as const, zmId: approverId, zmName: approverName, zmApprovedAt: today };
      if (approverRole === 'regional') return { ...r, status: 'rm-approved' as const, rmId: approverId, rmName: approverName, rmApprovedAt: today };
      return { ...r, status: 'aim-approved' as const, aimId: approverId, aimName: approverName, aimApprovedAt: today };
    }));
  }, []);

  const getScopedRequests = useCallback((): BudgetRequest[] => {
    if (!currentUser) return [];
    if (['Owner', 'All India Manager'].includes(currentUser.role)) return budgetRequests;
    if (currentUser.role === 'Area Manager') return budgetRequests.filter(r => r.areaManagerId === currentUser.id);
    if (currentUser.role === 'Zonal Manager') return budgetRequests.filter(r => r.zone === currentUser.territory.zone && r.region === currentUser.territory.region);
    if (currentUser.role === 'Regional Manager') return budgetRequests.filter(r => r.region === currentUser.territory.region);
    return [];
  }, [currentUser, budgetRequests]);

  return {
    budgetRequests, setBudgetRequests,
    budgetRequestGroups, setBudgetRequestGroups,
    fetchBudgetRequests,
    createBudgetRequestGroup, closeBudgetRequestGroup,
    addBudgetRequest, addBudgetRequestToGroup, updateBudgetRequest, approveBudgetRequest,
    getScopedRequests,
  };
}
