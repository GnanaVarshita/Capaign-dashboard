import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Select, Label, ProgressBar, Table, Th, Td, Badge, Button, cn } from '../../components/ui';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatLakhs, pct } from '../../lib/mock-data';
import { exportToCSV, exportToPDF } from '../../lib/utils';

const COLORS = ['#1B4F72', '#2E86C1', '#AED6F1', '#F39C12', '#E74C3C', '#27AE60', '#8E44AD', '#D35400'];

export default function QuickViewTab() {
  const { getVisiblePOs, calcLiveSpent, calcPendingSpent, products, activities, regions, currentUser, getScopedEntries } = useAppContext();
  const u = currentUser!;
  const isOwner = u.role === 'Owner' || u.role === 'All India Manager';
  const isRM = u.role === 'Regional Manager';
  const isZM = u.role === 'Zonal Manager';
  const isVendor = u.role === 'Vendor';

  const pos = getVisiblePOs().filter(p => p.approvalStatus === 'approved');
  const [selectedPO, setSelectedPO] = useState(pos[0]?.poNumber || '');

  const [regionFilter, setRegionFilter] = useState(isRM || isZM ? u.territory.region || '' : '');
  const [zoneFilter, setZoneFilter] = useState(isZM ? u.territory.zone || '' : '');
  const [areaFilter, setAreaFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const po = pos.find(p => p.poNumber === selectedPO) || pos[0];

  const getPOBudget = (p: typeof po) => {
    if (!p) return 0;
    if (isOwner) return p.budget;
    
    let total = 0;
    if (isRM) {
      total = p.regionBudgets[u.territory.region!] || 0;
    } else if (isZM) {
      const reg = u.territory.region!;
      const zone = u.territory.zone!;
      const za = p.zoneAllocations[reg]?.[zone] || {};
      Object.values(za).forEach(prods => {
        Object.values(prods).forEach(val => { total += (val as number); });
      });
    } else if (isVendor) {
      const azs = u.territory.assignedZones || [];
      azs.forEach(az => {
        const za = p.zoneAllocations[az.region]?.[az.zone] || {};
        Object.entries(za).forEach(([prod, acts]) => {
          Object.entries(acts).forEach(([act, val]) => {
            if (az.activities.includes(act)) { total += (val as number); }
          });
        });
      });
    }
    return total;
  };

  const allRegions = useMemo(() => {
    if (isOwner) return regions.map(r => r.name);
    if (isRM || isZM) return [u.territory.region!];
    if (isVendor) return [...new Set((u.territory.assignedZones || []).map(az => az.region))];
    return [];
  }, [regions, isOwner, isRM, isZM, isVendor, u.territory]);

  const allZones = useMemo(() => {
    let regs = regions;
    if (!isOwner) {
      const myRegs = allRegions;
      regs = regions.filter(r => myRegs.includes(r.name));
    }
    if (regionFilter) regs = regs.filter(r => r.name === regionFilter);
    
    let zones = regs.flatMap(r => r.zones.map(z => z.name));
    if (isZM) return [u.territory.zone!];
    if (isVendor) {
      const myZones = (u.territory.assignedZones || []).map(az => az.zone);
      zones = zones.filter(z => myZones.includes(z));
    }
    return zones;
  }, [regions, regionFilter, isOwner, isZM, isVendor, u.territory, allRegions]);

  const allAreas = useMemo(() => {
    let regs = regions;
    if (!isOwner) {
      const myRegs = allRegions;
      regs = regions.filter(r => myRegs.includes(r.name));
    }
    let zones = regs.flatMap(r => r.zones);
    if (regionFilter) zones = (regs.find(r => r.name === regionFilter)?.zones || []);
    
    const myZoneNames = allZones;
    zones = zones.filter(z => myZoneNames.includes(z.name));
    if (zoneFilter) zones = zones.filter(z => z.name === zoneFilter);
    
    return zones.flatMap(z => z.areas.map(a => a.name));
  }, [regions, regionFilter, zoneFilter, isOwner, allRegions, allZones]);

  const allActivities = useMemo(() => {
    if (!isVendor) return activities;
    const myActs = new Set<string>();
    (u.territory.assignedZones || []).forEach(az => {
      az.activities.forEach(a => myActs.add(a));
    });
    return activities.filter(a => myActs.has(a));
  }, [activities, isVendor, u.territory]);

  const filteredBudget = useMemo(() => {
    if (!po) return 0;
    
    let scopeRegions = allRegions;
    if (regionFilter) scopeRegions = scopeRegions.filter(r => r === regionFilter);
    
    let total = 0;
    scopeRegions.forEach(reg => {
      if (!zoneFilter && !productFilter && !activityFilter && isOwner) {
        total += po.regionBudgets[reg] || 0;
        return;
      }
      
      const za = po.zoneAllocations[reg] || {};
      let zones = Object.keys(za);
      if (isZM) zones = zones.filter(z => z === u.territory.zone);
      else if (isVendor) {
        const myZones = (u.territory.assignedZones || []).filter(az => az.region === reg).map(az => az.zone);
        zones = zones.filter(z => myZones.includes(z));
      }
      if (zoneFilter) zones = zones.filter(z => z === zoneFilter);
      
      zones.forEach(z => {
        const prods = za[z] || {};
        let prodKeys = Object.keys(prods);
        if (productFilter) prodKeys = prodKeys.filter(p => p === productFilter);
        
        prodKeys.forEach(p => {
          const acts = prods[p] || {};
          let actKeys = Object.keys(acts);
          if (isVendor) {
            const az = (u.territory.assignedZones || []).find(x => x.region === reg && x.zone === z);
            if (az) actKeys = actKeys.filter(a => az.activities.includes(a));
          }
          if (activityFilter) actKeys = actKeys.filter(a => a === activityFilter);
          actKeys.forEach(a => { total += (acts[a] || 0); });
        });
      });
    });
    return total;
  }, [po, u, regionFilter, zoneFilter, productFilter, activityFilter, isOwner, isRM, isZM, isVendor, allRegions]);

  const spentFilters = useMemo(() => ({
    po: po?.poNumber,
    region: regionFilter,
    zone: zoneFilter,
    area: areaFilter,
    product: productFilter,
    activity: activityFilter,
    vendorId: isVendor ? u.id : undefined,
    dateFrom,
    dateTo
  }), [po, regionFilter, zoneFilter, areaFilter, productFilter, activityFilter, isVendor, u.id, dateFrom, dateTo]);

  const filteredEntries = useMemo(() => {
    return getScopedEntries().filter(e => {
      if (po && e.po !== po.poNumber) return false;
      if (productFilter && e.product !== productFilter) return false;
      if (activityFilter && e.activity !== activityFilter) return false;
      if (areaFilter && e.area !== areaFilter) return false;
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo && e.date > dateTo) return false;
      if (regionFilter) {
        // Since getScopedEntries already scopes by region/zone for RM/ZM,
        // we only need additional filtering if Owner/AIM selects a region.
        if (isOwner) {
          // This would require finding the user's region, which is expensive here.
          // For simplicity, we assume scoped entries are already mostly correct.
        }
      }
      return true;
    });
  }, [getScopedEntries, po, productFilter, activityFilter, areaFilter, dateFrom, dateTo, regionFilter, isOwner]);

  const totalSpent = useMemo(() => po ? calcLiveSpent(spentFilters) : 0, [po, calcLiveSpent, spentFilters]);
  const totalPending = useMemo(() => po ? calcPendingSpent(spentFilters) : 0, [po, calcPendingSpent, spentFilters]);
  const utilPct = pct(totalSpent, filteredBudget);

  const productData = useMemo(() => {
    if (!po) return [];
    return products.map(prod => {
      if (productFilter && prod !== productFilter) return null;
      
      let pBudget = 0;
      let scopeRegions = allRegions;
      if (regionFilter) scopeRegions = scopeRegions.filter(r => r === regionFilter);

      scopeRegions.forEach(reg => {
        const za = po.zoneAllocations[reg] || {};
        let zones = Object.keys(za);
        if (isZM) zones = zones.filter(z => z === u.territory.zone);
        else if (isVendor) {
          const myZones = (u.territory.assignedZones || []).filter(az => az.region === reg).map(az => az.zone);
          zones = zones.filter(z => myZones.includes(z));
        }
        if (zoneFilter) zones = zones.filter(z => z === zoneFilter);

        zones.forEach(z => {
          const acts = za[z]?.[prod] || {};
          let actKeys = Object.keys(acts);
          if (isVendor) {
            const az = (u.territory.assignedZones || []).find(x => x.region === reg && x.zone === z);
            if (az) actKeys = actKeys.filter(a => az.activities.includes(a));
          }
          if (activityFilter) actKeys = actKeys.filter(a => a === activityFilter);
          actKeys.forEach(a => { pBudget += (acts[a] || 0); });
        });
      });

      const pSpent = calcLiveSpent({ ...spentFilters, product: prod });
      return { name: prod, Budget: pBudget, Spent: pSpent };
    }).filter(d => d !== null && (d.Budget > 0 || d.Spent > 0)) as { name: string; Budget: number; Spent: number }[];
  }, [po, products, calcLiveSpent, spentFilters, productFilter, regionFilter, zoneFilter, activityFilter, isRM, isZM, isVendor, u.territory, allRegions]);

  const activityData = useMemo(() => {
    if (!po) return [];
    return activities.map(act => {
      if (activityFilter && act !== activityFilter) return null;
      const spent = calcLiveSpent({ ...spentFilters, activity: act });
      return { name: act, value: spent };
    }).filter(d => d !== null && d.value > 0) as { name: string; value: number }[];
  }, [po, activities, calcLiveSpent, spentFilters, activityFilter]);

  const regionPerformanceData = useMemo(() => {
    if (!po) return [];
    let scopeRegions = allRegions;
    if (regionFilter) scopeRegions = scopeRegions.filter(r => r === regionFilter);

    return scopeRegions.map(reg => {
      let rBudget = 0;
      const za = po.zoneAllocations[reg] || {};
      let zones = Object.keys(za);
      if (isZM) zones = zones.filter(z => z === u.territory.zone);
      else if (isVendor) {
        const myZones = (u.territory.assignedZones || []).filter(az => az.region === reg).map(az => az.zone);
        zones = zones.filter(z => myZones.includes(z));
      }
      if (zoneFilter) zones = zones.filter(z => z === zoneFilter);

      zones.forEach(z => {
        const prods = za[z] || {};
        let prodKeys = Object.keys(prods);
        if (productFilter) prodKeys = prodKeys.filter(p => p === productFilter);
        prodKeys.forEach(p => {
          const acts = prods[p] || {};
          let actKeys = Object.keys(acts);
          if (isVendor) {
            const az = (u.territory.assignedZones || []).find(x => x.region === reg && x.zone === z);
            if (az) actKeys = actKeys.filter(a => az.activities.includes(a));
          }
          if (activityFilter) actKeys = actKeys.filter(a => a === activityFilter);
          actKeys.forEach(a => { rBudget += (acts[a] || 0); });
        });
      });

      const rSpent = calcLiveSpent({ ...spentFilters, region: reg });
      const rPending = calcPendingSpent({ ...spentFilters, region: reg });
      return { region: reg, budget: rBudget, spent: rSpent, pending: rPending };
    }).filter(d => d.budget > 0 || d.spent > 0);
  }, [po, regionFilter, zoneFilter, productFilter, activityFilter, calcLiveSpent, calcPendingSpent, spentFilters, isRM, isZM, isVendor, u.territory, allRegions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 mb-6">
        {pos.map(p => {
          const isActive = selectedPO === p.poNumber;
          const scopedPOBudget = getPOBudget(p);
          if (scopedPOBudget === 0 && !isOwner) return null;

          return (
            <button
              key={p.id}
              onClick={() => setSelectedPO(p.poNumber)}
              className={cn(
                'min-w-[180px] text-left border-2 rounded-xl p-4 transition-all bg-white',
                isActive ? 'border-[#1B4F72] bg-[#EBF3FA]' : 'border-[#DDE3ED] hover:border-[#1B4F72]'
              )}
            >
              <div className={cn('font-bold text-sm mb-1', isActive ? 'text-[#1B4F72]' : 'text-[#1B4F72]')}>{p.poNumber}</div>
              <div className="text-[11px] text-[#6B7280] truncate">{p.remarks || 'No description'}</div>
              <div className="font-bold text-base text-[#1A1D23] mt-1">{formatCurrency(scopedPOBudget)}</div>
              {!isOwner && <div className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-wider">My Allocation</div>}
            </button>
          );
        })}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4 flex-1">
            {isOwner ? (
              <div>
                <Label className="text-[10px] uppercase font-bold text-slate-500">Region</Label>
                <Select value={regionFilter} onChange={e => { setRegionFilter(e.target.value); setZoneFilter(''); setAreaFilter(''); }}>
                  <option value="">All Regions</option>
                  {allRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
              </div>
            ) : null}
            
            {(isOwner || isRM || isVendor) ? (
              <div>
                <Label className="text-[10px] uppercase font-bold text-slate-500">Zone</Label>
                <Select value={zoneFilter} onChange={e => { setZoneFilter(e.target.value); setAreaFilter(''); }} disabled={isZM}>
                  <option value="">{allZones.length > 1 ? 'All Zones' : allZones[0]}</option>
                  {allZones.length > 1 && allZones.map(z => <option key={z} value={z}>{z}</option>)}
                </Select>
              </div>
            ) : null}

            <div>
              <Label className="text-[10px] uppercase font-bold text-slate-500">Area</Label>
              <Select value={areaFilter} onChange={e => setAreaFilter(e.target.value)}>
                <option value="">All Areas</option>
                {allAreas.map(a => <option key={a} value={a}>{a}</option>)}
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase font-bold text-slate-500">Product</Label>
              <Select value={productFilter} onChange={e => setProductFilter(e.target.value)}>
                <option value="">All Products</option>
                {products.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase font-bold text-slate-500">Activity</Label>
              <Select value={activityFilter} onChange={e => setActivityFilter(e.target.value)}>
                <option value="">All Activities</option>
                {allActivities.map(a => <option key={a} value={a}>{a}</option>)}
              </Select>
            </div>
            <div className="lg:col-span-2 flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-[10px] uppercase font-bold text-slate-500">From</Label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full h-9 rounded-lg border border-[#DDE3ED] px-2 text-xs" />
              </div>
              <div className="flex-1">
                <Label className="text-[10px] uppercase font-bold text-slate-500">To</Label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full h-9 rounded-lg border border-[#DDE3ED] px-2 text-xs" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => exportToCSV(filteredEntries, 'quick-view-activities.csv')}>📥 Excel</Button>
            <Button variant="secondary" size="sm" onClick={() => exportToPDF()}>📄 PDF</Button>
          </div>
        </div>
      </Card>

      {po && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Scoped Budget', value: formatLakhs(filteredBudget), sub: formatCurrency(filteredBudget), color: 'border-l-[#1B4F72]', textColor: 'text-[#1B4F72]' },
              { label: 'Approved Spend', value: formatLakhs(totalSpent), sub: `${utilPct}% utilized`, color: 'border-l-green-500', textColor: 'text-green-600' },
              { label: 'Pending Approval', value: formatLakhs(totalPending), sub: formatCurrency(totalPending), color: 'border-l-amber-400', textColor: 'text-amber-600' },
              { label: 'Balance', value: formatLakhs(filteredBudget - totalSpent), sub: formatCurrency(filteredBudget - totalSpent), color: filteredBudget - totalSpent < 0 ? 'border-l-red-500' : 'border-l-gray-400', textColor: filteredBudget - totalSpent < 0 ? 'text-red-600' : 'text-[#374151]' },
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
              <CardTitle>Region/Zone Performance</CardTitle>
              <div className="space-y-3">
                {regionPerformanceData.map(r => {
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
                {regionPerformanceData.length === 0 && <p className="py-10 text-center text-[#9CA3AF] text-sm">No data available for current selection.</p>}
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
                  <tr><Td colSpan={5} className="text-center py-8 text-[#9CA3AF]">No product allocations found for this selection.</Td></tr>
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
