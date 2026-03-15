import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Table, Th, Td, Badge, StatusBadge, SearchInput, Select, InfoBanner, cn } from '../../components/ui';
import { formatCurrency } from '../../lib/mock-data';

export default function VendorSectionTab() {
  const { users, entries, currentUser } = useAppContext();
  const u = currentUser!;
  const isVendor = u.role === 'Vendor';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [poFilter, setPOFilter] = useState('');

  const scopedEntries = useMemo(() => {
    if (isVendor) return entries.filter(e => e.vendorId === u.id);
    if (u.role === 'Area Manager') return entries.filter(e => e.userId === u.id);
    if (u.role === 'Zonal Manager') return entries.filter(e => {
      const eu = users.find(x => x.id === e.userId);
      return eu?.territory?.zone === u.territory?.zone || e.zmId === u.id;
    });
    if (u.role === 'Regional Manager') return entries.filter(e => {
      const eu = users.find(x => x.id === e.userId);
      return eu?.territory?.region === u.territory?.region || e.rmId === u.id;
    });
    return entries;
  }, [entries, u, users, isVendor]);

  const allPOs = [...new Set(scopedEntries.map(e => e.po))];
  const vendorUsers = users.filter(x => x.role === 'Vendor');

  const filtered = scopedEntries.filter(e => {
    if (statusFilter && e.status !== statusFilter) return false;
    if (poFilter && e.po !== poFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (![e.area, e.pin, e.po, e.product, e.activity, e.vendorName, e.description, e.userName].join(' ').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const grouped = useMemo(() => {
    const map: Record<string, { vendor: any; entries: typeof filtered; approved: number; pending: number; rejected: number }> = {};
    filtered.forEach(e => {
      const key = e.vendorId || `legacy-${e.vendorName}`;
      if (!map[key]) {
        const vUser = vendorUsers.find(v => v.id === e.vendorId);
        map[key] = { vendor: vUser || { name: e.vendorName, territory: { tradeName: e.vendorName, vendorCode: e.vendorCode } }, entries: [], approved: 0, pending: 0, rejected: 0 };
      }
      map[key].entries.push(e);
      if (e.status === 'approved') map[key].approved += e.amount;
      if (e.status === 'pending') map[key].pending += e.amount;
      if (e.status === 'rejected') map[key].rejected += e.amount;
    });
    return Object.values(map);
  }, [filtered, vendorUsers]);

  return (
    <div className="space-y-6">
      {isVendor && (
        <InfoBanner color="amber">
          👤 <strong>Vendor View:</strong> You can see only activities associated with your vendor account.
        </InfoBanner>
      )}

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search entries..." />
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
        </div>
      </Card>

      {grouped.length === 0 ? (
        <Card className="p-12 text-center text-[#9CA3AF]">No vendor activities found.</Card>
      ) : (
        grouped.map((g, i) => {
          const vName = g.vendor?.territory?.tradeName || g.vendor?.name || 'Unknown Vendor';
          const vCode = g.vendor?.territory?.vendorCode || '';
          return (
            <Card key={i} className="overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-orange-50 to-white border-b border-[#DDE3ED] flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-bold text-white">{vName.charAt(0)}</div>
                  <div>
                    <p className="font-bold text-[#1A1D23]">{vName}</p>
                    {vCode && <p className="text-xs text-[#9CA3AF] font-mono">{vCode}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div><p className="text-xs text-[#6B7280]">Approved</p><p className="font-black text-green-600">{formatCurrency(g.approved)}</p></div>
                  <div><p className="text-xs text-[#6B7280]">Pending</p><p className="font-black text-amber-600">{formatCurrency(g.pending)}</p></div>
                  <div><p className="text-xs text-[#6B7280]">Rejected</p><p className="font-black text-red-600">{formatCurrency(g.rejected)}</p></div>
                  <div><p className="text-xs text-[#6B7280]">Total Entries</p><p className="font-black text-[#1B4F72]">{g.entries.length}</p></div>
                </div>
              </div>
              <div className="p-4">
                <Table>
                  <thead>
                    <tr>
                      <Th>Date</Th><Th>Submitted By</Th><Th>Area</Th><Th>PO</Th><Th>Product</Th><Th>Activity</Th><Th>Amount</Th><Th>Description</Th><Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.entries.map(e => (
                      <tr key={e.id} className="hover:bg-[#F8FAFC]">
                        <Td className="whitespace-nowrap">{e.date}</Td>
                        <Td className="text-xs">{e.userName}</Td>
                        <Td>{e.area || '—'} {e.pin && <span className="text-[#9CA3AF] text-xs">({e.pin})</span>}</Td>
                        <Td className="font-bold text-[#1B4F72]">{e.po}</Td>
                        <Td><Badge variant="blue">{e.product}</Badge></Td>
                        <Td className="text-xs">{e.activity}</Td>
                        <Td className="font-bold whitespace-nowrap">{formatCurrency(e.amount)}</Td>
                        <Td className="max-w-[180px] text-xs text-[#6B7280]" title={e.description}><span className="line-clamp-2">{e.description}</span></Td>
                        <Td><StatusBadge status={e.status} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
