import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { RoleBadge, Toast, cn } from '../components/ui';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Network, 
  TrendingUp, 
  Store, 
  Receipt, 
  FileText, 
  CheckSquare, 
  ClipboardCheck, 
  FolderSearch, 
  Users, 
  Map, 
  Zap, 
  ListOrdered, 
  Settings, 
  Banknote,
  LogOut,
  RefreshCw,
  Menu,
  X,
  ChevronRight,
  PieChart,
  User
} from 'lucide-react';

import OverviewTab from './tabs/OverviewTab';
import POTab from './tabs/POTab';
import HierarchyTab from './tabs/HierarchyTab';
import ActivitiesTab from './tabs/ActivitiesTab';
import VendorSectionTab from './tabs/VendorSectionTab';
import BillingTab from './tabs/BillingTab';
import BillingTab_test from './tabs/BillingTab_test';
import ActivitySheetTab from './tabs/ActivitySheetTab';
import ApprovalsTab from './tabs/ApprovalsTab';
import POApprovalsTab from './tabs/POApprovalsTab';
import POMasterTab from './tabs/POMasterTab';
import UserMgmtTab from './tabs/UserMgmtTab';
import TerritoryTab from './tabs/TerritoryTab';
import QuickViewTab from './tabs/QuickViewTab';
import TransactionMasterTab from './tabs/TransactionMasterTab';
import FinanceTab from './tabs/FinanceTab';
import BudgetRequestTab from './tabs/BudgetRequestTab';
import BudgetRequestTab_test from './tabs/BudgetRequestTab_test';
import SettingsTab from './tabs/SettingsTab';
import QuotationTab from './tabs/QuotationTab';

type TabId = 'overview' | 'po' | 'hierarchy' | 'activities' | 'vendor' | 'billing' | 'billing-test' | 'sheet' | 'approvals' | 'po-approvals' | 'po-master' | 'users' | 'territory' | 'quick' | 'transactions' | 'settings' | 'finance' | 'budget-request' | 'budget-request-test' | 'quotation';

const TAB_ICONS: Record<string, React.ReactNode> = {
  overview: <LayoutDashboard className="w-4 h-4" />,
  po: <ShoppingCart className="w-4 h-4" />,
  hierarchy: <Network className="w-4 h-4" />,
  activities: <TrendingUp className="w-4 h-4" />,
  vendor: <Store className="w-4 h-4" />,
  billing: <Receipt className="w-4 h-4" />,
  'billing-test': <Receipt className="w-4 h-4" />,
  sheet: <FileText className="w-4 h-4" />,
  approvals: <CheckSquare className="w-4 h-4" />,
  'po-approvals': <ClipboardCheck className="w-4 h-4" />,
  'po-master': <FolderSearch className="w-4 h-4" />,
  users: <Users className="w-4 h-4" />,
  territory: <Map className="w-4 h-4" />,
  quick: <Zap className="w-4 h-4" />,
  transactions: <ListOrdered className="w-4 h-4" />,
  settings: <Settings className="w-4 h-4" />,
  finance: <Banknote className="w-4 h-4" />,
  'budget-request': <PieChart className="w-4 h-4" />,
  'budget-request-test': <PieChart className="w-4 h-4" />,
  'quotation': <User className="w-4 h-4" />,
};

