import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Button, Table, Th, Td, Badge, Modal, Label, Input, Textarea, cn } from '../../components/ui';
import { formatCurrency } from '../../lib/mock-data';

export default function BillingTab() {
  const { users, entries, bills, addBill, updateBill, currentUser } = useAppContext();
  const u = currentUser!;
  const isVendor = u.role === 'Vendor';
  const userRegion = u.role === 'Regional Manager' ? u.territory?.region : null;

  const [createModal, setCreateModal] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [invoiceNum, setInvoiceNum] = useState('');
  const [remarks, setRemarks] = useState('');

  const eligibleEntries = entries.filter(e => {
    if (e.status !== 'approved') return false;
    if (isVendor && e.vendorId !== u.id) return false;
    if (userRegion && e.region !== userRegion) return false;
    if (bills.some(b => b.entryIds.includes(e.id) && b.status !== 'draft')) return false;
    return true;
  });

  const vendorBills = useMemo(() => {
    if (isVendor) return bills.filter(b => b.vendorId === u.id);
    if (userRegion) {
      // Filter bills that contain entries from this region
      return bills.filter(b => {
        const billEntries = entries.filter(e => b.entryIds.includes(e.id));
        return billEntries.some(e => e.region === userRegion);
      });
    }
    return bills;
  }, [bills, isVendor, userRegion, u.id, entries]);

  const billStatusBadge = (s: string) =>
    s === 'paid' ? <Badge variant="success">✓ Paid</Badge> :
    s === 'submitted' ? <Badge variant="blue">📤 Submitted</Badge> :
    <Badge variant="warning">📝 Draft</Badge>;

  const toggleEntry = (id: string) => {
    setSelectedEntries(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreateBill = () => {
    if (!selectedEntries.length) return;
    const selEntries = entries.filter(e => selectedEntries.includes(e.id));
    const total = selEntries.reduce((s, e) => s + e.amount, 0);
    const vendorId = isVendor ? u.id : (selEntries[0]?.vendorId || '');
    const vendorName = isVendor ? (u.territory?.tradeName || u.name) : (selEntries[0]?.vendorName || '');
    addBill({ vendorId, vendorName, entryIds: selectedEntries, totalAmount: total, status: 'draft', createdAt: new Date().toISOString().split('T')[0], invoiceNumber: invoiceNum, remarks });
    setCreateModal(false);
    setSelectedEntries([]);
    setInvoiceNum('');
    setRemarks('');
  };

  const totalPaid = vendorBills.filter(b => b.status === 'paid').reduce((s, b) => s + b.totalAmount, 0);
  const totalSubmitted = vendorBills.filter(b => b.status === 'submitted').reduce((s, b) => s + b.totalAmount, 0);
  const totalDraft = vendorBills.filter(b => b.status === 'draft').reduce((s, b) => s + b.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-green-500">
          <p className="text-xs text-[#6B7280] font-semibold">Paid</p>
          <p className="text-xl font-black text-green-600">{formatCurrency(totalPaid)}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <p className="text-xs text-[#6B7280] font-semibold">Submitted</p>
          <p className="text-xl font-black text-blue-600">{formatCurrency(totalSubmitted)}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-xs text-[#6B7280] font-semibold">Draft</p>
          <p className="text-xl font-black text-amber-600">{formatCurrency(totalDraft)}</p>
        </Card>
      </div>

      <Card className="p-6">
        <CardTitle>
          {isVendor ? 'My Billing' : 'Vendor Billing'}
          {(isVendor || ['Owner', 'All India Manager', 'Regional Manager'].includes(u.role)) && eligibleEntries.length > 0 && (
            <Button size="sm" onClick={() => setCreateModal(true)}>+ Create Bill</Button>
          )}
        </CardTitle>

        {vendorBills.length === 0 ? (
          <div className="py-12 text-center text-[#9CA3AF]">No bills created yet.{eligibleEntries.length > 0 ? ' Click "Create Bill" to start.' : ''}</div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Bill ID</Th><Th>Vendor</Th><Th>Invoice #</Th><Th>Date</Th><Th>Entries</Th><Th>Total Amount</Th><Th>Status</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {vendorBills.map(b => (
                <tr key={b.id} className="hover:bg-[#F8FAFC]">
                  <Td className="font-mono text-xs text-[#9CA3AF]">{b.id.slice(0, 12)}…</Td>
                  <Td className="font-medium">{b.vendorName}</Td>
                  <Td className="text-xs font-mono">{b.invoiceNumber || '—'}</Td>
                  <Td className="text-xs">{b.createdAt}</Td>
                  <Td><Badge variant="blue">{b.entryIds.length} entries</Badge></Td>
                  <Td className="font-bold text-[#1B4F72]">{formatCurrency(b.totalAmount)}</Td>
                  <Td>{billStatusBadge(b.status)}</Td>
                  <Td>
                    <div className="flex gap-1">
                      {b.status === 'draft' && (
                        <Button size="sm" variant="outline" onClick={() => updateBill(b.id, { status: 'submitted', submittedAt: new Date().toISOString().split('T')[0] })}>Submit</Button>
                      )}
                      {b.status === 'submitted' && !isVendor && (
                        <Button size="sm" variant="success" onClick={() => updateBill(b.id, { status: 'paid', paidAt: new Date().toISOString().split('T')[0] })}>Mark Paid</Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {eligibleEntries.length > 0 && (
        <Card className="p-6">
          <CardTitle>Approved Entries Available for Billing ({eligibleEntries.length})</CardTitle>
          <Table>
            <thead>
              <tr><Th>Date</Th><Th>PO</Th><Th>Vendor</Th><Th>Product</Th><Th>Activity</Th><Th>Area</Th><Th>Amount</Th></tr>
            </thead>
            <tbody>
              {eligibleEntries.map(e => (
                <tr key={e.id} className="hover:bg-[#F8FAFC]">
                  <Td>{e.date}</Td>
                  <Td className="font-bold text-[#1B4F72]">{e.po}</Td>
                  <Td className="text-xs">{e.vendorName || '—'}</Td>
                  <Td><Badge variant="blue">{e.product}</Badge></Td>
                  <Td className="text-xs">{e.activity}</Td>
                  <Td>{e.area}</Td>
                  <Td className="font-bold text-green-600">{formatCurrency(e.amount)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Bill" width="max-w-2xl">
        <div className="space-y-4">
          <div>
            <Label required>Invoice Number</Label>
            <Input value={invoiceNum} onChange={e => setInvoiceNum(e.target.value)} placeholder="e.g. INV-2026-001" />
          </div>
          <div>
            <Label>Remarks</Label>
            <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} placeholder="Additional notes..." />
          </div>
          <div>
            <Label required>Select Approved Entries</Label>
            <div className="border border-[#DDE3ED] rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              {eligibleEntries.map(e => (
                <label key={e.id} className={cn('flex items-center gap-3 p-3 cursor-pointer hover:bg-[#F8FAFC] border-b border-[#F0F4F8]', selectedEntries.includes(e.id) ? 'bg-blue-50' : '')}>
                  <input type="checkbox" checked={selectedEntries.includes(e.id)} onChange={() => toggleEntry(e.id)} className="rounded" />
                  <div className="flex-1 min-w-0 text-xs">
                    <span className="font-bold text-[#1B4F72]">{e.po}</span> · {e.product} · {e.activity} · {e.area}
                  </div>
                  <span className="font-bold text-green-600 text-xs whitespace-nowrap">{formatCurrency(e.amount)}</span>
                </label>
              ))}
            </div>
            {selectedEntries.length > 0 && (
              <p className="text-sm font-bold text-[#1B4F72] mt-2">
                Total: {formatCurrency(entries.filter(e => selectedEntries.includes(e.id)).reduce((s, e) => s + e.amount, 0))}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreateBill} disabled={!selectedEntries.length || !invoiceNum}>Create Bill</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
