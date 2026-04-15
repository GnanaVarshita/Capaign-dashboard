import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Entry, PO, Region, Bill, ServiceReceiver, VendorProfile, BudgetRequest, BudgetRequestGroup, VendorQuotation, VendorQuotationItem } from '../types';

// Domain hooks
import { useAuth }           from '../hooks/useAuth';
import { useUsers }          from '../hooks/useUsers';
import { useEntries }        from '../hooks/useEntries';
import { usePOs }            from '../hooks/usePOs';
import { useBills }          from '../hooks/useBills';
import { useConfig }         from '../hooks/useConfig';
import { useVendors }        from '../hooks/useVendors';
import { useBudgetRequests } from '../hooks/useBudgetRequests';
import { useQuotations }     from '../hooks/useQuotations';

interface SpentFilters {
  po?: string; region?: string; zone?: string; area?: string;
  areaManagerId?: string; product?: string; activity?: string;
  vendorId?: string; crop?: string; dateFrom?: string; dateTo?: string;
}

interface AppContextType {
  // Auth
  currentUser: User | null;
  login: (id: string, pass: string) => Promise<boolean>;
  logout: () => void;

  // Users
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Entries
  entries: Entry[];
  setEntries: React.Dispatch<React.SetStateAction<Entry[]>>;
  addEntry: (entry: Omit<Entry, 'id' | 'status' | 'decidedBy' | 'decidedAt'>) => void;
  updateEntry: (id: string, updates: Partial<Entry>, editedByName: string) => void;
  updateEntryStatus: (id: string, status: 'approved' | 'rejected', decidedBy: string, decidedByDesignation?: string) => void;
  deleteEntry: (id: string) => void;
  calcLiveSpent: (filters: SpentFilters) => number;
  calcPendingSpent: (filters: SpentFilters) => number;
  getVisiblePendingEntries: () => Entry[];
  getMyEntries: () => Entry[];
  getScopedEntries: () => Entry[];

  // POs
  pos: PO[];
  setPOs: React.Dispatch<React.SetStateAction<PO[]>>;
  addPO: (po: Omit<PO, 'id'>) => void;
  updatePO: (id: string, updates: Partial<PO>) => void;
  approvePO: (id: string, approvedBy: string) => void;
  rejectPO: (id: string, reason?: string) => void;
  lapsePO: (id: string) => void;
  getVisiblePOs: () => PO[];

  // Bills
  bills: Bill[];
  setBills: React.Dispatch<React.SetStateAction<Bill[]>>;
  addBill: (bill: Omit<Bill, 'id'>) => void;
  updateBill: (id: string, updates: Partial<Bill>) => void;
  generateInvoiceNumber: () => string;

  // Config
  products: string[];
  setProducts: React.Dispatch<React.SetStateAction<string[]>>;
  activities: string[];
  setActivities: React.Dispatch<React.SetStateAction<string[]>>;
  crops: string[];
  setCrops: React.Dispatch<React.SetStateAction<string[]>>;
  regions: Region[];
  setRegions: React.Dispatch<React.SetStateAction<Region[]>>;
  addProduct: (name: string) => void;
  updateProduct: (oldName: string, newName: string) => void;
  deleteProduct: (name: string) => void;
  addActivity: (name: string) => void;
  updateActivity: (oldName: string, newName: string) => void;
  deleteActivity: (name: string) => void;

  // Vendors / Service Receivers
  serviceReceivers: ServiceReceiver[];
  addServiceReceiver: (receiver: Omit<ServiceReceiver, 'id'>) => void;
  updateServiceReceiver: (id: string, updates: Partial<ServiceReceiver>) => void;
  deleteServiceReceiver: (id: string) => void;
  vendorProfiles: Record<string, VendorProfile>;
  updateVendorProfile: (vendorId: string, updates: Partial<VendorProfile>) => void;

  // Budget Requests
  budgetRequests: BudgetRequest[];
  setBudgetRequests: React.Dispatch<React.SetStateAction<BudgetRequest[]>>;
  budgetRequestGroups: BudgetRequestGroup[];
  createBudgetRequestGroup: (description?: string, targetDate?: string, selectedRegions?: string[]) => string;
  addBudgetRequest: (request: Omit<BudgetRequest, 'id' | 'createdAt' | 'status'>) => void;
  addBudgetRequestToGroup: (groupId: string, request: Omit<BudgetRequest, 'id' | 'createdAt' | 'status' | 'requestGroupId' | 'requestNumber'>) => void;
  updateBudgetRequest: (id: string, updates: Partial<BudgetRequest>) => void;
  approveBudgetRequest: (id: string, approverRole: 'zonal' | 'regional' | 'aim', approverName: string, approverIdField: string) => void;

