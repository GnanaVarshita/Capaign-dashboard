import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, KpiCard, ProgressBar, Table, Th, Td, Badge } from '../../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCurrency, formatLakhs, pct } from '../../lib/mock-data';

const COLORS = ['#1B4F72', '#2E7D32', '#B45309', '#6D28D9'];
const PROD_COLORS = ['#1B4F72', '#2E7D32', '#B45309'];

export default function OverviewTab() {
  const { getVisiblePOs, calcLiveSpent, calcPendingSpent, regions, entries, currentUser, users } = useAppContext();
  const visiblePOs = getVisiblePOs();
  const activePOs = visiblePOs.filter(p => p.status === 'Active' || p.status === 'Expiring Soon');

  const userRegion = useMemo(() => {
    if (['Regional Manager', 'Zonal Manager', 'Area Manager'].includes(currentUser.role)) {
      return currentUser.territory?.region;
    }
    return null;
  }, [currentUser]);

  const totalBudget = useMemo(() => {
    return activePOs.reduce((s, po) => {
      if (userRegion) return s + (po.regionBudgets[userRegion] || 0);
      return s + po.budget;
    }, 0);
  }, [activePOs, userRegion]);

  const totalSpent = useMemo(() => {
    return activePOs.reduce((s, po) => s + calcLiveSpent({ po: po.poNumber, ...(userRegion ? { region: userRegion } : {}) }), 0);
  }, [activePOs, calcLiveSpent, userRegion]);

  const totalPending = useMemo(() => {
    return activePOs.reduce((s, po) => s + calcPendingSpent({ po: po.poNumber, ...(userRegion ? { region: userRegion } : {}) }), 0);
  }, [activePOs, calcPendingSpent, userRegion]);

  const unutilized = totalBudget - totalSpent;

  const prodData = useMemo(() => {
    return ['Product A', 'Product B', 'Product C'].map((prod, i) => {
      const budget = activePOs.reduce((s, po) => {
        let b = 0;
        if (userRegion) {
          const r = po.allocations[userRegion] || {};
          if (r[prod]) Object.values(r[prod]).forEach(v => b += (v as number));
        } else {
          Object.values(po.allocations || {}).forEach(r => {
            if (r[prod]) Object.values(r[prod]).forEach(v => b += (v as number));
          });
        }
        return s + b;
      }, 0);
      const spent = calcLiveSpent({ product: prod, ...(userRegion ? { region: userRegion } : {}) });
      return { name: prod, Budget: budget, Spent: spent, color: PROD_COLORS[i] };
    });
  }, [activePOs, calcLiveSpent, userRegion]);

  const regionData = useMemo(() => {
    return regions
      .filter(r => !userRegion || r.name === userRegion)
      .map(r => {
        const budget = activePOs.reduce((s, po) => s + (po.regionBudgets[r.name] || 0), 0);
        const spent = calcLiveSpent({ region: r.name });
        const pending = calcPendingSpent({ region: r.name });
        return { ...r, budget, spent, pending, balance: budget - spent, utilPct: pct(spent, budget) };
      }).filter(r => r.budget > 0);
  }, [regions, activePOs, calcLiveSpent, calcPendingSpent, userRegion]);

  const approvedCount = entries.filter(e => e.status === 'approved' && (!userRegion || users.find(u => u.id === e.userId)?.territory.region === userRegion)).length;
  const pendingCount = entries.filter(e => e.status === 'pending' && (!userRegion || users.find(u => u.id === e.userId)?.territory.region === userRegion)).length;
  const rejectedCount = entries.filter(e => e.status === 'rejected' && (!userRegion || users.find(u => u.id === e.userId)?.territory.region === userRegion)).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total PO Budget" value={formatLakhs(totalBudget)} sub={`${activePOs.length} active POs`} color="#1B4F72" />
        <KpiCard label="Total Utilized" value={formatLakhs(totalSpent)} sub={`${pct(totalSpent, totalBudget)}% used`} color="#16A34A"  />
        <KpiCard label="Unutilized" value={formatLakhs(unutilized)} sub={`+ ₹${(totalPending/1000).toFixed(0)}K pending`} color="#B45309" />
        <KpiCard label="Active Regions" value={regionData.length.toString()} sub={`${approvedCount} approved entries`} color="#6D28D9"  />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <CardTitle>Product-wise Budget vs Utilization</CardTitle>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prodData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F4F8" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}K`} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Budget" fill="#DBEAFE" radius={[4, 4, 0, 0]} name="Budget" />
                <Bar dataKey="Spent" fill="#1B4F72" radius={[4, 4, 0, 0]} name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <CardTitle>Budget Split by Product</CardTitle>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={prodData} dataKey="Budget" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4}>
                  {prodData.map((_, i) => <Cell key={i} fill={PROD_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 8, border: 'none', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {prodData.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PROD_COLORS[i] }} />
                  <span className="text-[#374151] font-medium">{p.name}</span>
                </div>
                <span className="font-bold text-[#1A1D23]">{formatLakhs(p.Budget)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <CardTitle>
          Regional Performance
          <div className="flex gap-2 text-xs font-semibold">
            <span className="text-green-600"> {approvedCount} approved</span>
            <span className="text-amber-600"> {pendingCount} pending</span>
            <span className="text-red-600"> {rejectedCount} rejected</span>
          </div>
        </CardTitle>
        <Table>
          <thead>
            <tr>
              <Th>Region</Th><Th>Manager</Th><Th>Budget</Th><Th>Spent (Approved)</Th><Th>Pending</Th><Th>Balance</Th><Th>Utilization</Th>
            </tr>
          </thead>
          <tbody>
            {regionData.map(r => (
              <tr key={r.name} className="hover:bg-[#F8FAFC]">
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                    <span className="font-bold text-[#1B4F72]">{r.name}</span>
                  </div>
                </Td>
                <Td className="text-[#6B7280]">{r.manager}</Td>
                <Td className="font-semibold">{formatCurrency(r.budget)}</Td>
                <Td className="font-bold text-green-700">{formatCurrency(r.spent)}</Td>
                <Td className="text-amber-700">{r.pending > 0 ? formatCurrency(r.pending) : '—'}</Td>
                <Td className={r.balance < 0 ? 'font-bold text-red-600' : 'font-semibold'}>{formatCurrency(r.balance)}</Td>
                <Td>
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <ProgressBar value={r.utilPct} className="flex-1" />
                    <span className="text-xs font-bold text-[#374151] w-9 text-right">{r.utilPct}%</span>
                  </div>
                </Td>
              </tr>
            ))}
            {regionData.length === 0 && (
              <tr><Td colSpan={7} className="text-center py-8 text-[#9CA3AF]">No region data available for your scope.</Td></tr>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
