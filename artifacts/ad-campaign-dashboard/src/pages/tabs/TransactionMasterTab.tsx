import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Table, Th, Td, Badge, StatusBadge, SearchInput, Select, Label, Button, cn } from '../../components/ui';
import { formatCurrency } from '../../lib/mock-data';
import { exportToExcel, exportToPDF } from '../../lib/utils';

export default function TransactionMasterTab() {
  const { entries, getVisiblePOs, users, currentUser } = useAppContext();
  const u = currentUser!;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [poFilter, setPOFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [areaManagerFilter, setAreaManagerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const scopedEntries = useMemo(() => {
    if (u.role === 'Owner' || u.role === 'All India Manager') return entries;
    if (u.role === 'Regional Manager') return entries.filter(e => {
      const eu = users.find(x => x.id === e.userId);
      return eu?.territory?.region === u.territory?.region || e.rmId === u.id;
    });
    if (u.role === 'Zonal Manager') return entries.filter(e => {
      const eu = users.find(x => x.id === e.userId);
      return eu?.territory?.zone === u.territory?.zone || e.zmId === u.id;
    });
    if (u.role === 'Area Manager') return entries.filter(e => e.userId === u.id);
    return entries.filter(e => e.vendorId === u.id);
  }, [entries, u, users]);

  const allPOs = useMemo(() => [...new Set(scopedEntries.map(e => e.po))], [scopedEntries]);
  const allProducts = useMemo(() => [...new Set(scopedEntries.map(e => e.product))], [scopedEntries]);
  const allRegions = useMemo(() => [...new Set(users.filter(x => x.territory?.region).map(x => x.territory!.region!))], [users]);
  const allAreas = useMemo(() => [...new Set(scopedEntries.filter(e => e.area).map(e => e.area))], [scopedEntries]);
  const areaManagers = useMemo(() => users.filter(x => x.role === 'Area Manager'), [users]);

  const filtered = useMemo(() => {
    return scopedEntries.filter(e => {
      if (statusFilter && e.status !== statusFilter) return false;
      if (poFilter && e.po !== poFilter) return false;
      if (productFilter && e.product !== productFilter) return false;
      if (areaFilter && e.area !== areaFilter) return false;
      if (areaManagerFilter && e.userId !== areaManagerFilter) return false;
      if (regionFilter) {
        const eu = users.find(x => x.id === e.userId);
        if (eu?.territory?.region !== regionFilter) return false;
      }
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo && e.date > dateTo) return false;
      if (search) {
        const q = search.toLowerCase();
        if (![e.area, e.pin, e.po, e.product, e.activity, e.vendorName, e.description, e.userName, e.zmName, e.rmName].join(' ').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [scopedEntries, statusFilter, poFilter, productFilter, areaFilter, regionFilter, dateFrom, dateTo, search, users]);

  const totals = useMemo(() => ({
    all: filtered.reduce((s, e) => s + e.amount, 0),
    approved: filtered.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0),
    pending: filtered.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0),
    rejected: filtered.filter(e => e.status === 'rejected').reduce((s, e) => s + e.amount, 0),
  }), [filtered]);

  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('flat');

  const groupedData = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(e => {
      const key = e.po; // Group by PO
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return Object.entries(groups).map(([po, entries]) => ({
      po, entries,
      total: entries.reduce((s, e) => s + e.amount, 0),
      approved: entries.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0),
      pending: entries.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0)
    }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: `All (${filtered.length})`, value: totals.all, color: 'border-l-[#1B4F72]', textColor: 'text-[#1B4F72]' },
          { label: 'Approved', value: totals.approved, color: 'border-l-green-500', textColor: 'text-green-600' },
          { label: 'Pending', value: totals.pending, color: 'border-l-amber-400', textColor: 'text-amber-600' },
          { label: 'Rejected', value: totals.rejected, color: 'border-l-red-500', textColor: 'text-red-600' },
        ].map(k => (
          <Card key={k.label} className={`p-4 border-l-4 ${k.color}`}>
            <p className="text-xs text-[#6B7280] font-semibold mb-1">{k.label}</p>
            <p className={`text-lg font-black ${k.textColor}`}>{formatCurrency(k.value)}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('flat')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all', viewMode === 'flat' ? 'bg-[#1B4F72] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
            >
              Flat List
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all', viewMode === 'grouped' ? 'bg-[#1B4F72] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
            >
              Group by PO
            </button>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => exportToExcel(filtered, 'transactions.xls')}>📥 Excel</Button>
            <Button variant="secondary" size="sm" onClick={() => exportToPDF(filtered, 'Transaction Ledger')}>📄 PDF</Button>
            <SearchInput value={search} onChange={setSearch} placeholder="Search transactions..." />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-36">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
          <Select value={poFilter} onChange={e => setPOFilter(e.target.value)} className="w-44">
            <option value="">All POs</option>
            {allPOs.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
          <Select value={productFilter} onChange={e => setProductFilter(e.target.value)} className="w-40">
            <option value="">All Products</option>
            {allProducts.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
          <Select value={areaManagerFilter} onChange={e => setAreaManagerFilter(e.target.value)} className="w-44">
            <option value="">All Area Managers</option>
            {areaManagers.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
          <Select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} className="w-36">
            <option value="">All Areas</option>
            {allAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </Select>
          {(u.role === 'Owner' || u.role === 'All India Manager') && (
            <Select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="w-32">
              <option value="">All Regions</option>
              {allRegions.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
          )}
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 rounded-lg border border-[#DDE3ED] px-2 text-xs text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1B4F72]/30" />
            <span className="text-[#9CA3AF] text-xs">→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 rounded-lg border border-[#DDE3ED] px-2 text-xs text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1B4F72]/30" />
          </div>
          {(statusFilter || poFilter || productFilter || areaFilter || regionFilter || areaManagerFilter || dateFrom || dateTo || search) && (
            <button onClick={() => { setStatusFilter(''); setPOFilter(''); setProductFilter(''); setAreaFilter(''); setAreaManagerFilter(''); setRegionFilter(''); setDateFrom(''); setDateTo(''); setSearch(''); }} className="text-xs text-red-500 hover:text-red-700 font-semibold underline">
              Clear Filters
            </button>
          )}
        </div>
      </Card>

      {viewMode === 'flat' ? (
        <Card className="p-6">
          <CardTitle>Transaction Ledger ({filtered.length} records)</CardTitle>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>#</Th><Th>Date</Th><Th>Submitted By</Th><Th>Area</Th><Th>PIN</Th><Th>PO</Th><Th>ZM</Th><Th>RM</Th><Th>Vendor</Th><Th>Product</Th><Th>Activity</Th><Th>Amount</Th><Th>Description</Th><Th>Status</Th><Th>Decided By</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><Td colSpan={15} className="text-center py-12 text-[#9CA3AF]">No transactions found with current filters.</Td></tr>
                ) : filtered.map((e, i) => (
                  <tr key={e.id} className="hover:bg-[#F8FAFC]">
                    <Td className="text-[#9CA3AF] text-xs">{i + 1}</Td>
                    <Td className="whitespace-nowrap text-xs">{e.date}</Td>
                    <Td>
                      <div className="font-medium text-sm">{e.userName}</div>
                      <div className="text-[9px] text-[#9CA3AF]">{e.userRole}</div>
                    </Td>
                    <Td className="text-xs">{e.area || '—'}</Td>
                    <Td className="font-mono text-xs text-[#9CA3AF]">{e.pin || '—'}</Td>
                    <Td className="font-bold text-[#1B4F72] whitespace-nowrap">{e.po}</Td>
                    <Td className="text-xs text-purple-600">{e.zmName || '—'}</Td>
                    <Td className="text-xs text-blue-600">{e.rmName || '—'}</Td>
                    <Td className="text-xs">{e.vendorName || '—'}</Td>
                    <Td><Badge variant="blue">{e.product}</Badge></Td>
                    <Td className="text-xs whitespace-nowrap">{e.activity}</Td>
                    <Td className="font-bold text-[#1B4F72] whitespace-nowrap">{formatCurrency(e.amount)}</Td>
                    <Td className="max-w-[160px] text-xs text-[#6B7280]" title={e.description}>
                      <span className="line-clamp-2">{e.description}</span>
                    </Td>
                    <Td><StatusBadge status={e.status} /></Td>
                    <Td>
                      <div className="text-xs font-bold text-[#1A1D23]">{e.decidedBy || '—'}</div>
                      {e.decidedByDesignation && <div className="text-[9px] text-[#9CA3AF] uppercase font-bold">{e.decidedByDesignation}</div>}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedData.length === 0 ? (
            <Card className="p-12 text-center text-[#9CA3AF]">No transactions found.</Card>
          ) : groupedData.map(group => (
            <Card key={group.po} className="overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-[#1B4F72] shadow-sm">PO</div>
                  <div>
                    <div className="font-bold text-[#1B4F72]">{group.po}</div>
                    <div className="text-xs text-slate-500">{group.entries.length} transactions</div>
                  </div>
                </div>
                <div className="flex gap-6 text-right">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</div>
                    <div className="font-bold text-[#1B4F72]">{formatCurrency(group.total)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved</div>
                    <div className="font-bold text-green-600">{formatCurrency(group.approved)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending</div>
                    <div className="font-bold text-amber-600">{formatCurrency(group.pending)}</div>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table className="border-0 rounded-none">
                  <thead>
                    <tr>
                      <Th>Date</Th><Th>User</Th><Th>Product</Th><Th>Activity</Th><Th>Amount</Th><Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.entries.map(e => (
                      <tr key={e.id} className="hover:bg-[#F8FAFC]">
                        <Td className="text-xs whitespace-nowrap">{e.date}</Td>
                        <Td className="text-xs">{e.userName}</Td>
                        <Td><Badge variant="blue">{e.product}</Badge></Td>
                        <Td className="text-xs">{e.activity}</Td>
                        <Td className="font-bold">{formatCurrency(e.amount)}</Td>
                        <Td><StatusBadge status={e.status} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