  // Quotations (vendor-submitted, post-distribution)
  vendorQuotations: VendorQuotation[];
  setVendorQuotations: React.Dispatch<React.SetStateAction<VendorQuotation[]>>;
  upsertVendorQuotation: (poId: string, poNumber: string, region: string, items: VendorQuotationItem[], status: 'draft' | 'submitted') => void;
  deleteVendorQuotation: (id: string) => void;
  getVendorQuotations: () => VendorQuotation[];
  getAdminQuotations: () => VendorQuotation[];

  // UI helpers
  refreshData: () => void;
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  toastMsg: { msg: string; type: string } | null;
  pendingBillData: any;
  setPendingBillData: React.Dispatch<React.SetStateAction<any>>;
  navigateToTab: (tab: string) => void;
  setNavigateToTab: React.Dispatch<React.SetStateAction<(tab: string) => void>>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // ---------- domain hooks ----------
  const auth           = useAuth();
  const userHook       = useUsers();
  const entryHook      = useEntries(auth.currentUser);
  const poHook         = usePOs(auth.currentUser);
  const billHook       = useBills(auth.currentUser);
  const configHook     = useConfig();
  const vendorHook     = useVendors(auth.currentUser);
  const budgetHook     = useBudgetRequests(auth.currentUser);
  const quotationHook  = useQuotations(auth.currentUser);

  // ---------- UI state ----------
  const [toastMsg, setToastMsg]           = useState<{ msg: string; type: string } | null>(null);
  const [pendingBillData, setPendingBillData] = useState<any>(null);
  const [navigateToTab, setNavigateToTab] = useState<(tab: string) => void>(() => {});

  // ---------- Persist everything to localStorage ----------
  useEffect(() => {
    try {
      localStorage.setItem('ad_campaign_db', JSON.stringify({
        users:               userHook.users,
        entries:             entryHook.entries,
        pos:                 poHook.pos,
        regions:             configHook.regions,
        products:            configHook.products,
        activities:          configHook.activities,
        crops:               configHook.crops,
        bills:               billHook.bills,
        serviceReceivers:    vendorHook.serviceReceivers,
        vendorProfiles:      vendorHook.vendorProfiles,
        budgetRequests:      budgetHook.budgetRequests,
        budgetRequestGroups: budgetHook.budgetRequestGroups,
        vendorQuotations:    quotationHook.vendorQuotations,
      }));
    } catch {}
  }, [
    userHook.users, entryHook.entries, poHook.pos, configHook.regions,
    configHook.products, configHook.activities, configHook.crops,
    billHook.bills, vendorHook.serviceReceivers, vendorHook.vendorProfiles,
    budgetHook.budgetRequests, budgetHook.budgetRequestGroups,
    quotationHook.vendorQuotations,
  ]);

  // ---------- Real-time: reload all domain data from localStorage ----------
  const reloadAll = useCallback(() => {
    entryHook.fetchEntries();
    poHook.fetchPOs();
    billHook.fetchBills();
    budgetHook.fetchBudgetRequests();
    configHook.fetchConfig();
    quotationHook.fetchQuotations();
  }, [entryHook, poHook, billHook, budgetHook, configHook, quotationHook]);

  // Listen for changes from other browser tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'ad_campaign_db') reloadAll();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [reloadAll]);

  // Auto-refresh every 30 seconds so same-browser updates propagate without logout
  useEffect(() => {
    const id = setInterval(reloadAll, 30_000);
    return () => clearInterval(id);
  }, [reloadAll]);

  // ---------- Toast ----------
  const toast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  // ---------- Login wraps useAuth and returns sync bool for backwards compat ----------
  const login = useCallback(async (id: string, pass: string): Promise<boolean> => {
    const ok = await auth.login(id, pass);
    return ok;
  }, [auth]);

  // ---------- Refresh ----------
  const refreshData = useCallback(() => {
    reloadAll();
    toast('Data refreshed!', 'success');
  }, [reloadAll, toast]);

  // ---------- Scoped helpers (pass users from hook) ----------
  const getScopedEntries     = useCallback(() => entryHook.getScopedEntries(userHook.users),            [entryHook, userHook.users]);
  const getMyEntries         = useCallback(() => entryHook.getMyEntries(),                               [entryHook]);
  const getVisiblePendingEntries = useCallback(() => entryHook.getVisiblePendingEntries(userHook.users), [entryHook, userHook.users]);
  const getVisiblePOs        = useCallback(() => poHook.getVisiblePOs(entryHook.entries),                [poHook, entryHook.entries]);

