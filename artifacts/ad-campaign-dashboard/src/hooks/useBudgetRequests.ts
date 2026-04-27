import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BudgetRequest, BudgetRequestGroup, User } from '../types';
import { api } from '../lib/api';

const REQUESTS_QUERY_KEY = ['budget-requests'];
const GROUPS_QUERY_KEY = ['budget-request-groups'];

export function useBudgetRequests(currentUser: User | null) {
  const queryClient = useQueryClient();

  const { data: budgetRequests = [] } = useQuery<BudgetRequest[]>({
    queryKey: REQUESTS_QUERY_KEY,
    queryFn: () => api.get('/api/budget-requests'),
    enabled: !!currentUser,
  });

  const { data: budgetRequestGroups = [] } = useQuery<BudgetRequestGroup[]>({
    queryKey: GROUPS_QUERY_KEY,
    queryFn: () => api.get('/api/budget-request-groups'),
    enabled: !!currentUser,
  });

  const fetchBudgetRequests = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: REQUESTS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
  }, [queryClient]);

  // --- Mutations ---
  const createGroupMutation = useMutation({
    mutationFn: (payload: any) => api.post('/api/budget-request-groups', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }),
  });

  const closeGroupMutation = useMutation({
    mutationFn: (id: string) => api.put(`/api/budget-request-groups/${id}/close`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }),
  });

  const addRequestMutation = useMutation({
    mutationFn: (data: Omit<BudgetRequest, 'id' | 'createdAt' | 'status'>) => api.post('/api/budget-requests', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REQUESTS_QUERY_KEY }),
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BudgetRequest> }) => 
      api.put(`/api/budget-requests/${id}`, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REQUESTS_QUERY_KEY }),
  });

  const approveRequestMutation = useMutation({
    mutationFn: (id: string) => api.put(`/api/budget-requests/${id}/approve`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REQUESTS_QUERY_KEY }),
  });

  return {
    budgetRequests,
    setBudgetRequests: () => {},
    budgetRequestGroups,
    setBudgetRequestGroups: () => {},
    fetchBudgetRequests,
    createBudgetRequestGroup: async (desc?: string, date?: string, regions?: string[]) => {
      const result = await createGroupMutation.mutateAsync({ description: desc, targetDate: date, selectedRegions: regions });
      return result.requestNumber;
    },
    closeBudgetRequestGroup: (id: string) => closeGroupMutation.mutateAsync(id),
    addBudgetRequest: (data: Omit<BudgetRequest, 'id' | 'createdAt' | 'status'>) => addRequestMutation.mutateAsync(data),
    addBudgetRequestToGroup: async (groupId: string, data: any) => {
      const group = budgetRequestGroups.find(g => g.id === groupId);
      if (!group) return;
      return addRequestMutation.mutateAsync({ ...data, requestGroupId: groupId, requestNumber: group.requestNumber });
    },
    updateBudgetRequest: (id: string, updates: Partial<BudgetRequest>) => updateRequestMutation.mutateAsync({ id, updates }),
    approveBudgetRequest: (id: string, _role?: string, _name?: string, _appId?: string) => approveRequestMutation.mutateAsync(id),
    getScopedRequests: () => {
      if (!currentUser) return [];
      if (['Owner', 'All India Manager'].includes(currentUser.role)) return budgetRequests;
      if (currentUser.role === 'Area Manager') return budgetRequests.filter(r => r.areaManagerId === currentUser.id);
      if (currentUser.role === 'Zonal Manager') return budgetRequests.filter(r => r.zone === currentUser.territory.zone && r.region === currentUser.territory.region);
      if (currentUser.role === 'Regional Manager') return budgetRequests.filter(r => r.region === currentUser.territory.region);
      return [];
    },
  };
}
