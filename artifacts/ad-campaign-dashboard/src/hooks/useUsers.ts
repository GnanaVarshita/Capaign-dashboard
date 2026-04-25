import { useState, useCallback } from 'react';
import { User } from '../types';
import { INITIAL_USERS } from '../lib/mock-data';
import { api } from '../lib/api';

function loadFromStorage(): User[] {
  try {
    const raw = localStorage.getItem('ad_campaign_db');
    if (raw) return JSON.parse(raw).users ?? INITIAL_USERS;
  } catch {}
  return INITIAL_USERS;
}

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export function useUsers() {
  const [users, setUsers] = useState<User[]>(loadFromStorage);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await api.get('/api/users');
      setUsers(data);
      return;
    } catch (err) {
      console.warn('API fetchUsers failed, using mock data:', err);
    }
    setUsers(loadFromStorage());
  }, []);

  const addUser = useCallback(async (userData: Omit<User, 'id'>) => {
    try {
      const created = await api.post('/api/users', userData);
      setUsers(prev => [...prev, created]);
      return;
    } catch (err) {
      console.warn('API addUser failed, using mock data:', err);
    }
    const user: User = { ...userData, id: `u-${Date.now()}` };
    setUsers(prev => [...prev, user]);
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    try {
      const updated = await api.put(`/api/users/${id}`, updates);
      setUsers(prev => prev.map(u => u.id === id ? updated : u));
      return;
    } catch (err) {
      console.warn('API updateUser failed, using mock data:', err);
    }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      return;
    } catch (err) {
      console.warn('API deleteUser failed, using mock data:', err);
    }
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

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
    users, setUsers,
    fetchUsers, addUser, updateUser, deleteUser,
    getUserById, getVendors, getUsersByRegion, getUsersByZone,
  };
}
