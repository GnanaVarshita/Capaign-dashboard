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

export default function Dashboard() {
  const { currentUser, logout, getVisiblePendingEntries, toastMsg, pos } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

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
  const canSeeVendor = u.role !== 'Vendor' ? true : true;

  interface Tab { id: TabId; label: string; badge?: number | null }
  const tabs: Tab[] = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'po', label: '💰 Purchase Orders' },
    { id: 'hierarchy', label: '🏛 Hierarchy' },
    { id: 'activities', label: '📈 Activities' },
    ...(canSeeVendor ? [{ id: 'vendor' as TabId, label: '🏪 Vendors' }] : []),
    ...(canSeeBilling ? [{ id: 'billing' as TabId, label: '🧾 Billing' }] : []),
    ...(canSeeSheet ? [{ id: 'sheet' as TabId, label: '📝 Activity Sheet' }] : []),
    ...(canSeeApprovals ? [{ id: 'approvals' as TabId, label: '✅ Approvals', badge: pendingCount }] : []),
    ...(canSeePOApprovals ? [{ id: 'po-approvals' as TabId, label: '📋 PO Approvals', badge: pendingPOs }] : []),
    ...(canSeePOMaster ? [{ id: 'po-master' as TabId, label: '📁 PO Master' }] : []),
    ...(canSeeUsers ? [{ id: 'users' as TabId, label: '👥 Users' }] : []),
    ...(canSeeTerritory ? [{ id: 'territory' as TabId, label: '🗺 Territory' }] : []),
    { id: 'quick', label: '⚡ Quick View' },
    { id: 'transactions', label: '📑 Transactions' },
    ...(canSeeSettings ? [{ id: 'settings' as TabId, label: '⚙ Settings' }] : []),
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'po': return <POTab />;
      case 'hierarchy': return <HierarchyTab />;
      case 'activities': return <ActivitiesTab />;
      case 'vendor': return <VendorSectionTab />;
      case 'billing': return <BillingTab />;
      case 'sheet': return <ActivitySheetTab />;
      case 'approvals': return <ApprovalsTab />;
      case 'po-approvals': return <POApprovalsTab />;
      case 'po-master': return <POMasterTab />;
      case 'users': return <UserMgmtTab />;
      case 'territory': return <TerritoryTab />;
      case 'quick': return <QuickViewTab />;
      case 'transactions': return <TransactionMasterTab />;
      case 'settings': return <SettingsTab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA]">
      <header className="sticky top-0 z-50 bg-[#1B4F72] text-white shadow-lg">
        <div className="max-w-[1800px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <span className="font-bold text-lg hidden sm:block">Ad Campaign Dashboard</span>
            <span className="text-white/40 hidden md:block">|</span>
            <RoleBadge role={u.role} />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm hidden md:block">
              <span className="text-white/60">Welcome, </span>
              <span className="font-bold">{u.name}</span>
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-[#DDE3ED] shadow-sm sticky top-14 z-40">
        <div className="max-w-[1800px] mx-auto px-4">
          <div className="flex overflow-x-auto gap-0.5 py-2 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                  activeTab === tab.id
                    ? 'bg-[#1B4F72] text-white shadow-sm'
                    : 'text-[#6B7280] hover:bg-[#F0F4F8] hover:text-[#374151]'
                )}
              >
                {tab.label}
                {tab.badge != null && tab.badge > 0 && (
                  <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1800px] w-full mx-auto p-4 md:p-6">
        {renderTab()}
      </main>

      {toastMsg && <Toast msg={toastMsg.msg} type={toastMsg.type} />}
    </div>
  );
}
