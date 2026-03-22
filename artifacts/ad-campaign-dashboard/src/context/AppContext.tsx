import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Entry, PO, Region, Bill, ServiceReceiver, VendorProfile } from '../types';
import { INITIAL_USERS, INITIAL_ENTRIES, INITIAL_POS, INITIAL_REGIONS, INITIAL_PRODUCTS, INITIAL_ACTIVITIES } from '../lib/mock-data';

interface SpentFilters {
  po?: string;
  region?: string;
  zone?: string;
  area?: string;
  product?: string;
  activity?: string;
  vendorId?: string;
}

interface AppContextType {
  currentUser: User | null;
  login: (id: string, pass: string) => boolean;
  logout: () => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  entries: Entry[];
  setEntries: React.Dispatch<React.SetStateAction<Entry[]>>;
  pos: PO[];
  setPOs: React.Dispatch<React.SetStateAction<PO[]>>;
  regions: Region[];
  setRegions: React.Dispatch<React.SetStateAction<Region[]>>;
  products: string[];
  setProducts: React.Dispatch<React.SetStateAction<string[]>>;
  activities: string[];
  setActivities: React.Dispatch<React.SetStateAction<string[]>>;
  bills: Bill[];
  setBills: React.Dispatch<React.SetStateAction<Bill[]>>;
  serviceReceivers: ServiceReceiver[];
  addServiceReceiver: (receiver: Omit<ServiceReceiver, 'id'>) => void;
  updateServiceReceiver: (id: string, updates: Partial<ServiceReceiver>) => void;
  deleteServiceReceiver: (id: string) => void;
  vendorProfiles: Record<string, VendorProfile>;
  updateVendorProfile: (vendorId: string, updates: Partial<VendorProfile>) => void;
  addEntry: (entry: Omit<Entry, 'id' | 'status' | 'decidedBy' | 'decidedAt'>) => void;
  updateEntry: (id: string, updates: Partial<Entry>, editedByName: string) => void;
  updateEntryStatus: (id: string, status: 'approved' | 'rejected', decidedBy: string) => void;
  deleteEntry: (id: string) => void;
  addPO: (po: Omit<PO, 'id'>) => void;
  updatePO: (id: string, updates: Partial<PO>) => void;
  approvePO: (id: string, approvedBy: string) => void;
  rejectPO: (id: string, reason?: string) => void;
  lapsePO: (id: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addBill: (bill: Omit<Bill, 'id'>) => void;
  updateBill: (id: string, updates: Partial<Bill>) => void;
  calcLiveSpent: (filters: SpentFilters) => number;
  calcPendingSpent: (filters: SpentFilters) => number;
  getVisiblePOs: () => PO[];
  getVisiblePendingEntries: () => Entry[];
  getMyEntries: () => Entry[];
  getScopedEntries: () => Entry[];
  refreshData: () => void;
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  toastMsg: { msg: string; type: string } | null;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [entries, setEntries] = useState<Entry[]>(INITIAL_ENTRIES);
  const [pos, setPOs] = useState<PO[]>(INITIAL_POS);
  const [regions, setRegions] = useState<Region[]>(INITIAL_REGIONS);
  const [products, setProducts] = useState<string[]>(INITIAL_PRODUCTS);
  const [activities, setActivities] = useState<string[]>(INITIAL_ACTIVITIES);
  const [bills, setBills] = useState<Bill[]>([]);
  const [serviceReceivers, setServiceReceivers] = useState<ServiceReceiver[]>([]);
  const [vendorProfiles, setVendorProfiles] = useState<Record<string, VendorProfile>>({});
  const [toastMsg, setToastMsg] = useState<{ msg: string; type: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ad_campaign_db');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.users) setUsers(data.users);
        if (data.entries) setEntries(data.entries);
        if (data.pos) setPOs(data.pos);
        if (data.regions) setRegions(data.regions);
        if (data.products) setProducts(data.products);
        if (data.activities) setActivities(data.activities);
        if (data.bills) setBills(data.bills);
        if (data.serviceReceivers) setServiceReceivers(data.serviceReceivers);
        if (data.vendorProfiles) setVendorProfiles(data.vendorProfiles);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ad_campaign_db', JSON.stringify({
        users, entries, pos, regions, products, activities, bills, serviceReceivers, vendorProfiles
      }));
    } catch {}
  }, [users, entries, pos, regions, products, activities, bills, serviceReceivers, vendorProfiles]);

  const toast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const login = (id: string, pass: string) => {
    const user = users.find(u => u.loginId.toLowerCase() === id.toLowerCase() && u.password === pass && u.status === 'active');
    if (user) { setCurrentUser(user); return true; }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const addEntry = (entryData: Omit<Entry, 'id' | 'status' | 'decidedBy' | 'decidedAt'>) => {
    const entry: Entry = { ...entryData, id: `e-${Date.now()}`, status: 'pending', decidedBy: '', decidedAt: '' };
    setEntries(prev => [entry, ...prev]);
    toast('Activity entry submitted successfully!');
  };

  const updateEntry = (id: string, updates: Partial<Entry>, editedByName: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates, editedBy: editedByName } : e));
    toast('Entry updated successfully!');
  };

  const updateEntryStatus = (id: string, status: 'approved' | 'rejected', decidedBy: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status, decidedBy, decidedAt: new Date().toISOString().split('T')[0] } : e));
    toast(`Entry ${status}!`, status === 'approved' ? 'success' : 'error');
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    toast('Entry deleted.');
  };

  const addPO = (poData: Omit<PO, 'id'>) => {
    const po: PO = { ...poData, id: `po-${Date.now()}` };
    setPOs(prev => [po, ...prev]);
    toast('Purchase order created!');
  };

  const updatePO = (id: string, updates: Partial<PO>) => {
    setPOs(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    toast('Purchase order updated!');
  };

  const approvePO = (id: string, approvedBy: string) => {
    setPOs(prev => prev.map(p => p.id === id ? { ...p, approvalStatus: 'approved', approvedBy, approvedAt: new Date().toISOString().split('T')[0], status: 'Active' } : p));
    toast('PO approved!');
  };

  const rejectPO = (id: string, reason = '') => {
    setPOs(prev => prev.map(p => p.id === id ? { ...p, approvalStatus: 'rejected', rejectionReason: reason, status: 'Draft' } : p));
    toast('PO rejected.', 'error');
  };

  const lapsePO = (id: string) => {
    setPOs(prev => prev.map(p => p.id === id ? { ...p, status: 'Lapsed' } : p));
    toast('PO marked as lapsed.');
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const user: User = { ...userData, id: `u-${Date.now()}` };
    setUsers(prev => [...prev, user]);
    toast('User added successfully!');
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    toast('User updated!');
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    toast('User removed.');
  };

  const addBill = (billData: Omit<Bill, 'id'>) => {
    const bill: Bill = { ...billData, id: `bill-${Date.now()}` };
    setBills(prev => [bill, ...prev]);
    toast('Bill created!');
  };

  const updateBill = (id: string, updates: Partial<Bill>) => {
    setBills(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    toast('Bill updated!');
  };

  const addServiceReceiver = (receiverData: Omit<ServiceReceiver, 'id'>) => {
    const receiver: ServiceReceiver = { ...receiverData, id: `sr-${Date.now()}` };
    setServiceReceivers(prev => [...prev, receiver]);
    toast('Service receiver added!');
  };

  const updateServiceReceiver = (id: string, updates: Partial<ServiceReceiver>) => {
    setServiceReceivers(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    toast('Service receiver updated!');
  };

  const deleteServiceReceiver = (id: string) => {
    setServiceReceivers(prev => prev.filter(r => r.id !== id));
    toast('Service receiver removed.');
  };

  const updateVendorProfile = (vendorId: string, updates: Partial<VendorProfile>) => {
    setVendorProfiles(prev => ({
      ...prev,
      [vendorId]: { ...(prev[vendorId] || { vendorId, tradeName: '', vendorCode: '', gst: '', address: '', phone: '', email: '' }), ...updates }
    }));
    toast('Profile updated!');
  };

  const matchesFilters = (e: Entry, f: SpentFilters) => {
    if (f.po && e.po !== f.po) return false;
    if (f.product && e.product !== f.product) return false;
    if (f.activity && e.activity !== f.activity) return false;
    if (f.vendorId && e.vendorId !== f.vendorId) return false;
    if (f.area && e.area !== f.area) return false;
    if (f.region) {
      const u = users.find(x => x.id === e.userId);
      if (u?.territory?.region !== f.region) return false;
    }
    if (f.zone) {
      const u = users.find(x => x.id === e.userId);
      if (u?.territory?.zone !== f.zone) return false;
    }
    return true;
  };

  const calcLiveSpent = useCallback((filters: SpentFilters) => {
    return entries.filter(e => e.status === 'approved' && matchesFilters(e, filters)).reduce((s, e) => s + e.amount, 0);
  }, [entries, users]);

  const calcPendingSpent = useCallback((filters: SpentFilters) => {
    return entries.filter(e => e.status === 'pending' && matchesFilters(e, filters)).reduce((s, e) => s + e.amount, 0);
  }, [entries, users]);

  const getVisiblePOs = useCallback(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Owner' || currentUser.role === 'All India Manager') return pos;
    if (currentUser.role === 'Vendor') {
      const myRegions = (currentUser.territory.assignedZones || []).map(z => z.region);
      return pos.filter(po => myRegions.some(r => po.regionBudgets[r]) || entries.some(e => e.po === po.poNumber && e.vendorId === currentUser.id));
    }
    const myRegion = currentUser.territory.region;
    if (!myRegion) return pos;
    const myZone = currentUser.territory.zone;
    return pos.filter(po => {
      if (!po.regionBudgets[myRegion]) return false;
      if (myZone) {
        const za = (po.zoneAllocations[myRegion] || {});
        if (Object.keys(za).length > 0 && !za[myZone]) return false;
      }
      return true;
    });
  }, [currentUser, pos, entries]);

  const getVisiblePendingEntries = useCallback(() => {
    if (!currentUser) return [];
    const pending = entries.filter(e => e.status === 'pending');
    if (currentUser.role === 'Owner' || currentUser.role === 'All India Manager') return pending;
    if (currentUser.role === 'Regional Manager') {
      return pending.filter(e => e.rmId === currentUser.id || users.find(u => u.id === e.userId)?.territory.region === currentUser.territory.region);
    }
    if (currentUser.role === 'Zonal Manager') {
      return pending.filter(e => e.zmId === currentUser.id || users.find(u => u.id === e.userId)?.territory.zone === currentUser.territory.zone);
    }
    return [];
  }, [currentUser, entries, users]);

  const getMyEntries = useCallback(() => {
    if (!currentUser) return [];
    return entries.filter(e => e.userId === currentUser.id);
  }, [currentUser, entries]);

  const getScopedEntries = useCallback(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Owner' || currentUser.role === 'All India Manager') return entries;
    if (currentUser.role === 'Regional Manager') return entries.filter(e => users.find(u => u.id === e.userId)?.territory.region === currentUser.territory.region || e.rmId === currentUser.id);
    if (currentUser.role === 'Zonal Manager') return entries.filter(e => users.find(u => u.id === e.userId)?.territory.zone === currentUser.territory.zone || e.zmId === currentUser.id);
    if (currentUser.role === 'Area Manager') return entries.filter(e => e.userId === currentUser.id);
    if (currentUser.role === 'Vendor') return entries.filter(e => e.vendorId === currentUser.id);
    return entries;
  }, [currentUser, entries, users]);

  const refreshData = useCallback(() => {
    try {
      const stored = localStorage.getItem('ad_campaign_db');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.users) setUsers(data.users);
        if (data.entries) setEntries(data.entries);
        if (data.pos) setPOs(data.pos);
        if (data.regions) setRegions(data.regions);
        if (data.products) setProducts(data.products);
        if (data.activities) setActivities(data.activities);
        if (data.bills) setBills(data.bills);
        toast('Data refreshed from storage!', 'success');
      }
    } catch (err) {
      toast('Error refreshing data', 'error');
    }
  }, [toast]);

  return (
    <AppContext.Provider value={{
      currentUser, login, logout,
      users, setUsers, entries, setEntries, pos, setPOs, regions, setRegions,
      products, setProducts, activities, setActivities, bills, setBills,
      addEntry, updateEntry, updateEntryStatus, deleteEntry,
      addPO, updatePO, approvePO, rejectPO, lapsePO,
      addUser, updateUser, deleteUser, addBill, updateBill,
      serviceReceivers, addServiceReceiver, updateServiceReceiver, deleteServiceReceiver,
      vendorProfiles, updateVendorProfile,
      calcLiveSpent, calcPendingSpent,
      getVisiblePOs, getVisiblePendingEntries, getMyEntries, getScopedEntries,
      refreshData,
      toast, toastMsg
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be inside AppProvider');
  return ctx;
};