  const calcLiveSpent    = useCallback((f: SpentFilters) => entryHook.calcLiveSpent(f, userHook.users),    [entryHook, userHook.users]);
  const calcPendingSpent = useCallback((f: SpentFilters) => entryHook.calcPendingSpent(f, userHook.users), [entryHook, userHook.users]);

  // ---------- Sync wrappers (tabs call these without await) ----------
  const addEntry           = useCallback((d: Omit<Entry, 'id' | 'status' | 'decidedBy' | 'decidedAt'>) => { entryHook.addEntry(d); }, [entryHook]);
  const updateEntry        = useCallback((id: string, u: Partial<Entry>, n: string) => { entryHook.updateEntry(id, u, n); }, [entryHook]);
  const updateEntryStatus  = useCallback((id: string, s: 'approved' | 'rejected', by: string, des?: string) => { entryHook.updateEntryStatus(id, s, by, des); }, [entryHook]);
  const deleteEntry        = useCallback((id: string) => { entryHook.deleteEntry(id); }, [entryHook]);

  const addPO     = useCallback((d: Omit<PO, 'id'>) => { poHook.addPO(d); }, [poHook]);
  const updatePO  = useCallback((id: string, u: Partial<PO>) => { poHook.updatePO(id, u); }, [poHook]);
  const approvePO = useCallback((id: string, by: string) => { poHook.approvePO(id, by); }, [poHook]);
  const rejectPO  = useCallback((id: string, r?: string) => { poHook.rejectPO(id, r); }, [poHook]);
  const lapsePO   = useCallback((id: string) => { poHook.lapsePO(id); }, [poHook]);

  const addBill    = useCallback((d: Omit<Bill, 'id'>) => { billHook.addBill(d); }, [billHook]);
  const updateBill = useCallback((id: string, u: Partial<Bill>) => { billHook.updateBill(id, u); }, [billHook]);

  const addUser    = useCallback((d: Omit<User, 'id'>) => { userHook.addUser(d); toast('User added!'); }, [userHook, toast]);
  const updateUser = useCallback((id: string, u: Partial<User>) => { userHook.updateUser(id, u); toast('User updated!'); }, [userHook, toast]);
  const deleteUser = useCallback((id: string) => { userHook.deleteUser(id); toast('User removed.'); }, [userHook, toast]);

  const addProduct    = useCallback((n: string) => { configHook.addProduct(n); toast(`Product "${n}" added.`); }, [configHook, toast]);
  const updateProduct = useCallback((o: string, n: string) => { configHook.updateProduct(o, n); toast(`Product updated.`); }, [configHook, toast]);
  const deleteProduct = useCallback((n: string) => { configHook.deleteProduct(n); toast(`Product removed.`, 'info'); }, [configHook, toast]);

  const addActivity    = useCallback((n: string) => { configHook.addActivity(n); toast(`Activity "${n}" added.`); }, [configHook, toast]);
  const updateActivity = useCallback((o: string, n: string) => { configHook.updateActivity(o, n); toast(`Activity updated.`); }, [configHook, toast]);
  const deleteActivity = useCallback((n: string) => { configHook.deleteActivity(n); toast(`Activity removed.`, 'info'); }, [configHook, toast]);

  const addServiceReceiver    = useCallback((d: Omit<ServiceReceiver, 'id'>) => { vendorHook.addServiceReceiver(d); toast('Service receiver added!'); }, [vendorHook, toast]);
  const updateServiceReceiver = useCallback((id: string, u: Partial<ServiceReceiver>) => { vendorHook.updateServiceReceiver(id, u); toast('Service receiver updated!'); }, [vendorHook, toast]);
  const deleteServiceReceiver = useCallback((id: string) => { vendorHook.deleteServiceReceiver(id); toast('Service receiver removed.'); }, [vendorHook, toast]);
  const updateVendorProfile   = useCallback((id: string, u: Partial<VendorProfile>) => { vendorHook.updateVendorProfile(id, u); toast('Profile updated!'); }, [vendorHook, toast]);

