import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, ProgressBar, Table, Th, Td, Badge, cn } from '../../components/ui';
import { formatCurrency, formatLakhs, pct } from '../../lib/mock-data';

export default function POTab() {
  const { getVisiblePOs, calcLiveSpent, calcPendingSpent, products, activities, currentUser } = useAppContext();
  const pos = getVisiblePOs().filter(p => p.approvalStatus === 'approved');
  const [selectedPO, setSelectedPO] = useState(pos[0]?.id || '');
  const [productFilter, setProductFilter] = useState('All');

  const po = pos.find(p => p.id === selectedPO) || pos[0];

  const userRegion = currentUser?.territory?.region;
  const userZone = currentUser?.territory?.zone;

  const regionKeys = useMemo(() => {
    if (!po) return [];
    if (userRegion) return [userRegion];
    return Object.keys(po.regionBudgets || {});
  }, [po, userRegion]);

  const filteredProducts = productFilter === 'All' ? products : [productFilter];

  if (!po) return (
    <div className="flex items-center justify-center h-64 text-[#9CA3AF]">
      <p>No approved purchase orders available.</p>
    </div>
  );

  const totalBudget = useMemo(() => {
    if (userRegion) return po.regionBudgets[userRegion] || 0;
    return po.budget;
  }, [po, userRegion]);

  const totalSpent = useMemo(() => {
    return calcLiveSpent({ po: po.poNumber, ...(userRegion ? { region: userRegion } : {}) });
  }, [po, userRegion, calcLiveSpent]);

  const totalPending = useMemo(() => {
    return calcPendingSpent({ po: po.poNumber, ...(userRegion ? { region: userRegion } : {}) });
  }, [po, userRegion, calcPendingSpent]);

  const utilPct = pct(totalSpent, totalBudget);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {pos.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedPO(p.id)}
            className={cn(
              'px-3 py-2 rounded-xl text-xs font-bold border transition-all',
              selectedPO === p.id
                ? 'bg-[#1B4F72] text-white border-[#1B4F72] shadow-md'
                : 'bg-white text-[#374151] border-[#DDE3ED] hover:border-[#1B4F72]'
            )}
          >
            {p.poNumber}
            <span className={cn('ml-1.5 px-1.5 py-0.5 rounded text-[9px]',
              p.status === 'Active' ? 'bg-green-100 text-green-700' :
              p.status === 'Expiring Soon' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-600'
            )}>{p.status}</span>
          </button>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap gap-6 mb-4">
          <div><p className="text-xs text-[#6B7280] font-semibold mb-0.5">PO Budget</p><p className="text-xl font-black text-[#1B4F72]">{formatLakhs(totalBudget)}</p></div>
          <div><p className="text-xs text-[#6B7280] font-semibold mb-0.5">Spent (Approved)</p><p className="text-xl font-black text-green-600">{formatLakhs(totalSpent)}</p></div>
          <div><p className="text-xs text-[#6B7280] font-semibold mb-0.5">Pending</p><p className="text-xl font-black text-amber-600">{formatLakhs(totalPending)}</p></div>
          <div><p className="text-xs text-[#6B7280] font-semibold mb-0.5">Balance</p><p className="text-xl font-black text-[#1A1D23]">{formatLakhs(totalBudget - totalSpent)}</p></div>
          <div><p className="text-xs text-[#6B7280] font-semibold mb-0.5">Validity</p><p className="text-sm font-bold text-[#374151]">{po.from} → {po.to}</p></div>
        </div>
        <ProgressBar value={utilPct} className="h-3" />
        <p className="text-xs text-[#9CA3AF] mt-1">{utilPct}% utilized of total budget</p>
      </Card>

      <div className="flex gap-1 flex-wrap">
        {['All', ...products].map(p => (
          <button
            key={p}
            onClick={() => setProductFilter(p)}
            className={cn('px-3 py-1 rounded-lg text-xs font-semibold transition-all',
              productFilter === p ? 'bg-[#1B4F72] text-white' : 'bg-white border border-[#DDE3ED] text-[#374151] hover:border-[#1B4F72]'
            )}
          >{p}</button>
        ))}
      </div>

      {regionKeys.map(region => {
        const rBudget = po.regionBudgets[region] || 0;
        const rSpent = calcLiveSpent({ po: po.poNumber, region });
        const rPending = calcPendingSpent({ po: po.poNumber, region });
        const rPct = pct(rSpent, rBudget);
        const allocations = po.allocations[region] || {};

        return (
          <Card key={region} className="p-0 overflow-hidden">
            <div className="p-4 bg-[#F8FAFC] border-b border-[#DDE3ED]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-[#1B4F72] text-base"> {region} Region</h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">Budget: <strong>{formatCurrency(rBudget)}</strong> · Spent: <strong className="text-green-600">{formatCurrency(rSpent)}</strong> · Pending: <strong className="text-amber-600">{rPending > 0 ? formatCurrency(rPending) : '—'}</strong></p>
                </div>
                <div className="flex items-center gap-2">
                  <ProgressBar value={rPct} className="w-24" />
                  <span className="text-xs font-bold text-[#374151]">{rPct}%</span>
                </div>
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map(prod => {
                const pAlloc = allocations[prod] || {};
                const pTotal = Object.values(pAlloc).reduce((s, v) => s + (v as number), 0);
                if (pTotal === 0 && productFilter === 'All') return null;
                const pSpent = calcLiveSpent({ po: po.poNumber, region, product: prod });
                const pPct = pct(pSpent, pTotal);

                return (
                  <div key={prod} className="border border-[#DDE3ED] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[#374151] text-sm">{prod}</span>
                      <span className="text-xs text-[#6B7280]">{formatCurrency(pTotal)}</span>
                    </div>
                    <ProgressBar value={pPct} className="mb-3" />
                    <div className="space-y-2">
                      {activities.map(act => {
                        const aVal = pAlloc[act] || 0;
                        if (!aVal) return null;
                        const aSpent = calcLiveSpent({ po: po.poNumber, region, product: prod, activity: act });
                        const aPct = pct(aSpent, aVal);
                        return (
                          <div key={act} className="flex items-center justify-between text-xs gap-2">
                            <span className="text-[#6B7280] truncate flex-1">{act}</span>
                            <span className="text-[#1B4F72] font-semibold whitespace-nowrap">{formatCurrency(aVal)}</span>
                            <div className="w-16"><ProgressBar value={aPct} className="h-1.5" /></div>
                          </div>
                        );
                      })}
                      {Object.keys(pAlloc).length === 0 && <p className="text-xs text-[#9CA3AF] italic">No allocation breakdown</p>}
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#F0F4F8] flex justify-between text-xs font-bold">
                      <span className="text-green-600">Spent: {formatCurrency(pSpent)}</span>
                      <span className={pTotal - pSpent < 0 ? 'text-red-600' : 'text-[#1B4F72]'}>Bal: {formatCurrency(pTotal - pSpent)}</span>
                    </div>
                  </div>
                );
              })}
              {filteredProducts.every(prod => Object.values(allocations[prod] || {}).reduce((s, v) => s + (v as number), 0) === 0) && (
                <p className="text-xs text-[#9CA3AF] italic col-span-3 py-4">No allocation data for this region.</p>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
