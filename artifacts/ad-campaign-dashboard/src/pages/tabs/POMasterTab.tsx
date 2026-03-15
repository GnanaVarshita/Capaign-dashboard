import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Button, Input, Select, Textarea, Label, Table, Th, Td, Badge, Modal, ProgressBar, SearchInput, InfoBanner, cn } from '../../components/ui';
import { formatCurrency, formatLakhs, pct } from '../../lib/mock-data';

const statusBadge = (s: string) =>
  s === 'Active' ? <Badge variant="success">{s}</Badge> :
  s === 'Expiring Soon' ? <Badge variant="warning">{s}</Badge> :
  s === 'Lapsed' ? <Badge variant="error">{s}</Badge> :
  <Badge variant="default">{s}</Badge>;

const approvalBadge = (s: string) =>
  s === 'approved' ? <Badge variant="success">✓ Approved</Badge> :
  s === 'rejected' ? <Badge variant="error">✗ Rejected</Badge> :
  <Badge variant="warning">⏳ Pending</Badge>;

export default function POMasterTab() {
  const { pos, setPOs, addPO, updatePO, lapsePO, approvePO, rejectPO, calcLiveSpent, calcPendingSpent, regions, products, activities, currentUser } = useAppContext();
  const u = currentUser!;
  const canManage = u.role === 'Owner' || u.perms.manage;
  const canApprove = u.role === 'Owner' || u.role === 'All India Manager';

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(pos[0]?.id || '');
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [showDistModal, setShowDistModal] = useState(false);
  const [distRegion, setDistRegion] = useState('');
  const [distData, setDistData] = useState<Record<string, Record<string, number>>>({});

  const initForm = {
    poNumber: '', budget: '', from: '', to: '', status: 'Draft' as any,
    remarks: '', regionBudgets: {} as Record<string, string>
  };
  const [form, setForm] = useState(initForm);

  const filtered = pos.filter(p =>
    p.poNumber.toLowerCase().includes(search.toLowerCase()) ||
    (p.remarks || '').toLowerCase().includes(search.toLowerCase()) ||
    p.status.toLowerCase().includes(search.toLowerCase())
  );

  const selected = pos.find(p => p.id === selectedId) || pos[0];

  const openCreate = () => {
    setForm(initForm);
    setEditMode(false);
    setWizardStep(1);
    setShowWizard(true);
  };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      poNumber: selected.poNumber, budget: String(selected.budget),
      from: selected.from, to: selected.to, status: selected.status,
      remarks: selected.remarks || '',
      regionBudgets: Object.fromEntries(Object.entries(selected.regionBudgets).map(([k, v]) => [k, String(v)]))
    });
    setEditMode(true);
    setWizardStep(1);
    setShowWizard(true);
  };

  const handleSavePO = () => {
    const poData = {
      poNumber: form.poNumber, budget: parseFloat(form.budget) || 0,
      from: form.from, to: form.to, status: form.status,
      remarks: form.remarks, createdBy: u.name,
      createdAt: new Date().toISOString().split('T')[0],
      approvalStatus: 'pending' as const, approvedBy: '', approvedAt: '', rejectionReason: '',
      regionBudgets: Object.fromEntries(Object.entries(form.regionBudgets).filter(([, v]) => v && parseFloat(v) > 0).map(([k, v]) => [k, parseFloat(v)])),
      allocations: {}, zoneAllocations: {}
    };
    if (editMode && selected) {
      updatePO(selected.id, poData);
    } else {
      addPO(poData);
    }
    setShowWizard(false);
  };

  const openDistribute = (region: string) => {
    if (!selected) return;
    setDistRegion(region);
    const existing = selected.allocations[region] || {};
    const d: Record<string, Record<string, number>> = {};
    products.forEach(p => {
      d[p] = {};
      activities.forEach(a => { d[p][a] = (existing[p] || {})[a] || 0; });
    });
    setDistData(d);
    setShowDistModal(true);
  };

  const saveDistribution = () => {
    if (!selected) return;
    const newAlloc = { ...selected.allocations };
    newAlloc[distRegion] = {};
    Object.entries(distData).forEach(([p, acts]) => {
      newAlloc[distRegion][p] = {};
      Object.entries(acts).forEach(([a, v]) => { if (v > 0) newAlloc[distRegion][p][a] = v; });
    });
    updatePO(selected.id, { allocations: newAlloc });
    setShowDistModal(false);
  };

  const autoGenPO = () => setForm(f => ({ ...f, poNumber: `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}` }));

  return (
    <div className="space-y-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* LEFT - List */}
        <div className="border border-[#DDE3ED] rounded-xl lg:rounded-r-none lg:border-r-0 bg-white overflow-hidden">
          <div className="p-4 border-b border-[#DDE3ED] flex items-center justify-between bg-[#F8FAFC]">
            <h3 className="font-bold text-[#1A1D23]">Purchase Orders</h3>
            {canManage && <Button size="sm" onClick={openCreate}>+ New PO</Button>}
          </div>
          <div className="p-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search POs..." />
          </div>
          <div className="overflow-y-auto max-h-[600px] divide-y divide-[#F0F4F8]">
            {filtered.map(po => {
              const spent = calcLiveSpent({ po: po.poNumber });
              const utilPct = pct(spent, po.budget);
              return (
                <div
                  key={po.id}
                  onClick={() => setSelectedId(po.id)}
                  className={cn('p-4 cursor-pointer hover:bg-[#F8FAFC] transition-colors', selectedId === po.id ? 'bg-[#EBF5FB] border-l-4 border-l-[#1B4F72]' : '')}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-bold text-[#1B4F72] text-sm">{po.poNumber}</span>
                    {statusBadge(po.status)}
                  </div>
                  <p className="text-xs text-[#9CA3AF] mb-2">{po.from} → {po.to}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1A1D23]">{formatLakhs(po.budget)}</span>
                    <span className="text-xs text-[#9CA3AF]">{utilPct}% used</span>
                  </div>
                  <ProgressBar value={utilPct} className="mt-1.5 h-1.5" />
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT - Detail */}
        <div className="lg:col-span-2 border border-[#DDE3ED] rounded-xl lg:rounded-l-none bg-white overflow-hidden">
          {!selected ? (
            <div className="flex items-center justify-center h-full min-h-[400px] text-[#9CA3AF] flex-col gap-3">
              <span className="text-4xl">📋</span>
              <p>Select a PO to view details</p>
            </div>
          ) : (
            <>
              <div className="p-5 bg-[#F8FAFC] border-b border-[#DDE3ED] flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-[#1B4F72] text-lg">{selected.poNumber}</h2>
                    {statusBadge(selected.status)}
                    {approvalBadge(selected.approvalStatus)}
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1">📅 {selected.from} → {selected.to} · Created by {selected.createdBy} on {selected.createdAt}</p>
                  {selected.remarks && <p className="text-xs text-[#6B7280]">📝 {selected.remarks}</p>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {canManage && <Button size="sm" variant="outline" onClick={openEdit}>✏️ Edit</Button>}
                  {canManage && selected.status !== 'Lapsed' && <Button size="sm" variant="danger" onClick={() => { if(confirm('Mark this PO as Lapsed?')) lapsePO(selected.id); }}>Mark Lapsed</Button>}
                  {canApprove && selected.approvalStatus === 'pending' && <Button size="sm" variant="success" onClick={() => approvePO(selected.id, u.name)}>✓ Approve</Button>}
                </div>
              </div>

              {selected.approvalStatus === 'pending' && (
                <div className="m-4"><InfoBanner color="amber">⚠ This PO is pending approval. Budget allocation is read-only until approved.</InfoBanner></div>
              )}

              <div className="p-5 space-y-6 overflow-y-auto max-h-[560px]">
                <div>
                  <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">Budget Summary</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total PO Budget', value: formatCurrency(selected.budget), color: 'text-[#1B4F72]' },
                      { label: 'Assigned to Regions', value: formatCurrency(Object.values(selected.regionBudgets || {}).reduce((s, v) => s + (v as number), 0)), color: 'text-[#374151]' },
                      { label: 'Spent (Approved)', value: formatCurrency(calcLiveSpent({ po: selected.poNumber })), color: 'text-green-600' }
                    ].map(k => (
                      <div key={k.label} className="bg-[#F8FAFC] rounded-xl p-3 text-center border border-[#DDE3ED]">
                        <p className="text-[9px] text-[#6B7280] font-semibold uppercase mb-1">{k.label}</p>
                        <p className={`font-black text-base ${k.color}`}>{k.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">Region Budget Assignments</p>
                  <Table>
                    <thead>
                      <tr><Th>Region</Th><Th>Assigned</Th><Th>Distributed</Th><Th>Spent</Th><Th>Utilization</Th><Th>Actions</Th></tr>
                    </thead>
                    <tbody>
                      {Object.entries(selected.regionBudgets || {}).map(([region, budget]) => {
                        const distributed = Object.values((selected.allocations[region] || {})).reduce((s, p: any) => s + Object.values(p).reduce((s2: number, v: any) => s2 + v, 0), 0);
                        const spent = calcLiveSpent({ po: selected.poNumber, region });
                        const utilPct = pct(spent, budget as number);
                        return (
                          <tr key={region} className="hover:bg-[#F8FAFC]">
                            <Td className="font-bold text-[#1B4F72]">🗺️ {region}</Td>
                            <Td>{formatCurrency(budget as number)}</Td>
                            <Td>{distributed > 0 ? formatCurrency(distributed) : <span className="text-[#9CA3AF] text-xs">—</span>}</Td>
                            <Td className="font-bold text-green-600">{formatCurrency(spent)}</Td>
                            <Td>
                              <div className="flex items-center gap-2 min-w-[80px]">
                                <ProgressBar value={utilPct} className="flex-1" />
                                <span className="text-xs font-bold">{utilPct}%</span>
                              </div>
                            </Td>
                            <Td>
                              {canManage && selected.approvalStatus === 'approved' && (
                                <Button size="sm" variant="outline" onClick={() => openDistribute(region)}>⚡ Distribute</Button>
                              )}
                            </Td>
                          </tr>
                        );
                      })}
                      {Object.keys(selected.regionBudgets || {}).length === 0 && (
                        <tr><Td colSpan={6} className="text-center py-4 text-[#9CA3AF] text-xs">No region budgets assigned yet.</Td></tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                {Object.entries(selected.allocations || {}).map(([region, prods]) => {
                  if (Object.keys(prods).length === 0) return null;
                  return (
                    <div key={region}>
                      <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">📦 {region} — Product/Activity Allocation</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(prods).map(([prod, acts]) => {
                          const pTotal = Object.values(acts).reduce((s, v) => s + (v as number), 0);
                          const pSpent = calcLiveSpent({ po: selected.poNumber, region, product: prod });
                          if (pTotal === 0) return null;
                          return (
                            <div key={prod} className="border border-[#DDE3ED] rounded-xl p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-[#374151] text-sm">{prod}</span>
                                <span className="text-xs text-[#6B7280]">{formatCurrency(pTotal)}</span>
                              </div>
                              <ProgressBar value={pct(pSpent, pTotal)} className="mb-2" />
                              {Object.entries(acts).map(([act, val]) => (
                                <div key={act} className="flex justify-between text-xs py-1 border-b border-[#F0F4F8] last:border-0">
                                  <span className="text-[#6B7280]">{act}</span>
                                  <span className="font-semibold text-[#1B4F72]">{formatCurrency(val as number)}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* PO Wizard Modal */}
      <Modal open={showWizard} onClose={() => setShowWizard(false)} title={editMode ? 'Edit Purchase Order' : 'Create Purchase Order'} width="max-w-2xl">
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={cn('flex-1 h-1.5 rounded-full transition-all', s <= wizardStep ? 'bg-[#1B4F72]' : 'bg-[#E5E9EF]')} />
          ))}
        </div>

        {wizardStep === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-[#6B7280] mb-3">Step 1 — PO Details</p>
            <div className="flex gap-3">
              <div className="flex-1"><Label required>PO Number</Label><Input value={form.poNumber} onChange={e => setForm(f => ({ ...f, poNumber: e.target.value }))} placeholder="PO-2026-001" /></div>
              <Button variant="secondary" onClick={autoGenPO} className="self-end h-9">Auto-generate</Button>
            </div>
            <div><Label required>Total Budget (₹)</Label><Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="1000000" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label required>From Date</Label><Input type="date" value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))} /></div>
              <div><Label required>To Date</Label><Input type="date" value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} /></div>
            </div>
            <div><Label>Remarks</Label><Textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows={2} placeholder="e.g. Q1 2026 National Campaign" /></div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowWizard(false)}>Cancel</Button>
              <Button onClick={() => setWizardStep(2)} disabled={!form.poNumber || !form.budget || !form.from || !form.to}>Next →</Button>
            </div>
          </div>
        )}

        {wizardStep === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-[#6B7280] mb-3">Step 2 — Region Budget Allocation</p>
            <p className="text-xs text-[#9CA3AF]">Total Budget: <strong className="text-[#1B4F72]">{formatCurrency(parseFloat(form.budget) || 0)}</strong> · Remaining: <strong>{formatCurrency(Math.max(0, (parseFloat(form.budget) || 0) - Object.values(form.regionBudgets).reduce((s, v) => s + (parseFloat(v) || 0), 0)))}</strong></p>
            <div className="space-y-2">
              {regions.map(r => (
                <div key={r.name} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-24">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="text-sm font-semibold text-[#374151]">{r.name}</span>
                  </div>
                  <Input type="number" min="0" value={form.regionBudgets[r.name] || ''} onChange={e => setForm(f => ({ ...f, regionBudgets: { ...f.regionBudgets, [r.name]: e.target.value } }))} placeholder="0" className="flex-1" />
                </div>
              ))}
            </div>
            <div className="flex justify-between gap-3 pt-2">
              <Button variant="secondary" onClick={() => setWizardStep(1)}>← Back</Button>
              <Button onClick={() => setWizardStep(3)}>Next →</Button>
            </div>
          </div>
        )}

        {wizardStep === 3 && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-[#6B7280] mb-3">Step 3 — Review & Save</p>
            <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2 text-sm">
              <p><span className="text-[#6B7280]">PO Number:</span> <strong>{form.poNumber}</strong></p>
              <p><span className="text-[#6B7280]">Budget:</span> <strong className="text-[#1B4F72]">{formatCurrency(parseFloat(form.budget) || 0)}</strong></p>
              <p><span className="text-[#6B7280]">Period:</span> <strong>{form.from} → {form.to}</strong></p>
              {form.remarks && <p><span className="text-[#6B7280]">Remarks:</span> {form.remarks}</p>}
              <div>
                <p className="text-[#6B7280] mb-1">Region Budgets:</p>
                {Object.entries(form.regionBudgets).filter(([, v]) => parseFloat(v) > 0).map(([r, v]) => (
                  <p key={r} className="text-xs">• {r}: <strong>{formatCurrency(parseFloat(v))}</strong></p>
                ))}
              </div>
            </div>
            <div className="flex justify-between gap-3 pt-2">
              <Button variant="secondary" onClick={() => setWizardStep(2)}>← Back</Button>
              <Button onClick={handleSavePO}>{editMode ? 'Save Changes' : 'Create PO'}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Distribution Modal */}
      <Modal open={showDistModal} onClose={() => setShowDistModal(false)} title={`Distribute Budget — ${distRegion}`} width="max-w-2xl">
        <div className="space-y-4">
          <p className="text-xs text-[#9CA3AF]">Region Budget: <strong className="text-[#1B4F72]">{selected && formatCurrency(selected.regionBudgets[distRegion] || 0)}</strong></p>
          {products.map(prod => (
            <div key={prod} className="border border-[#DDE3ED] rounded-xl p-4">
              <p className="font-bold text-[#374151] text-sm mb-3">{prod}</p>
              <div className="grid grid-cols-2 gap-3">
                {activities.map(act => (
                  <div key={act}>
                    <Label className="text-[9px]">{act}</Label>
                    <Input type="number" min="0" value={distData[prod]?.[act] || ''} onChange={e => setDistData(d => ({ ...d, [prod]: { ...(d[prod] || {}), [act]: parseFloat(e.target.value) || 0 } }))} placeholder="0" className="h-8 text-xs" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowDistModal(false)}>Cancel</Button>
            <Button onClick={saveDistribution}>Save Distribution</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
