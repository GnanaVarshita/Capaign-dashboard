import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { RoleBadge, Toast, cn } from '../components/ui';
import OverviewTab from './tabs/OverviewTab';
import POTab from './tabs/POTab';
import HierarchyTab from './tabs/HierarchyTab';
import ActivitiesTab from './tabs/ActivitiesTab';
import VendorSectionTab from './tabs/VendorSectionTab';
import BillingTab from './tabs/BillingTab';
import ActivitySheetTab from './tabs/ActivitySheetTab';
import ApprovalsTab from './tabs/ApprovalsTab';
import POApprovalsTab from './tabs/POApprovalsTab';
import POMasterTab from './tabs/POMasterTab';
import UserMgmtTab from './tabs/UserMgmtTab';
import TerritoryTab from './tabs/TerritoryTab';
import QuickViewTab from './tabs/QuickViewTab';
import TransactionMasterTab from './tabs/TransactionMasterTab';
import SettingsTab from './tabs/SettingsTab';

type TabId = 'overview' | 'po' | 'hierarchy' | 'activities' | 'vendor' | 'billing' | 'sheet' | 'approvals' | 'po-approvals' | 'po-master' | 'users' | 'territory' | 'quick' | 'transactions' | 'settings';

const TAB_ICONS: Record<string, string> = {
  overview: '📊', po: '💰', hierarchy: '🏛', activities: '📈', vendor: '🏪',
  billing: '🧾', sheet: '📝', approvals: '✅', 'po-approvals': '📋',
  'po-master': '📁', users: '👥', territory: '🗺', quick: '⚡',
  transactions: '📑', settings: '⚙',
};

export default function Dashboard() {
  const { currentUser, logout, getVisiblePendingEntries, toastMsg, pos, refreshData } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  const canSeeBilling = ['Owner', 'All India Manager', 'Regional Manager', 'Zonal Manager', 'Vendor'].includes(u.role);
  const canSeeVendors = !['All India Manager', 'Regional Manager', 'Zonal Manager', 'Area Manager'].includes(u.role);

  interface Tab { id: TabId; label: string; badge?: number | null }
  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'po', label: 'Purchase Orders' },
    { id: 'hierarchy', label: 'Hierarchy' },
    { id: 'activities', label: 'Activities' },
    ...(canSeeVendors ? [{ id: 'vendor' as TabId, label: 'Vendors' }] : []),
    ...(canSeeBilling ? [{ id: 'billing' as TabId, label: 'Billing' }] : []),
    ...(canSeeSheet ? [{ id: 'sheet' as TabId, label: 'Activity Sheet' }] : []),
    ...(canSeeApprovals ? [{ id: 'approvals' as TabId, label: 'Approvals', badge: pendingCount }] : []),
    ...(canSeePOApprovals ? [{ id: 'po-approvals' as TabId, label: 'PO Approvals', badge: pendingPOs }] : []),
    ...(canSeePOMaster ? [{ id: 'po-master' as TabId, label: 'PO Master' }] : []),
    ...(canSeeUsers ? [{ id: 'users' as TabId, label: 'Users' }] : []),
    ...(canSeeTerritory ? [{ id: 'territory' as TabId, label: 'Territory' }] : []),
    { id: 'quick', label: 'Quick View' },
    { id: 'transactions', label: 'Transactions' },
    ...(canSeeSettings ? [{ id: 'settings' as TabId, label: 'Settings' }] : []),
  ].filter(t => u.role === 'Owner' || !u.tabPerms || u.tabPerms[t.id] !== false);

  const activeTabObj = tabs.find(t => t.id === activeTab);

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':      return <OverviewTab />;
      case 'po':            return <POTab />;
      case 'hierarchy':     return <HierarchyTab />;
      case 'activities':    return <ActivitiesTab />;
      case 'vendor':        return <VendorSectionTab />;
      case 'billing':       return <BillingTab />;
      case 'sheet':         return <ActivitySheetTab />;
      case 'approvals':     return <ApprovalsTab />;
      case 'po-approvals':  return <POApprovalsTab />;
      case 'po-master':     return <POMasterTab />;
      case 'users':         return <UserMgmtTab />;
      case 'territory':     return <TerritoryTab />;
      case 'quick':         return <QuickViewTab />;
      case 'transactions':  return <TransactionMasterTab />;
      case 'settings':      return <SettingsTab />;
      default:              return <OverviewTab />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F4F8]">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 shadow-[0_1px_0_rgba(255,255,255,0.08),0_4px_24px_rgba(15,23,42,0.2)]"
        style={{ background: 'linear-gradient(135deg, #0D2137 0%, #1B4F72 55%, #245E87 100%)' }}>
        <div className="max-w-[1800px] mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center text-base shadow-sm">
              📊
            </div>
            <div className="hidden sm:block">
              <span className="font-display font-black text-white text-[15px] tracking-tight">AdCampaign</span>
              <span className="text-white/40 mx-2 text-xs">|</span>
              <span className="text-white/60 text-xs font-medium hidden md:inline">Management Portal</span>
            </div>
            <div className="hidden md:block">
              <RoleBadge role={u.role} />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {(pendingCount > 0 || pendingPOs > 0) && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/30">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-300 text-xs font-semibold">
                  {pendingCount + pendingPOs} pending
                </span>
              </div>
            )}
            <button
              onClick={refreshData}
              title="Refresh data from storage"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg text-xs font-semibold text-white/90 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="hidden md:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 border border-white/20 flex items-center justify-center text-xs font-bold text-white">
                {u.name[0].toUpperCase()}
              </div>
              <div className="text-right">
                <p className="text-white text-xs font-semibold leading-tight">{u.name}</p>
                <p className="text-white/50 text-[10px] leading-tight">{u.loginId}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-semibold text-white/90 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Tab Navigation ─────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-14 z-40">
        <div className="max-w-[1800px] mx-auto px-4">
          <div className="flex overflow-x-auto gap-0 scrollbar-hide">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3.5 py-3.5 text-xs font-semibold whitespace-nowrap transition-all duration-150 border-b-2',
                    isActive
                      ? 'text-[#1B4F72] border-[#1B4F72]'
                      : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-200'
                  )}
                >
                  <span className="text-sm">{TAB_ICONS[tab.id]}</span>
                  <span>{tab.label}</span>
                  {tab.badge != null && tab.badge > 0 && (
                    <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-none">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Page title strip ───────────────────────────────── */}
      <div className="max-w-[1800px] w-full mx-auto px-4 md:px-6 pt-5 pb-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{TAB_ICONS[activeTab]}</span>
          <h1 className="text-lg font-display font-black text-slate-800">{activeTabObj?.label}</h1>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span>Dashboard</span>
          <span>›</span>
          <span className="text-slate-600">{activeTabObj?.label}</span>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────── */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto px-4 md:px-6 py-4 animate-fade-in">
        {renderTab()}
      </main>

      {toastMsg && <Toast msg={toastMsg.msg} type={toastMsg.type} />}
    </div>
  );
}
