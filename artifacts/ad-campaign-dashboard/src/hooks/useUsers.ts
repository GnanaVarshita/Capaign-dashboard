import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '../types';
import { api } from '../lib/api';

const USERS_QUERY_KEY = ['users'];

export function useUsers() {
  const queryClient = useQueryClient();

  const { data: users = [], refetch: fetchUsers } = useQuery<User[]>({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => api.get('/api/users'),
  });

  const addUserMutation = useMutation({
    mutationFn: (userData: Omit<User, 'id'>) => api.post('/api/users', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<User> }) => 
      api.put(`/api/users/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  const addUser = useCallback(async (userData: Omit<User, 'id'>) => {
    await addUserMutation.mutateAsync(userData);
  }, [addUserMutation]);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    await updateUserMutation.mutateAsync({ id, updates });
  }, [updateUserMutation]);

  const deleteUser = useCallback(async (id: string) => {
    await deleteUserMutation.mutateAsync(id);
  }, [deleteUserMutation]);

  const getUserById = useCallback((id: string): User | undefined => {
    return users.find(u => u.id === id);
  }, [users]);

  const getVendors = useCallback((): User[] => {
    return users.filter(u => u.role === 'Vendor' && u.status === 'active');
  }, [users]);

  const getUsersByRegion = useCallback((region: string): User[] => {
    return users.filter(u => u.territory?.region === region);
  }, [users]);

  const getUsersByZone = useCallback((zone: string): User[] => {
    return users.filter(u => u.territory?.zone === zone);
  }, [users]);

  return {
    users, 
    fetchUsers, addUser, updateUser, deleteUser,
    getUserById, getVendors, getUsersByRegion, getUsersByZone,
  };
}
