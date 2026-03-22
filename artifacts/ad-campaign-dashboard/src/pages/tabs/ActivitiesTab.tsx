import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, ProgressBar, Table, Th, Td, Badge, cn } from '../../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, pct } from '../../lib/mock-data';

export default function ActivitiesTab() {
  const { getVisiblePOs, calcLiveSpent, products, activities, currentUser } = useAppContext();
  const pos = getVisiblePOs().filter(p => p.approvalStatus === 'approved');
  const [selectedPO, setSelectedPO] = useState(pos[0]?.poNumber || '');

  const po = pos.find(p => p.poNumber === selectedPO) || pos[0];

  const scope = useMemo(() => {
    const u = currentUser!;
    const res: { region?: string; zone?: string; area?: string; label: string } = { label: '' };
    if (['Regional Manager', 'Zonal Manager', 'Area Manager'].includes(u.role)) {
      res.region = u.territory?.region;
      if (['Zonal Manager', 'Area Manager'].includes(u.role)) res.zone = u.territory?.zone;
      if (u.role === 'Area Manager') res.area = u.territory?.area;
    }
    
    const parts = [];
    if (res.region) parts.push(res.region);
    if (res.zone) parts.push(res.zone);
    if (res.area) parts.push(res.area);
    if (parts.length) res.label = ` (${parts.join(' · ')})`;
    
    return res;
  }, [currentUser]);

  const chartData = useMemo(() => {
    if (!po) return [];
    return activities.map(act => {
      const budget = products.reduce((s, prod) => {
        if (scope.region) {
          const rAlloc = po.allocations[scope.region] || {};
          const pAlloc = rAlloc[prod] || {};
          return s + (pAlloc[act] || 0);
        }
        return s + Object.values(po.allocations || {}).reduce((rs, r) => {
          return rs + ((r[prod] || {})[act] || 0);
        }, 0);
      }, 0);
      const spent = calcLiveSpent({ 
        po: po.poNumber, 
        activity: act, 
        region: scope.region, 
        zone: scope.zone, 
        area: scope.area 
      });
      return { name: act, Budget: budget, Spent: spent };
    }).filter(d => d.Budget > 0 || d.Spent > 0);
  }, [po, activities, products, calcLiveSpent, scope]);

  const tableData = useMemo(() => {
    if (!po) return [];
    const rows: { product: string; activity: string; budget: number; spent: number }[] = [];
    products.forEach(prod => {
      activities.forEach(act => {
        const budget = scope.region 
          ? (((po.allocations[scope.region] || {})[prod] || {})[act] || 0)
          : Object.values(po.allocations || {}).reduce((s, r) => {
              return s + ((r[prod] || {})[act] || 0);
            }, 0);
        const spent = calcLiveSpent({ 
          po: po.poNumber, 
          product: prod, 
          activity: act, 
          region: scope.region, 
          zone: scope.zone, 
          area: scope.area 
        });
        if (budget > 0 || spent > 0) rows.push({ product: prod, activity: act, budget, spent });
      });
    });
    return rows;
  }, [po, products, activities, calcLiveSpent, scope]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter by PO:</span>
        <div className="flex gap-2 flex-wrap">
          {pos.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPO(p.poNumber)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
                selectedPO === p.poNumber 
                  ? 'bg-[#1B4F72] text-white border-[#1B4F72] shadow-sm' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#1B4F72] hover:text-[#1B4F72]'
              )}
            >{p.poNumber}</button>
          ))}
        </div>
      </div>

      {po && (
        <>
          <Card className="p-6">
            <CardTitle>
              Activity-wise Budget vs Spend — {po.poNumber}
              <span className="text-slate-400 font-medium">{scope.label}</span>
            </CardTitle>
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}K`} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={120} tick={{ fontSize: 12, fill: '#334155', fontWeight: 500 }} />
                  <Tooltip 
                    formatter={(v: number) => formatCurrency(v)} 
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: 12 }} 
                  />
                  <Bar dataKey="Budget" fill="#E0E7FF" radius={[0, 4, 4, 0]} name="Budget" barSize={20} />
                  <Bar dataKey="Spent" fill="#4338CA" radius={[0, 4, 4, 0]} name="Spent" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <CardTitle>Detailed Breakdown</CardTitle>
            <div className="mt-4">
              <Table>
                <thead>
                  <tr>
                    <Th>Activity</Th><Th>Product</Th><Th>Budget</Th><Th>Spent</Th><Th>Balance</Th><Th>Utilization</Th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.length === 0 ? (
                    <tr><Td colSpan={6} className="text-center py-12 text-slate-400">No activity data available for this scope.</Td></tr>
                  ) : (
                    tableData.map((row, i) => {
                      const balance = row.budget - row.spent;
                      const utilPct = pct(row.spent, row.budget);
                      return (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <Td className="font-semibold text-slate-700">{row.activity}</Td>
                          <Td><Badge variant="blue">{row.product}</Badge></Td>
                          <Td className="font-medium">{formatCurrency(row.budget)}</Td>
                          <Td className="font-bold text-emerald-600">{formatCurrency(row.spent)}</Td>
                          <Td className={cn('font-medium', balance < 0 ? 'text-rose-600' : 'text-slate-600')}>{formatCurrency(balance)}</Td>
                          <Td>
                            <div className="flex items-center gap-3 min-w-[120px]">
                              <ProgressBar value={utilPct} className="flex-1 h-1.5" />
                              <span className="text-xs font-bold text-slate-700 w-10 text-right">{utilPct}%</span>
                            </div>
                          </Td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
