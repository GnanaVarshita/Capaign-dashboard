import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, ProgressBar, Table, Th, Td, Badge, cn } from '../../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, pct } from '../../lib/mock-data';

export default function ActivitiesTab() {
  const { getVisiblePOs, calcLiveSpent, products, activities } = useAppContext();
  const pos = getVisiblePOs().filter(p => p.approvalStatus === 'approved');
  const [selectedPO, setSelectedPO] = useState(pos[0]?.poNumber || '');

  const po = pos.find(p => p.poNumber === selectedPO) || pos[0];

  const chartData = useMemo(() => {
    if (!po) return [];
    return activities.map(act => {
      const budget = products.reduce((s, prod) => {
        return s + Object.values(po.allocations || {}).reduce((rs, r) => {
          return rs + ((r[prod] || {})[act] || 0);
        }, 0);
      }, 0);
      const spent = calcLiveSpent({ po: po.poNumber, activity: act });
      return { name: act, Budget: budget, Spent: spent };
    }).filter(d => d.Budget > 0 || d.Spent > 0);
  }, [po, activities, products, calcLiveSpent]);

  const tableData = useMemo(() => {
    if (!po) return [];
    const rows: { product: string; activity: string; budget: number; spent: number }[] = [];
    products.forEach(prod => {
      activities.forEach(act => {
        const budget = Object.values(po.allocations || {}).reduce((s, r) => {
          return s + ((r[prod] || {})[act] || 0);
        }, 0);
        const spent = calcLiveSpent({ po: po.poNumber, product: prod, activity: act });
        if (budget > 0 || spent > 0) rows.push({ product: prod, activity: act, budget, spent });
      });
    });
    return rows;
  }, [po, products, activities, calcLiveSpent]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {pos.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedPO(p.poNumber)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
              selectedPO === p.poNumber ? 'bg-[#1B4F72] text-white border-[#1B4F72]' : 'bg-white text-[#374151] border-[#DDE3ED] hover:border-[#1B4F72]'
            )}
          >{p.poNumber}</button>
        ))}
      </div>

      {po && (
        <>
          <Card className="p-6">
            <CardTitle>Activity Budget vs Spend — {po.poNumber}</CardTitle>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0F4F8" />
                  <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}K`} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={110} tick={{ fontSize: 12, fill: '#374151' }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }} />
                  <Bar dataKey="Budget" fill="#DBEAFE" radius={[0, 4, 4, 0]} name="Budget" />
                  <Bar dataKey="Spent" fill="#1B4F72" radius={[0, 4, 4, 0]} name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <CardTitle>Detailed Breakdown</CardTitle>
            <Table>
              <thead>
                <tr>
                  <Th>Activity</Th><Th>Product</Th><Th>Budget</Th><Th>Spent</Th><Th>Balance</Th><Th>Utilization</Th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr><Td colSpan={6} className="text-center py-8 text-[#9CA3AF]">No activity data available for this PO.</Td></tr>
                ) : (
                  tableData.map((row, i) => {
                    const balance = row.budget - row.spent;
                    const utilPct = pct(row.spent, row.budget);
                    return (
                      <tr key={i} className="hover:bg-[#F8FAFC]">
                        <Td className="font-semibold">{row.activity}</Td>
                        <Td><Badge variant="blue">{row.product}</Badge></Td>
                        <Td>{formatCurrency(row.budget)}</Td>
                        <Td className="font-bold text-green-700">{formatCurrency(row.spent)}</Td>
                        <Td className={balance < 0 ? 'font-bold text-red-600' : 'text-[#374151]'}>{formatCurrency(balance)}</Td>
                        <Td>
                          <div className="flex items-center gap-2 min-w-[90px]">
                            <ProgressBar value={utilPct} className="flex-1" />
                            <span className="text-xs font-bold w-8 text-right">{utilPct}%</span>
                          </div>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
