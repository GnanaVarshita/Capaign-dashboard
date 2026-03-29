import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Entry, PO, Region, Bill, ServiceReceiver, VendorProfile, BudgetRequest, BudgetRequestGroup } from '../types';
import { INITIAL_USERS, INITIAL_ENTRIES, INITIAL_POS, INITIAL_REGIONS, INITIAL_PRODUCTS, INITIAL_ACTIVITIES } from '../lib/mock-data';

interface SpentFilters {
  po?: string;
  region?: string;
  zone?: string;
  area?: string;
  areaManagerId?: string;
  product?: string;
  activity?: string;
  vendorId?: string;
  dateFrom?: string;
  dateTo?: string;
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
  addProduct: (name: string) => void;
  updateProduct: (oldName: string, newName: string) => void;
  deleteProduct: (name: string) => void;
  addActivity: (name: string) => void;
  updateActivity: (oldName: string, newName: string) => void;
  deleteActivity: (name: string) => void;
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
  updateEntryStatus: (id: string, status: 'approved' | 'rejected', decidedBy: string, decidedByDesignation?: string) => void;
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
  pendingBillData: any;
  setPendingBillData: React.Dispatch<React.SetStateAction<any>>;
  navigateToTab: (tab: string) => void;
  setNavigateToTab: React.Dispatch<React.SetStateAction<(tab: string) => void>>;
  generateInvoiceNumber: () => string;
  budgetRequests: BudgetRequest[];
  setBudgetRequests: React.Dispatch<React.SetStateAction<BudgetRequest[]>>;
  budgetRequestGroups: BudgetRequestGroup[];
  createBudgetRequestGroup: (description?: string, targetDate?: string, selectedRegions?: string[]) => string; // Returns requestNumber
  addBudgetRequest: (request: Omit<BudgetRequest, 'id' | 'createdAt' | 'status'>) => void;
  addBudgetRequestToGroup: (groupId: string, request: Omit<BudgetRequest, 'id' | 'createdAt' | 'status' | 'requestGroupId' | 'requestNumber'>) => void; // For group-based submission
  updateBudgetRequest: (id: string, updates: Partial<BudgetRequest>) => void;
  approveBudgetRequest: (id: string, approverRole: 'zonal' | 'regional' | 'aim', approverName: string, approverIdField: string) => void;
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
  const [pendingBillData, setPendingBillData] = useState<any>(null);
  const [navigateToTab, setNavigateToTab] = useState<(tab: string) => void>(() => {});
  const [budgetRequests, setBudgetRequests] = useState<BudgetRequest[]>([]);
  const [budgetRequestGroups, setBudgetRequestGroups] = useState<BudgetRequestGroup[]>([]);

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
        if (data.budgetRequests) setBudgetRequests(data.budgetRequests);
        if (data.budgetRequestGroups) setBudgetRequestGroups(data.budgetRequestGroups);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ad_campaign_db', JSON.stringify({
        users, entries, pos, regions, products, activities, bills, serviceReceivers, vendorProfiles, budgetRequests, budgetRequestGroups
      }));
    } catch {}
  }, [users, entries, pos, regions, products, activities, bills, serviceReceivers, vendorProfiles, budgetRequests, budgetRequestGroups]);

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

  const updateEntryStatus = (id: string, status: 'approved' | 'rejected', decidedBy: string, decidedByDesignation?: string) => {
    setEntries(prev => prev.map(e => e.id === id ? {
      ...e, status, decidedBy, decidedByDesignation, decidedAt: new Date().toISOString().split('T')[0]
    } : e));
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
    return bill.id; // Return the bill ID for selection
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

  const addProduct = (name: string) => {
    if (products.includes(name)) return;
    setProducts(prev => [...prev, name]);
    toast(`Product "${name}" added.`);
  };

  const updateProduct = (oldName: string, newName: string) => {
    setProducts(prev => prev.map(p => p === oldName ? newName : p));
    toast(`Product "${oldName}" updated to "${newName}".`);
  };

  const deleteProduct = (name: string) => {
    setProducts(prev => prev.filter(p => p !== name));
    toast(`Product "${name}" removed.`, 'info');
  };

  const addActivity = (name: string) => {
    if (activities.includes(name)) return;
    setActivities(prev => [...prev, name]);
    toast(`Activity "${name}" added.`);
  };

  const updateActivity = (oldName: string, newName: string) => {
    setActivities(prev => prev.map(a => a === oldName ? newName : a));
    toast(`Activity "${oldName}" updated to "${newName}".`);
  };

  const deleteActivity = (name: string) => {
    setActivities(prev => prev.filter(a => a !== name));
    toast(`Activity "${name}" removed.`, 'info');
  };

  const matchesFilters = (e: Entry, f: SpentFilters) => {
    if (f.po && e.po !== f.po) return false;
    if (f.product && e.product !== f.product) return false;
    if (f.activity && e.activity !== f.activity) return false;
    if (f.vendorId && e.vendorId !== f.vendorId) return false;
    if (f.area && e.area !== f.area) return false;
    if (f.areaManagerId && e.userId !== f.areaManagerId) return false;
    if (f.dateFrom && e.date < f.dateFrom) return false;
    if (f.dateTo && e.date > f.dateTo) return false;
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
      return pending.filter(e => {
        const entryUser = users.find(u => u.id === e.userId);
        if (!entryUser) return false;
        const isSubordinate = ['Zonal Manager', 'Area Manager', 'Vendor'].includes(entryUser.role);
        const inRegion = entryUser.territory?.region === currentUser.territory.region;
        return isSubordinate && inRegion;
      });
    }
    if (currentUser.role === 'Zonal Manager') {
      return pending.filter(e => {
        const entryUser = users.find(u => u.id === e.userId);
        if (!entryUser) return false;
        const isSubordinate = ['Area Manager', 'Vendor'].includes(entryUser.role);
        const inZone = entryUser.territory?.zone === currentUser.territory.zone;
        return isSubordinate && inZone;
      });
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
    if (currentUser.role === 'Regional Manager') return entries.filter(e => {
      const entryUser = users.find(u => u.id === e.userId);
      if (!entryUser) return false;
      const isSubordinate = ['Zonal Manager', 'Area Manager', 'Vendor'].includes(entryUser.role);
      const inRegion = entryUser.territory?.region === currentUser.territory.region;
      return (isSubordinate && inRegion) || e.rmId === currentUser.id;
    });
    if (currentUser.role === 'Zonal Manager') return entries.filter(e => {
      const entryUser = users.find(u => u.id === e.userId);
      if (!entryUser) return false;
      const isSubordinate = ['Area Manager', 'Vendor'].includes(entryUser.role);
      const inZone = entryUser.territory?.zone === currentUser.territory.zone;
      return (isSubordinate && inZone) || e.zmId === currentUser.id;
    });
    if (currentUser.role === 'Area Manager') return entries.filter(e => e.userId === currentUser.id);
    if (currentUser.role === 'Vendor') return entries.filter(e => e.vendorId === currentUser.id);
    return entries;
  }, [currentUser, entries, users]);

  const generateInvoiceNumber = useCallback(() => {
    const year = new Date().getFullYear();
    const count = bills.filter(b => b.invoiceNumber?.startsWith(`INV/${year}/`)).length + 1;
    return `INV/${year}/${String(count).padStart(3, '0')}`;
  }, [bills]);

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
        if (data.serviceReceivers) setServiceReceivers(data.serviceReceivers);
        if (data.vendorProfiles) setVendorProfiles(data.vendorProfiles);
        if (data.budgetRequests) setBudgetRequests(data.budgetRequests);
        toast('Data refreshed from storage!', 'success');
      }
    } catch (err) {
      toast('Error refreshing data', 'error');
    }
  }, [toast]);

  const addBudgetRequest = (requestData: Omit<BudgetRequest, 'id' | 'createdAt' | 'status'>) => {
    const request: BudgetRequest = {
      ...requestData,
      id: `br-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'submitted'
    };
    setBudgetRequests(prev => [request, ...prev]);
    toast('Budget request submitted!');
  };

  const updateBudgetRequest = (id: string, updates: Partial<BudgetRequest>) => {
    setBudgetRequests(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    toast('Budget request updated!');
  };

  const approveBudgetRequest = (id: string, approverRole: 'zonal' | 'regional' | 'aim', approverName: string, approverId: string) => {
    setBudgetRequests(prev => prev.map(b => {
      if (b.id !== id) return b;
      const today = new Date().toISOString().split('T')[0];
      if (approverRole === 'zonal') {
        return { ...b, status: 'zm-approved', zmId: approverId, zmName: approverName, zmApprovedAt: today };
      } else if (approverRole === 'regional') {
        return { ...b, status: 'rm-approved', rmId: approverId, rmName: approverName, rmApprovedAt: today };
      } else {
        return { ...b, status: 'aim-approved', aimId: approverId, aimName: approverName, aimApprovedAt: today };
      }
    }));
    toast(`Budget request approved by ${approverName}!`);
  };

  const createBudgetRequestGroup = (description?: string, targetDate?: string, selectedRegions?: string[]): string => {
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
      selectedRegions: selectedRegions && selectedRegions.length > 0 ? selectedRegions : undefined
    };
    
    setBudgetRequestGroups(prev => [group, ...prev]);
    toast(`Budget request group ${requestNumber} created!`);
    return requestNumber;
  };

  const addBudgetRequestToGroup = (groupId: string, requestData: Omit<BudgetRequest, 'id' | 'createdAt' | 'status' | 'requestGroupId' | 'requestNumber'>) => {
    const group = budgetRequestGroups.find(g => g.id === groupId);
    if (!group) {
      toast('Budget request group not found!', 'error');
      return;
    }

    const request: BudgetRequest = {
      ...requestData,
      id: `br-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'submitted',
      requestGroupId: groupId,
      requestNumber: group.requestNumber
    };
    
    setBudgetRequests(prev => [request, ...prev]);
    toast('Budget request added to group!');
  };

  return (
    <AppContext.Provider value={{
      currentUser, login, logout,
      users, setUsers, entries, setEntries, pos, setPOs, regions, setRegions,
      products, setProducts, activities, setActivities, bills, setBills,
      addEntry, updateEntry, updateEntryStatus, deleteEntry,
      addPO, updatePO, approvePO, rejectPO, lapsePO,
      addUser, updateUser, deleteUser, addBill, updateBill,
      addProduct, updateProduct, deleteProduct, addActivity, updateActivity, deleteActivity,
      serviceReceivers, addServiceReceiver, updateServiceReceiver, deleteServiceReceiver,
      vendorProfiles, updateVendorProfile,
      calcLiveSpent, calcPendingSpent,
      getVisiblePOs, getVisiblePendingEntries, getMyEntries, getScopedEntries,
      refreshData,
      toast, toastMsg,
      pendingBillData, setPendingBillData,
      navigateToTab, setNavigateToTab,
      generateInvoiceNumber,
      budgetRequests, setBudgetRequests, budgetRequestGroups, createBudgetRequestGroup, addBudgetRequest, addBudgetRequestToGroup, updateBudgetRequest, approveBudgetRequest
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
