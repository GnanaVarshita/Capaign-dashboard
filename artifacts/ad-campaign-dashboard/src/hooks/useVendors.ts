import { useState, useCallback } from 'react';
import { ServiceReceiver, VendorProfile, User } from '../types';
import { api } from '../lib/api';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('ad_campaign_db');
    if (raw) {
      const d = JSON.parse(raw);
      return {
        serviceReceivers: d.serviceReceivers ?? [],
        vendorProfiles:   d.vendorProfiles   ?? {},
      };
    }
  } catch {}
  return { serviceReceivers: [] as ServiceReceiver[], vendorProfiles: {} as Record<string, VendorProfile> };
}

export function useVendors(currentUser: User | null) {
  const stored = loadFromStorage();
  const [serviceReceivers, setServiceReceivers] = useState<ServiceReceiver[]>(stored.serviceReceivers);
  const [vendorProfiles, setVendorProfiles]     = useState<Record<string, VendorProfile>>(stored.vendorProfiles);

  const fetchVendorData = useCallback(async () => {
    try {
      const [receivers, profiles] = await Promise.all([
        api.get('/api/service-receivers'),
        currentUser ? api.get(`/api/vendor-profiles`) : Promise.resolve({}),
      ]);
      setServiceReceivers(receivers);
      setVendorProfiles(profiles);
      return;
    } catch {}

    const stored = loadFromStorage();
    setServiceReceivers(stored.serviceReceivers);
    setVendorProfiles(stored.vendorProfiles);
  }, [currentUser]);

  // --- Service Receivers ---
  const addServiceReceiver = useCallback(async (receiverData: Omit<ServiceReceiver, 'id'>) => {
    try {
      const created = await api.post('/api/service-receivers', receiverData);
      setServiceReceivers(prev => [...prev, created]);
      return;
    } catch {}

    const receiver: ServiceReceiver = { ...receiverData, id: `sr-${Date.now()}` };
    setServiceReceivers(prev => [...prev, receiver]);
  }, []);

  const updateServiceReceiver = useCallback(async (id: string, updates: Partial<ServiceReceiver>) => {
    try {
      const updated = await api.put(`/api/service-receivers/${id}`, updates);
      setServiceReceivers(prev => prev.map(r => r.id === id ? updated : r));
      return;
    } catch {}

    setServiceReceivers(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteServiceReceiver = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/service-receivers/${id}`);
      setServiceReceivers(prev => prev.filter(r => r.id !== id));
      return;
    } catch {}

    setServiceReceivers(prev => prev.filter(r => r.id !== id));
  }, []);

  const getServiceReceiversForVendor = useCallback((vendorId: string): ServiceReceiver[] => {
    return serviceReceivers.filter(r => r.vendorId === vendorId);
  }, [serviceReceivers]);

  // --- Vendor Profiles ---
  const updateVendorProfile = useCallback(async (vendorId: string, updates: Partial<VendorProfile>) => {
    try {
      const updated = await api.put(`/api/vendor-profiles/${vendorId}`, updates);
      setVendorProfiles(prev => ({ ...prev, [vendorId]: updated }));
      return;
    } catch {}

    setVendorProfiles(prev => ({
      ...prev,
      [vendorId]: {
        ...(prev[vendorId] || { vendorId, tradeName: '', vendorCode: '', gst: '', address: '', phone: '', email: '' }),
        ...updates,
      },
    }));
  }, []);

  const getVendorProfile = useCallback((vendorId: string): VendorProfile | undefined => {
    return vendorProfiles[vendorId];
  }, [vendorProfiles]);

  return {
    serviceReceivers, setServiceReceivers,
    vendorProfiles, setVendorProfiles,
    fetchVendorData,
    addServiceReceiver, updateServiceReceiver, deleteServiceReceiver, getServiceReceiversForVendor,
    updateVendorProfile, getVendorProfile,
  };
}