export default function Dashboard() {
  const { currentUser, logout, getVisiblePendingEntries, toastMsg, pos, refreshData, setNavigateToTab } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setNavigateToTab(() => (tab: string) => setActiveTab(tab as TabId));
  }, [setNavigateToTab]);

  if (!currentUser) return null;

  const u = currentUser;
  const pendingCount = getVisiblePendingEntries().length;
  const pendingPOs = pos.filter(p => p.approvalStatus === 'pending').length;

  const canSeeSheet = u.perms.enter || ['Owner', 'Area Manager', 'Zonal Manager', 'Regional Manager'].includes(u.role);
  const canSeeApprovals = u.perms.approve;
  const canSeePOMaster = u.role === 'Owner' || u.perms.manage;
  const canSeePOApprovals = u.role === 'Owner' || u.role === 'All India Manager';
  const canSeeUsers = u.role === 'Owner' || u.perms.manage;
  const canSeeTerritory = u.role === 'Owner';
  const canSeeSettings = u.role === 'Owner' || !!u.perms.settings;
  const canSeeBilling = ['Owner', 'Vendor', 'All India Manager'].includes(u.role);
  const canSeeFinance = ['Owner', 'Vendor'].includes(u.role);
  const canSeeVendors = !['All India Manager', 'Regional Manager', 'Zonal Manager', 'Area Manager'].includes(u.role);
  const canSeeBudgetRequest = ['Area Manager', 'Zonal Manager', 'Regional Manager', 'All India Manager', 'Owner', 'Finance Administrator'].includes(u.role);
  const canSeeQuotation = ['Owner', 'All India Manager', 'Finance Administrator', 'Regional Manager', 'Vendor'].includes(u.role);

  interface Tab { id: TabId; label: string; badge?: number | null }
  const tabs: Tab[] = [
    { id: 'overview' as TabId, label: 'Overview' },
    { id: 'po' as TabId, label: 'Purchase Orders' },
    { id: 'hierarchy' as TabId, label: 'Hierarchy' },
    { id: 'activities' as TabId, label: 'Activities' },
    ...(canSeeVendors ? [{ id: 'vendor' as TabId, label: 'Vendors' }] : []),
    ...(canSeeBilling ? [{ id: 'billing' as TabId, label: 'Billing' }] : []),
    ...(canSeeBilling && u.role === 'Owner' ? [{ id: 'billing-test' as TabId, label: 'Billing 🧪 (Test)' }] : []),
    ...(canSeeSheet ? [{ id: 'sheet' as TabId, label: 'Activity Sheet' }] : []),
    ...(canSeeApprovals ? [{ id: 'approvals' as TabId, label: 'Approvals', badge: pendingCount }] : []),
    ...(canSeePOApprovals ? [{ id: 'po-approvals' as TabId, label: 'PO Approvals', badge: pendingPOs }] : []),
    ...(canSeePOMaster ? [{ id: 'po-master' as TabId, label: 'PO Master' }] : []),
    ...(canSeeUsers ? [{ id: 'users' as TabId, label: 'Users' }] : []),
    ...(canSeeTerritory ? [{ id: 'territory' as TabId, label: 'Territory' }] : []),
    { id: 'quick' as TabId, label: 'Quick View' },
    { id: 'transactions' as TabId, label: 'Transactions' },
    ...(canSeeSettings ? [{ id: 'settings' as TabId, label: 'Settings' }] : []),
    ...(canSeeFinance ? [{ id: 'finance' as TabId, label: 'Finance' }] : []),
    ...(canSeeBudgetRequest ? [{ id: 'budget-request' as TabId, label: 'Budget Requests' }] : []),
    ...(canSeeBudgetRequest && u.role === 'Owner' ? [{ id: 'budget-request-test' as TabId, label: 'Budget Requests 🧪 (Test)' }] : []),
    ...(canSeeQuotation ? [{ id: 'quotation' as TabId, label: 'Quotations' }] : []),
  ].filter(t => u.role === 'Owner' || !u.tabPerms || u.tabPerms[t.id] !== false);

  const activeTabObj = tabs.find(t => t.id === activeTab);

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':        return <OverviewTab />;
      case 'po':              return <POTab />;
      case 'hierarchy':       return <HierarchyTab />;
      case 'activities':      return <ActivitiesTab />;
      case 'vendor':          return <VendorSectionTab />;
      case 'billing':         return <BillingTab />;
      case 'sheet':           return <ActivitySheetTab />;
      case 'approvals':       return <ApprovalsTab />;
      case 'po-approvals':    return <POApprovalsTab />;
      case 'po-master':       return <POMasterTab />;
      case 'users':           return <UserMgmtTab />;
      case 'territory':       return <TerritoryTab />;
      case 'quick':           return <QuickViewTab />;
      case 'transactions':    return <TransactionMasterTab />;
      case 'settings':        return <SettingsTab />;
      case 'finance':         return <FinanceTab />;
      case 'billing-test':    return <BillingTab_test />;
      case 'budget-request':  return <BudgetRequestTab />;
      case 'budget-request-test': return <BudgetRequestTab_test />;
      case 'quotation':       return <QuotationTab />;
      default:                return <OverviewTab />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full text-white">
      {/* Sidebar Header / Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-white text-lg tracking-tight leading-none">AdCampaign</span>
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Management Portal</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-hide">
        <div className="space-y-1">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                  isActive 
                    ? 'bg-white/10 text-white shadow-sm' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                <div className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  isActive ? 'bg-[#2E86C1] text-white' : 'bg-white/5 text-white/40 group-hover:text-white'
                )}>
                  {TAB_ICONS[tab.id]}
                </div>
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.badge != null && tab.badge > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg shadow-amber-500/20">
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[#2E86C1]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer / User Profile */}
      <div className="p-4 mt-auto border-t border-white/5 bg-black/10">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2E86C1] to-[#1B4F72] flex items-center justify-center text-sm font-bold text-white shadow-lg">
            {u.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold truncate leading-tight">{u.name}</p>
            <p className="text-white/40 text-[11px] truncate">{u.loginId}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={refreshData}
            className="flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-bold text-white transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-[11px] font-bold text-red-400 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      
      {/* ── Desktop Sidebar ───────────────────────────────── */}
      <aside 
        className="hidden lg:flex flex-col w-72 h-screen sticky top-0 z-40 border-r border-slate-200 overflow-hidden transition-all duration-300 shadow-2xl"
        style={{ background: 'linear-gradient(180deg, #0D2137 0%, #1B4F72 100%)' }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar (Drawer) ───────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside 
            className="absolute left-0 top-0 bottom-0 w-[280px] animate-slide-in-left shadow-2xl overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #0D2137 0%, #1B4F72 100%)' }}
          >
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main Content Area ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-50 h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-display font-black text-[#1B4F72] text-lg tracking-tight">AdCampaign</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#1B4F72] flex items-center justify-center text-xs font-bold text-white">
            {u.name[0].toUpperCase()}
          </div>
        </header>

        {/* Desktop Top Bar (Actions/Breadcrumbs) */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-xl opacity-80">{TAB_ICONS[activeTab]}</span>
                <h1 className="text-xl font-display font-bold text-slate-800 tracking-tight">{activeTabObj?.label}</h1>
              </div>
              <div className="hidden sm:flex items-center gap-2 ml-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                <RoleBadge role={u.role} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(pendingCount > 0 || pendingPOs > 0) && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 shadow-sm animate-pulse-subtle">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-amber-700 text-[11px] font-bold uppercase tracking-wider">
                    {pendingCount + pendingPOs} Pending
                  </span>
                </div>
              )}
              
              <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block" />
              
              <button 
                onClick={refreshData}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-[#1B4F72] hover:bg-[#1B4F72]/5 rounded-xl transition-all font-medium text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden xl:inline">Refresh Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <main className="flex-1 overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto px-6 py-6">
            {/* Breadcrumbs */}
            {/* <nav className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">
              <span className="hover:text-slate-600 cursor-pointer transition-colors">Dashboard</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#1B4F72]">{activeTabObj?.label}</span>
            </nav> */}

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {renderTab()}
            </div>
          </div>
        </main>
      </div>

      {toastMsg && <Toast msg={toastMsg.msg} type={toastMsg.type} />}
    </div>
  );
}
