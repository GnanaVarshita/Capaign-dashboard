import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Select, Label, ProgressBar, Table, Th, Td, Badge, cn } from '../../components/ui';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatLakhs, pct } from '../../lib/mock-data';

const COLORS = ['#1B4F72', '#2E86C1', '#AED6F1', '#F39C12', '#E74C3C', '#27AE60', '#8E44AD', '#D35400'];

export default function QuickViewTab() {
  const { getVisiblePOs, calcLiveSpent, calcPendingSpent, products, activities, regions, entries, currentUser } = useAppContext();
  const u = currentUser!;
  const pos = getVisiblePOs().filter(p => p.approvalStatus === 'approved');
  const [selectedPO, setSelectedPO] = useState(pos[0]?.poNumber || '');

  const po = pos.find(p => p.poNumber === selectedPO) || pos[0];

  const productData = useMemo(() => {
    if (!po) return [];
    return products.map(prod => {
      const budget = Object.values(po.allocations || {}).reduce((s, r) => {
        return s + Object.values(r[prod] || {}).reduce((as, v) => as + (v as number), 0);
      }, 0);
      const spent = calcLiveSpent({ po: po.poNumber, product: prod });
      return { name: prod, Budget: budget, Spent: spent };
    }).filter(d => d.Budget > 0);
  }, [po, products, calcLiveSpent]);

  const activityData = useMemo(() => {
    if (!po) return [];
    return activities.map(act => {
      const spent = calcLiveSpent({ po: po.poNumber, activity: act });
      return { name: act, value: spent };
    }).filter(d => d.value > 0);
  }, [po, activities, calcLiveSpent]);

  const regionData = useMemo(() => {
    if (!po) return [];
    return Object.entries(po.regionBudgets || {}).map(([region, budget]) => {
      const spent = calcLiveSpent({ po: po.poNumber, region });
      const pending = calcPendingSpent({ po: po.poNumber, region });
      return { region, budget: budget as number, spent, pending };
    });
  }, [po, calcLiveSpent, calcPendingSpent]);

  const totalBudget = po?.budget || 0;
  const totalSpent = po ? calcLiveSpent({ po: po.poNumber }) : 0;
  const totalPending = po ? calcPendingSpent({ po: po.poNumber }) : 0;
  const utilPct = pct(totalSpent, totalBudget);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Label className="whitespace-nowrap">Select PO:</Label>
        <Select value={selectedPO} onChange={e => setSelectedPO(e.target.value)} className="max-w-xs">
          {pos.map(p => <option key={p.id} value={p.poNumber}>{p.poNumber} — {p.status}</option>)}
        </Select>
      </div>

      {po && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Budget', value: formatLakhs(totalBudget), sub: formatCurrency(totalBudget), color: 'border-l-[#1B4F72]', textColor: 'text-[#1B4F72]' },
              { label: 'Approved Spend', value: formatLakhs(totalSpent), sub: `${utilPct}% utilized`, color: 'border-l-green-500', textColor: 'text-green-600' },
              { label: 'Pending Approval', value: formatLakhs(totalPending), sub: formatCurrency(totalPending), color: 'border-l-amber-400', textColor: 'text-amber-600' },
              { label: 'Balance', value: formatLakhs(totalBudget - totalSpent), sub: formatCurrency(totalBudget - totalSpent), color: totalBudget - totalSpent < 0 ? 'border-l-red-500' : 'border-l-gray-400', textColor: totalBudget - totalSpent < 0 ? 'text-red-600' : 'text-[#374151]' },
            ].map(k => (
              <Card key={k.label} className={`p-4 border-l-4 ${k.color}`}>
                <p className="text-xs text-[#6B7280] font-semibold mb-1">{k.label}</p>
                <p className={`text-xl font-black ${k.textColor}`}>{k.value}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{k.sub}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5">
              <CardTitle>Spend by Activity</CardTitle>
              {activityData.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={activityData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                        {activityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="py-10 text-center text-[#9CA3AF] text-sm">No approved spend yet.</p>}
            </Card>

            <Card className="p-5">
              <CardTitle>Region-wise Performance</CardTitle>
              <div className="space-y-3">
                {regionData.map(r => {
                  const rPct = pct(r.spent, r.budget);
                  return (
                    <div key={r.region}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-semibold text-[#374151]">{r.region}</span>
                        <div className="flex gap-3 text-xs">
                          <span className="text-green-600 font-bold">{formatCurrency(r.spent)}</span>
                          <span className="text-[#9CA3AF]">/ {formatCurrency(r.budget)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={rPct} className="flex-1" />
                        <span className="text-xs font-bold text-[#374151] w-10 text-right">{rPct}%</span>
                      </div>
                      {r.pending > 0 && <p className="text-[10px] text-amber-600 mt-0.5">⏳ {formatCurrency(r.pending)} pending</p>}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <CardTitle>Product Summary</CardTitle>
            <Table>
              <thead>
                <tr><Th>Product</Th><Th>Allocated</Th><Th>Spent</Th><Th>Balance</Th><Th>Utilization</Th></tr>
              </thead>
              <tbody>
                {productData.map(p => {
                  const bal = p.Budget - p.Spent;
                  const pUtilPct = pct(p.Spent, p.Budget);
                  return (
                    <tr key={p.name} className="hover:bg-[#F8FAFC]">
                      <Td className="font-bold"><Badge variant="blue">{p.name}</Badge></Td>
                      <Td>{formatCurrency(p.Budget)}</Td>
                      <Td className="font-bold text-green-600">{formatCurrency(p.Spent)}</Td>
                      <Td className={bal < 0 ? 'font-bold text-red-600' : 'text-[#374151]'}>{formatCurrency(bal)}</Td>
                      <Td>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <ProgressBar value={pUtilPct} className="flex-1" />
                          <span className="text-xs font-bold w-8 text-right">{pUtilPct}%</span>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
                {productData.length === 0 && (
                  <tr><Td colSpan={5} className="text-center py-8 text-[#9CA3AF]">No product allocations found for this PO.</Td></tr>
                )}
              </tbody>
            </Table>
          </Card>
        </>
      )}

      {!po && (
        <Card className="p-12 text-center text-[#9CA3AF]">
          <p className="text-2xl mb-3">📊</p>
          <p>No approved POs available.</p>
        </Card>
      )}
    </div>
  );
}
