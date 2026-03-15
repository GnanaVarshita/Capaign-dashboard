import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, ProgressBar, Table, Th, Td, Badge } from '../../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, formatLakhs } from '../../lib/mock-data';
import { Activity, IndianRupee, MapPin, TrendingUp } from 'lucide-react';

export function OverviewTab() {
  const { pos, calcLiveSpent, getVisiblePOs, currentUser, regions } = useAppContext();
  
  const visiblePOs = getVisiblePOs();
  const activePOs = visiblePOs.filter(p => p.status === 'Active' || p.status === 'Expiring Soon');
  
  const totalBudget = activePOs.reduce((sum, po) => sum + po.budget, 0);
  const totalUtilized = activePOs.reduce((sum, po) => sum + calcLiveSpent({ po: po.poNumber }), 0);
  const unutilized = totalBudget - totalUtilized;

  const productData = useMemo(() => {
    return ['Product A', 'Product B', 'Product C'].map(prod => {
      const budget = activePOs.reduce((sum, po) => {
        let b = 0;
        Object.values(po.allocations).forEach(r => {
          if (r[prod]) Object.values(r[prod]).forEach(v => b += v);
        });
        return sum + b;
      }, 0);
      const spent = calcLiveSpent({ product: prod });
      return { name: prod, Budget: budget, Spent: spent };
    });
  }, [activePOs, calcLiveSpent]);

  const COLORS = ['#1B4F72', '#2E7D32', '#B45309'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total PO Budget', value: formatCurrency(totalBudget), icon: <IndianRupee className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Total Utilized', value: formatCurrency(totalUtilized), icon: <TrendingUp className="w-6 h-6 text-green-600" />, bg: 'bg-green-50' },
          { label: 'Unutilized Budget', value: formatCurrency(unutilized), icon: <Activity className="w-6 h-6 text-amber-600" />, bg: 'bg-amber-50' },
          { label: 'Active Regions', value: regions.length.toString(), icon: <MapPin className="w-6 h-6 text-purple-600" />, bg: 'bg-purple-50' }
        ].map((kpi, i) => (
          <Card key={i} className="p-5 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
            <div className={`p-4 rounded-2xl ${kpi.bg}`}>{kpi.icon}</div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">{kpi.label}</p>
              <p className="text-2xl font-black text-foreground mt-1">{kpi.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <CardTitle>Product-wise Budget vs Utilization</CardTitle>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}K`} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="Budget" fill="#E0E7FF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" fill="#1B4F72" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <CardTitle>Budget Split</CardTitle>
          <div className="h-[250px] mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={productData} dataKey="Budget" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {productData.map((p, i) => (
              <div key={p.name} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {p.name}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Regions Table */}
      <Card className="p-6">
        <CardTitle>Regional Performance</CardTitle>
        <Table>
          <thead>
            <tr><Th>Region</Th><Th>Budget</Th><Th>Spent</Th><Th>Balance</Th><Th>Utilization</Th></tr>
          </thead>
          <tbody>
            {regions.map(r => {
              const rBudget = activePOs.reduce((sum, po) => sum + (po.regionBudgets[r.name] || 0), 0);
              const rSpent = calcLiveSpent({ region: r.name });
              const rPct = rBudget > 0 ? Math.round((rSpent/rBudget)*100) : 0;
              if (rBudget === 0) return null;
              return (
                <tr key={r.name} className="group">
                  <Td className="font-bold text-primary">{r.name}</Td>
                  <Td>{formatCurrency(rBudget)}</Td>
                  <Td className="font-bold text-green-600">{formatCurrency(rSpent)}</Td>
                  <Td>{formatCurrency(rBudget - rSpent)}</Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-24"><ProgressBar value={rPct} colorClass={rPct > 90 ? 'bg-red-500' : 'bg-primary'} /></div>
                      <span className="text-xs font-bold text-muted-foreground">{rPct}%</span>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

export function ActivitiesTab() {
  const { pos, calcLiveSpent, products, activities } = useAppContext();
  const po = pos[0]; // Simplified for prototype
  
  if (!po) return <div>No PO data</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-6">
        <CardTitle>Activity Budget vs Spend — {po.poNumber}</CardTitle>
        <Table>
          <thead>
            <tr><Th>Activity</Th><Th>Product</Th><Th>Budget</Th><Th>Spent</Th><Th>Balance</Th><Th>Progress</Th></tr>
          </thead>
          <tbody>
            {products.map(prod => activities.map(act => {
              const spent = calcLiveSpent({ po: po.poNumber, product: prod, activity: act });
              // Mock budget for display since deep structure varies
              const budget = 100000; 
              const pct = Math.round((spent/budget)*100);
              if (spent === 0) return null;
              
              return (
                <tr key={`${prod}-${act}`}>
                  <Td className="font-medium">{act}</Td>
                  <Td><Badge variant="blue">{prod}</Badge></Td>
                  <Td>{formatCurrency(budget)}</Td>
                  <Td className="font-bold text-green-600">{formatCurrency(spent)}</Td>
                  <Td>{formatCurrency(budget - spent)}</Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-20"><ProgressBar value={pct} /></div>
                      <span className="text-xs font-bold">{pct}%</span>
                    </div>
                  </Td>
                </tr>
              );
            }))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