  // Budget — sync wrapper: generates the request number locally and fires API async
  const createBudgetRequestGroup = useCallback((desc?: string, date?: string, regions?: string[]): string => {
    const groupCount = budgetHook.budgetRequestGroups.length + 1;
    const requestNumber = `BR-${new Date().getFullYear()}-${String(groupCount).padStart(3, '0')}`;
    const group: BudgetRequestGroup = {
      id: `brg-${Date.now()}`,
      requestNumber,
      aimId: auth.currentUser?.id || '',
      aimName: auth.currentUser?.name || '',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
      description: desc,
      targetDate: date,
      selectedRegions: regions?.length ? regions : undefined,
    };
    budgetHook.setBudgetRequestGroups(prev => [group, ...prev]);
    toast(`Budget request group ${requestNumber} created!`);
    return requestNumber;
  }, [budgetHook, auth.currentUser, toast]);

  const addBudgetRequest        = useCallback((d: Omit<BudgetRequest, 'id' | 'createdAt' | 'status'>) => { budgetHook.addBudgetRequest(d); }, [budgetHook]);
  const addBudgetRequestToGroup = useCallback((gid: string, d: Omit<BudgetRequest, 'id' | 'createdAt' | 'status' | 'requestGroupId' | 'requestNumber'>) => { budgetHook.addBudgetRequestToGroup(gid, d); }, [budgetHook]);
  const updateBudgetRequest     = useCallback((id: string, u: Partial<BudgetRequest>) => { budgetHook.updateBudgetRequest(id, u); }, [budgetHook]);
  const approveBudgetRequest    = useCallback((id: string, role: 'zonal' | 'regional' | 'aim', name: string, appId: string) => { budgetHook.approveBudgetRequest(id, role, name, appId); toast(`Budget approved!`); }, [budgetHook, toast]);

  const upsertVendorQuotation  = useCallback((poId: string, poNumber: string, region: string, items: VendorQuotationItem[], status: 'draft' | 'submitted') => {
    quotationHook.upsertVendorQuotation(poId, poNumber, region, items, status);
    toast(status === 'submitted' ? 'Quotation submitted!' : 'Draft saved.', status === 'submitted' ? 'success' : 'info');
  }, [quotationHook, toast]);
  const deleteVendorQuotation = useCallback((id: string) => { quotationHook.deleteVendorQuotation(id); toast('Quotation deleted.', 'info'); }, [quotationHook, toast]);

  return (
    <AppContext.Provider value={{
      // Auth
      currentUser: auth.currentUser, login, logout: auth.logout,

      // Users
      users: userHook.users, setUsers: userHook.setUsers,
      addUser, updateUser, deleteUser,

      // Entries
      entries: entryHook.entries, setEntries: entryHook.setEntries,
      addEntry, updateEntry, updateEntryStatus, deleteEntry,
      calcLiveSpent, calcPendingSpent,
      getVisiblePendingEntries, getMyEntries, getScopedEntries,

      // POs
      pos: poHook.pos, setPOs: poHook.setPOs,
      addPO, updatePO, approvePO, rejectPO, lapsePO, getVisiblePOs,

      // Bills
      bills: billHook.bills, setBills: billHook.setBills,
      addBill, updateBill,
      generateInvoiceNumber: billHook.generateInvoiceNumber,

      // Config
      products: configHook.products, setProducts: configHook.setProducts,
      activities: configHook.activities, setActivities: configHook.setActivities,
      crops: configHook.crops, setCrops: configHook.setCrops,
      regions: configHook.regions, setRegions: configHook.setRegions,
      addProduct, updateProduct, deleteProduct,
      addActivity, updateActivity, deleteActivity,

      // Vendors
      serviceReceivers: vendorHook.serviceReceivers,
      addServiceReceiver, updateServiceReceiver, deleteServiceReceiver,
      vendorProfiles: vendorHook.vendorProfiles,
      updateVendorProfile,

      // Budget Requests
      budgetRequests: budgetHook.budgetRequests,
      setBudgetRequests: budgetHook.setBudgetRequests,
      budgetRequestGroups: budgetHook.budgetRequestGroups,
      createBudgetRequestGroup,
      addBudgetRequest, addBudgetRequestToGroup, updateBudgetRequest, approveBudgetRequest,

      // Quotations (vendor-submitted, post-distribution)
      vendorQuotations: quotationHook.vendorQuotations,
      setVendorQuotations: quotationHook.setVendorQuotations,
      upsertVendorQuotation, deleteVendorQuotation,
      getVendorQuotations: quotationHook.getVendorQuotations,
      getAdminQuotations: quotationHook.getAdminQuotations,

      // UI
      refreshData, toast, toastMsg,
      pendingBillData, setPendingBillData,
      navigateToTab, setNavigateToTab,
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
