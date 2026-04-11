import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Table, Th, Td, Badge, StatusBadge, SearchInput, Select, InfoBanner, cn, KpiCard, Button, Modal, Label, Input, Textarea } from '../../components/ui';
import { formatCurrency } from '../../lib/mock-data';

export default function VendorSectionTab() {
  const { users, entries, currentUser, crops, bills, addBill, updateBill, serviceReceivers, generateInvoiceNumber, pendingBillData, setPendingBillData, navigateToTab } = useAppContext();
  const u = currentUser!;
  const isVendor = u.role === 'Vendor';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [poFilter, setPOFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [filterCrop, setFilterCrop] = useState('');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showRaiseBillModal, setShowRaiseBillModal] = useState(false);
  const [billForm, setBillForm] = useState({
    invoiceNumber: '',
    serviceReceiverId: '',
    serviceCharge: 0,
    gstRate: 18,
    remarks: ''
  });

  const scopedEntries = useMemo(() => {
    if (isVendor) {
      return entries.filter(e => {
        if (e.vendorId && e.vendorId === u.id) return true;
        const myTradeName = (u.territory?.tradeName || '').trim().toLowerCase();
        if (myTradeName && e.vendorName?.trim().toLowerCase() === myTradeName) return true;
        return false;
      });
    }
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

  const allPOs = useMemo(() => [...new Set(scopedEntries.map(e => e.po))].sort(), [scopedEntries]);
  const allAreas = useMemo(() => [...new Set(scopedEntries.map(e => e.area).filter(Boolean))].sort(), [scopedEntries]);
  const vendorUsers = users.filter(x => x.role === 'Vendor');

  const filtered = useMemo(() => {
    return scopedEntries.filter(e => {
      if (statusFilter && e.status !== statusFilter) return false;
      if (poFilter && e.po !== poFilter) return false;
      if (areaFilter && e.area !== areaFilter) return false;
      if (filterCrop && e.crop !== filterCrop) return false;
      if (search) {
        const q = search.toLowerCase();
        if (![e.area, e.pin, e.po, e.product, e.activity, e.vendorName, e.description, e.userName].join(' ').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [scopedEntries, statusFilter, poFilter, areaFilter, filterCrop, search]);

  // Billing Logic for Vendor
  const billedEntryIds = useMemo(() => new Set(bills.flatMap(b => b.entryIds)), [bills]);
  const pendingBilling = useMemo(() => scopedEntries.filter(e => e.status === 'approved' && !billedEntryIds.has(e.id)), [scopedEntries, billedEntryIds]);
  const myBillings = useMemo(() => bills.filter(b => b.vendorId === u.id).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')), [bills, u.id]);

  const toggleEntry = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAllPending = () => setSelectedIds(new Set(pendingBilling.map(e => e.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const handleRaiseBill = () => {
    if (selectedIds.size === 0) return;
    setPendingBillData({
      entryIds: Array.from(selectedIds),
      invoiceNumber: billForm.invoiceNumber,
      serviceReceiverId: billForm.serviceReceiverId,
      serviceCharge: billForm.serviceCharge,
      gstRate: billForm.gstRate,
      remarks: billForm.remarks
    });
    setSelectedIds(new Set());
    setShowRaiseBillModal(false);
    setBillForm({ invoiceNumber: '', serviceReceiverId: '', serviceCharge: 0, gstRate: 18, remarks: '' });
    navigateToTab('billing');
  };

  if (isVendor) {
    const totalApproved = scopedEntries.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0);
    const totalUnbilled = pendingBilling.reduce((s, e) => s + e.amount, 0);
    const totalBilled = myBillings.filter(b => b.status !== 'draft').reduce((s, b) => s + b.totalAmount, 0);
    const totalPaid = myBillings.filter(b => b.status === 'paid').reduce((s, b) => s + b.totalAmount, 0);

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Vendor Section
            </h2>
            <p className="text-xs text-slate-500 mt-1">Your approved activities ready for billing, and your billing history</p>
          </div>
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-700 flex items-center gap-2">
            
            <strong>Vendor View:</strong> Approved activities show as "Pending for Billing".
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total Approved" value={formatCurrency(totalApproved)} sub={`${scopedEntries.filter(e => e.status === 'approved').length} activities`} color="#16A34A" icon="✅" />
          <KpiCard label="Pending for Billing" value={formatCurrency(totalUnbilled)} sub={`${pendingBilling.length} unbilled activities`} color="#C2410C" icon="🧾" />
          <KpiCard label="Billed Amount" value={formatCurrency(totalBilled)} sub={`${myBillings.filter(b => b.status !== 'draft').length} bills raised`} color="#1B4F72" icon="📤" />
          <KpiCard label="Amount Paid" value={formatCurrency(totalPaid)} sub={`${myBillings.filter(b => b.status === 'paid').length} bills paid`} color="#6D28D9" icon="💰" />
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by area, activity..." />
            <Select value={poFilter} onChange={e => setPOFilter(e.target.value)} className="w-44">
              <option value="">All POs</option>
              {allPOs.map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} className="w-40">
              <option value="">All Areas</option>
              {allAreas.map(a => <option key={a} value={a}>{a}</option>)}</Select>
            <Select value={filterCrop} onChange={e => setFilterCrop(e.target.value)} className="w-40">
              <option value="">All Crops</option>
              {crops && crops.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </Select>
          </div>
        </Card>

        {/* Section 1: Pending for Billing */}
        <Card className="overflow-hidden border-l-4 border-l-[#C2410C]">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">Pending for Billing</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Select approved activities below and raise a combined bill</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-full text-[11px] font-bold text-orange-700">
                {selectedIds.size} selected
              </span>
              <Button size="sm" variant="secondary" onClick={selectAllPending}>Select All</Button>
              <Button size="sm" variant="secondary" onClick={clearSelection}>Clear</Button>
              <Button size="sm" onClick={() => {
                setBillForm({ invoiceNumber: generateInvoiceNumber(), serviceReceiverId: '', serviceCharge: 0, gstRate: 18, remarks: '' });
                setShowRaiseBillModal(true);
              }} disabled={selectedIds.size === 0} className="bg-[#C2410C] hover:bg-[#A0360A] border-none">
                Raise Bill
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr className="bg-orange-50/30">
                  <Th className="w-10 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded"
                      checked={pendingBilling.length > 0 && selectedIds.size === pendingBilling.length}
                      onChange={e => e.target.checked ? selectAllPending() : clearSelection()}
                    />
                  </Th>
                  <Th>Date</Th><Th>Area</Th><Th>PO</Th><Th>Activity</Th><Th>Product</Th><Th className="text-right">Amount</Th>
                </tr>
              </thead>
              <tbody>
                {pendingBilling.length === 0 ? (
                  <tr><Td colSpan={7} className="text-center py-12 text-slate-400">No activities pending billing.</Td></tr>
                ) : (
                  pendingBilling.map(e => (
                    <tr key={e.id} className={cn('hover:bg-slate-50', selectedIds.has(e.id) ? 'bg-orange-50/20' : '')}>
                      <Td className="text-center">
                        <input 
                          type="checkbox" 
                          className="rounded"
                          checked={selectedIds.has(e.id)}
                          onChange={() => toggleEntry(e.id)}
                        />
                      </Td>
                      <Td className="text-xs">{e.date}</Td>
                      <Td className="text-xs font-semibold">{e.area}</Td>
                      <Td className="text-[11px] font-bold text-primary">{e.po}</Td>
                      <Td className="text-xs">{e.activity}</Td>
                      <Td><Badge variant="blue">{e.product}</Badge></Td>
                      <Td className="text-right font-bold text-orange-700">{formatCurrency(e.amount)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card>

        {/* Section 2: Billing History */}
        <Card className="overflow-hidden border-l-4 border-l-primary">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">Billing History</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Bill ID</Th><Th>Invoice No</Th><Th>Date</Th><Th>Activities</Th><Th className="text-right">Amount</Th><Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {myBillings.length === 0 ? (
                  <tr><Td colSpan={6} className="text-center py-12 text-slate-400">No bills raised yet.</Td></tr>
                ) : (
                  myBillings.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <Td className="text-[10px] font-mono text-slate-400">{b.id.slice(0, 12)}...</Td>
                      <Td className="text-xs font-bold">{b.invoiceNumber || '—'}</Td>
                      <Td className="text-xs">{b.createdAt}</Td>
                      <Td><Badge variant="blue">{b.entryIds.length} entries</Badge></Td>
                      <Td className="text-right font-bold">{formatCurrency(b.totalAmount)}</Td>
                      <Td>
                        {b.status === 'paid' ? <Badge variant="success">Paid</Badge> : 
                         b.status === 'submitted' ? <Badge variant="blue">Submitted</Badge> : 
                         <Badge variant="warning">Draft</Badge>}
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card>

        <Modal open={showRaiseBillModal} onClose={() => setShowRaiseBillModal(false)} title="Raise Combined Bill">
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs font-bold text-blue-800">Raising bill for {selectedIds.size} activities</p>
              <p className="text-sm font-black text-blue-900 mt-1">Activity Total: {formatCurrency(pendingBilling.filter(e => selectedIds.has(e.id)).reduce((s, e) => s + e.amount, 0))}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label required>Invoice Number</Label>
                <Input value={billForm.invoiceNumber} onChange={e => setBillForm({...billForm, invoiceNumber: e.target.value})} placeholder="e.g. INV/26/001" />
              </div>
              <div className="space-y-1">
                <Label>Service Receiver (Optional)</Label>
                <Select value={billForm.serviceReceiverId} onChange={e => setBillForm({...billForm, serviceReceiverId: e.target.value})}>
                  <option value="">Select Receiver...</option>
                  {serviceReceivers.filter(r => r.vendorId === u.id).map(r => (
                    <option key={r.id} value={r.id}>{r.companyName}</option>
                  ))}
                </Select>
                {serviceReceivers.filter(r => r.vendorId === u.id).length === 0 && (
                  <p className="text-[10px] text-amber-500 mt-1">You can add service receivers later in Billing Section.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Service Charges (Optional)</Label>
                <Input type="number" value={billForm.serviceCharge} onChange={e => setBillForm({...billForm, serviceCharge: Number(e.target.value)})} placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label>GST Rate (%)</Label>
                <Select value={billForm.gstRate} onChange={e => setBillForm({...billForm, gstRate: Number(e.target.value)})}>
                  <option value={18}>18% (Standard)</option>
                  <option value={12}>12%</option>
                  <option value={5}>5%</option>
                  <option value={0}>0% (Exempt)</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Notes / Remarks</Label>
              <Textarea value={billForm.remarks} onChange={e => setBillForm({...billForm, remarks: e.target.value})} placeholder="Additional details..." rows={2} />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Estimated Total (Incl. GST)</p>
                <p className="text-xl font-black text-[#1B4F72]">
                  {formatCurrency(
                    (pendingBilling.filter(e => selectedIds.has(e.id)).reduce((s, e) => s + e.amount, 0) + Number(billForm.serviceCharge)) * (1 + billForm.gstRate/100)
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowRaiseBillModal(false)}>Cancel</Button>
                <Button onClick={handleRaiseBill} disabled={!billForm.invoiceNumber} className="bg-blue-600 hover:bg-blue-700 text-white border-none">
                  Raise Bill
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // Non-vendor View (Grouped by Vendor)
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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Vendor Section
          </h2>
          <p className="text-xs text-slate-500 mt-1">Activities submitted by Area Managers, grouped by their assigned vendor</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by area, PO, product..." />
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-36">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
          <Select value={poFilter} onChange={e => setPOFilter(e.target.value)} className="w-44">
            <option value="">All POs</option>
            {allPOs.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
          <Select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} className="w-40">
            <option value="">All Areas</option>
            {allAreas.map(a => <option key={a} value={a}>{a}</option>)}</Select>
            <Select value={filterCrop} onChange={e => setFilterCrop(e.target.value)} className="w-40">
              <option value="">All Crops</option>
              {crops && crops.map((c, i) => <option key={i} value={c}>{c}</option>)}
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






