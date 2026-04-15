import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Button, Input, Label, Table, Th, Td, Badge, Modal, Select, cn } from '../../components/ui';
import { VendorQuotation, VendorQuotationItem } from '../../types';
import { exportToExcel } from '../../lib/utils';
import { formatCurrency } from '../../lib/mock-data';
import { FileText, Send, ChevronDown, ChevronUp, ClipboardList, CheckCircle, Clock, Eye } from 'lucide-react';

export default function QuotationTab() {
  const { currentUser, pos, users, vendorQuotations, upsertVendorQuotation, deleteVendorQuotation } = useAppContext();
  const u = currentUser!;
  const isVendor = u.role === 'Vendor';
  const isAdmin = ['Owner', 'All India Manager', 'Finance Administrator', 'Regional Manager'].includes(u.role);

  const [selectedPoId, setSelectedPoId] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [showFillModal, setShowFillModal] = useState(false);
  const [draftItems, setDraftItems] = useState<VendorQuotationItem[]>([]);
  const [expandedVq, setExpandedVq] = useState<string | null>(null);
  const [adminPoFilter, setAdminPoFilter] = useState('');
  const [adminVendorFilter, setAdminVendorFilter] = useState('');

  const approvedDistributedPOs = useMemo(() =>
    pos.filter(p =>
      p.approvalStatus === 'approved' &&
      p.status !== 'Lapsed' &&
      Object.keys(p.allocations || {}).some(region =>
        Object.keys(p.allocations[region] || {}).length > 0
      )
    ),
    [pos]
  );

  const vendorRegions = useMemo((): string[] => {
    if (!isVendor) return [];
    const zones = u.territory?.assignedZones || [];
    return [...new Set(zones.map(z => z.region))];
  }, [u, isVendor]);

  const vendorEligiblePOs = useMemo(() => {
    if (!isVendor) return [];
    return approvedDistributedPOs.filter(po =>
      vendorRegions.some(r => po.allocations[r] && Object.keys(po.allocations[r]).length > 0)
    );
  }, [approvedDistributedPOs, vendorRegions, isVendor]);

  const getItemsFromAllocation = (po: typeof pos[0], region: string): VendorQuotationItem[] => {
    const alloc = po.allocations[region] || {};
    const items: VendorQuotationItem[] = [];
    Object.entries(alloc).forEach(([product, crops]) => {
      Object.entries(crops as Record<string, Record<string, number>>).forEach(([crop, activities]) => {
        Object.entries(activities as Record<string, number>).forEach(([activity, amount]) => {
          if (amount > 0) {
            items.push({ product, crop, activity, allocatedAmount: amount, quotedRate: undefined, quantity: undefined, remarks: '' });
          }
        });
      });
    });
    return items;
  };

  const openFillModal = (po: typeof pos[0], region: string) => {
    const existing = vendorQuotations.find(vq => vq.poId === po.id && vq.vendorId === u.id && vq.region === region);
    const baseItems = getItemsFromAllocation(po, region);
    if (existing && existing.items.length > 0) {
      setDraftItems(baseItems.map(bi => {
        const match = existing.items.find(ei => ei.product === bi.product && ei.crop === bi.crop && ei.activity === bi.activity);
        return match ? { ...bi, quotedRate: match.quotedRate, quantity: match.quantity, remarks: match.remarks } : bi;
      }));
    } else {
      setDraftItems(baseItems);
    }
    setSelectedPoId(po.id);
    setSelectedRegion(region);
    setShowFillModal(true);
  };

  const handleSaveDraft = () => {
    const po = pos.find(p => p.id === selectedPoId);
    if (!po) return;
    upsertVendorQuotation(selectedPoId, po.poNumber, selectedRegion, draftItems, 'draft');
    setShowFillModal(false);
  };

  const handleSubmit = () => {
    const po = pos.find(p => p.id === selectedPoId);
    if (!po) return;
    upsertVendorQuotation(selectedPoId, po.poNumber, selectedRegion, draftItems, 'submitted');
    setShowFillModal(false);
  };

  const adminFilteredQuotations = useMemo(() => {
    let list = vendorQuotations;
    if (adminPoFilter) list = list.filter(vq => vq.poId === adminPoFilter);
    if (adminVendorFilter) list = list.filter(vq => vq.vendorId === adminVendorFilter);
    return list;
  }, [vendorQuotations, adminPoFilter, adminVendorFilter]);

  const quotationsByPO = useMemo(() => {
    const map: Record<string, VendorQuotation[]> = {};
    adminFilteredQuotations.forEach(vq => {
      if (!map[vq.poNumber]) map[vq.poNumber] = [];
      map[vq.poNumber].push(vq);
    });
    return map;
  }, [adminFilteredQuotations]);

  const totalQuotedAmount = (vq: VendorQuotation) =>
    vq.items.reduce((s, it) => s + ((it.quotedRate || 0) * (it.quantity || 1)), 0);

  if (isVendor) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1B4F72] flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-[#1A1D23] text-lg">My Quotations</h2>
              <p className="text-xs text-[#6B7280]">Submit price quotations for distributed PO activities in your region — required before activities begin</p>
            </div>
          </div>

          {vendorEligiblePOs.length === 0 ? (
            <div className="text-center py-16 text-[#9CA3AF]">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No distributed POs in your region yet</p>
              <p className="text-xs mt-1">Quotation requests will appear once the AIM distributes an approved PO to your region</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vendorEligiblePOs.map(po => (
                <div key={po.id}>
                  {vendorRegions.filter(r => po.allocations[r] && Object.keys(po.allocations[r]).length > 0).map(region => {
                    const existing = vendorQuotations.find(vq => vq.poId === po.id && vq.vendorId === u.id && vq.region === region);
                    const isSubmitted = existing?.status === 'submitted';
                    const isDraft = existing?.status === 'draft';
                    const items = getItemsFromAllocation(po, region);
                    const totalAlloc = items.reduce((s, i) => s + i.allocatedAmount, 0);
                    return (
                      <div key={region} className={cn(
                        'border-2 rounded-xl p-5',
                        isSubmitted ? 'border-green-200 bg-green-50' : isDraft ? 'border-amber-200 bg-amber-50' : 'border-[#DDE3ED] bg-white'
                      )}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-[#1B4F72] text-base">{po.poNumber}</span>
                              <Badge variant="blue" className="text-[10px]">{region}</Badge>
                              {isSubmitted && <Badge variant="success" className="text-[10px]">Submitted</Badge>}
                              {isDraft && <Badge variant="warning" className="text-[10px]">Draft</Badge>}
                              {!existing && <Badge variant="default" className="text-[10px]">Pending</Badge>}
                            </div>
                            <p className="text-xs text-[#6B7280] mt-1">{po.from} → {po.to}</p>
                            <p className="text-xs text-[#6B7280]">
                              {items.length} activity line{items.length !== 1 ? 's' : ''} · Total allocated: <strong>{formatCurrency(totalAlloc)}</strong>
                            </p>
                            {isSubmitted && existing?.submittedAt && (
                              <p className="text-xs text-green-700 mt-1">Submitted on {existing.submittedAt} · Quoted: {formatCurrency(totalQuotedAmount(existing))}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!isSubmitted && (
                              <Button size="sm" onClick={() => openFillModal(po, region)}>
                                {isDraft ? 'Continue Draft' : 'Fill Quotation'}
                              </Button>
                            )}
                            {isSubmitted && (
                              <Button size="sm" variant="outline" onClick={() => openFillModal(po, region)}>
                                <Eye className="w-3.5 h-3.5 mr-1" /> View
                              </Button>
                            )}
                          </div>
                        </div>

                        {existing && (
                          <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-[#6B7280]">
                                    <th className="text-left py-1 pr-4">Product / Crop / Activity</th>
                                    <th className="text-right py-1 pr-4">Allocated (₹)</th>
                                    <th className="text-right py-1 pr-4">Rate / Unit</th>
                                    <th className="text-right py-1">Quoted Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {existing.items.map((it, i) => (
                                    <tr key={i} className="border-t border-[#F0F4F8]">
                                      <td className="py-1 pr-4 font-medium">{it.product} · {it.crop} · {it.activity}</td>
                                      <td className="py-1 pr-4 text-right text-[#6B7280]">{formatCurrency(it.allocatedAmount)}</td>
                                      <td className="py-1 pr-4 text-right font-semibold text-[#1B4F72]">{it.quotedRate ? formatCurrency(it.quotedRate) : '—'}</td>
                                      <td className="py-1 text-right font-bold">{it.quotedRate ? formatCurrency((it.quotedRate || 0) * (it.quantity || 1)) : '—'}</td>
                                    </tr>
                                  ))}
                                  <tr className="border-t-2 border-[#DDE3ED] font-bold">
                                    <td colSpan={3} className="py-1 pr-4 text-right">Total Quoted:</td>
                                    <td className="py-1 text-right text-[#1B4F72]">{formatCurrency(totalQuotedAmount(existing))}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </Card>

        {showFillModal && (() => {
          const po = pos.find(p => p.id === selectedPoId);
          if (!po) return null;
          const existing = vendorQuotations.find(vq => vq.poId === selectedPoId && vq.vendorId === u.id && vq.region === selectedRegion);
          const isAlreadySubmitted = existing?.status === 'submitted';
          return (
            <Modal open={showFillModal} title={`Quotation — ${po.poNumber} (${selectedRegion})`} onClose={() => setShowFillModal(false)} width="max-w-3xl">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  Fill in your price per unit for each activity. This quotation is required for formality before activities commence.
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F8FAFC] text-[#6B7280] text-xs">
                        <Th>Product</Th>
                        <Th>Crop</Th>
                        <Th>Activity</Th>
                        <Th>Allocated (₹)</Th>
                        <Th>Rate / Unit (₹)</Th>
                        <Th>Qty (Units)</Th>
                        <Th>Total (₹)</Th>
                        <Th>Remarks</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {draftItems.map((it, idx) => (
                        <tr key={idx} className="border-t border-[#F0F4F8]">
                          <Td className="font-medium text-xs">{it.product}</Td>
                          <Td className="text-xs">{it.crop}</Td>
                          <Td className="text-xs">{it.activity}</Td>
                          <Td className="text-xs font-semibold text-[#1B4F72]">{formatCurrency(it.allocatedAmount)}</Td>
                          <Td>
                            <Input
                              type="number" min="0" step="0.01"
                              value={it.quotedRate ?? ''}
                              disabled={isAlreadySubmitted}
                              onChange={e => setDraftItems(prev => prev.map((d, i) => i === idx ? { ...d, quotedRate: parseFloat(e.target.value) || undefined } : d))}
                              className="w-28 h-8 text-xs"
                              placeholder="0"
                            />
                          </Td>
                          <Td>
                            <Input
                              type="number" min="1"
                              value={it.quantity ?? ''}
                              disabled={isAlreadySubmitted}
                              onChange={e => setDraftItems(prev => prev.map((d, i) => i === idx ? { ...d, quantity: parseInt(e.target.value) || undefined } : d))}
                              className="w-20 h-8 text-xs"
                              placeholder="1"
                            />
                          </Td>
                          <Td className="font-bold text-xs text-[#1B4F72]">
                            {it.quotedRate ? formatCurrency((it.quotedRate || 0) * (it.quantity || 1)) : '—'}
                          </Td>
                          <Td>
                            <Input
                              value={it.remarks ?? ''}
                              disabled={isAlreadySubmitted}
                              onChange={e => setDraftItems(prev => prev.map((d, i) => i === idx ? { ...d, remarks: e.target.value } : d))}
                              className="w-32 h-8 text-xs"
                              placeholder="Optional"
                            />
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[#DDE3ED] bg-[#F8FAFC] font-bold">
                        <Td colSpan={4} className="text-right text-sm">Total Quoted Amount:</Td>
                        <Td colSpan={4} className="text-[#1B4F72] text-sm">
                          {formatCurrency(draftItems.reduce((s, it) => s + ((it.quotedRate || 0) * (it.quantity || 1)), 0))}
                        </Td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {!isAlreadySubmitted && (
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="secondary" onClick={() => setShowFillModal(false)}>Cancel</Button>
                    <Button variant="outline" onClick={handleSaveDraft}>Save Draft</Button>
                    <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white border-none">
                      <Send className="w-4 h-4 mr-1.5" /> Submit Quotation
                    </Button>
                  </div>
                )}
                {isAlreadySubmitted && (
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Quotation submitted on {existing?.submittedAt}. No further edits allowed.
                  </div>
                )}
              </div>
            </Modal>
          );
        })()}
      </div>
    );
  }

  if (isAdmin) {
    const allVendors = users.filter(u => u.role === 'Vendor' && u.status === 'active');

    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="font-bold text-[#1A1D23] text-xl flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#1B4F72]" /> Vendor Quotation Review
              </h2>
              <p className="text-sm text-[#6B7280] mt-1">View all vendor quotations submitted for distributed PO activities</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => {
                const rows = vendorQuotations.flatMap(vq =>
                  vq.items.map(it => ({
                    'PO Number': vq.poNumber,
                    'Vendor': vq.vendorName,
                    'Vendor Code': vq.vendorCode || '',
                    'Region': vq.region,
                    'Product': it.product,
                    'Crop': it.crop,
                    'Activity': it.activity,
                    'Allocated (₹)': it.allocatedAmount,
                    'Quoted Rate': it.quotedRate || '',
                    'Quantity': it.quantity || 1,
                    'Total Quoted (₹)': (it.quotedRate || 0) * (it.quantity || 1),
                    'Status': vq.status,
                    'Submitted At': vq.submittedAt || ''
                  }))
                );
                exportToExcel(rows, `Quotations_${new Date().toISOString().split('T')[0]}`);
              }}>Export Excel</Button>
            </div>
          </div>

          <div className="flex gap-3 mb-5">
            <div className="flex-1">
              <Label>Filter by PO</Label>
              <Select value={adminPoFilter} onChange={e => setAdminPoFilter(e.target.value)}>
                <option value="">All POs</option>
                {approvedDistributedPOs.map(po => <option key={po.id} value={po.id}>{po.poNumber}</option>)}
              </Select>
            </div>
            <div className="flex-1">
              <Label>Filter by Vendor</Label>
              <Select value={adminVendorFilter} onChange={e => setAdminVendorFilter(e.target.value)}>
                <option value="">All Vendors</option>
                {allVendors.map(v => <option key={v.id} value={v.id}>{v.territory?.tradeName || v.name}</option>)}
              </Select>
            </div>
          </div>

          {Object.keys(quotationsByPO).length === 0 ? (
            <div className="text-center py-16 text-[#9CA3AF]">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No vendor quotations yet</p>
              <p className="text-xs mt-1">Quotations will appear here once vendors submit them for distributed PO activities</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(quotationsByPO).map(([poNumber, vqs]) => {
                const po = pos.find(p => p.poNumber === poNumber);
                const submittedCount = vqs.filter(vq => vq.status === 'submitted').length;
                const draftCount = vqs.filter(vq => vq.status === 'draft').length;
                return (
                  <div key={poNumber} className="border border-[#DDE3ED] rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-[#EBF3FA] to-[#F0F9FF] p-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[#1B4F72] text-base">{poNumber}</h3>
                          {po && <span className="text-xs text-[#6B7280]">{po.from} → {po.to}</span>}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-[#6B7280]">{vqs.length} submission{vqs.length !== 1 ? 's' : ''}</span>
                          {submittedCount > 0 && <Badge variant="success" className="text-[10px]">{submittedCount} submitted</Badge>}
                          {draftCount > 0 && <Badge variant="warning" className="text-[10px]">{draftCount} draft</Badge>}
                        </div>
                      </div>
                      {po && (
                        <div className="text-right">
                          <p className="text-xs text-[#6B7280]">PO Budget</p>
                          <p className="font-bold text-[#1B4F72]">{formatCurrency(po.budget)}</p>
                        </div>
                      )}
                    </div>

                    <div className="divide-y divide-[#F0F4F8]">
                      {vqs.map(vq => {
                        const isExpanded = expandedVq === vq.id;
                        const totalQ = totalQuotedAmount(vq);
                        return (
                          <div key={vq.id}>
                            <div
                              className="flex flex-wrap items-center justify-between gap-3 p-4 cursor-pointer hover:bg-[#F8FAFC]"
                              onClick={() => setExpandedVq(isExpanded ? null : vq.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#1B4F72] flex items-center justify-center text-white text-xs font-bold">
                                  {vq.vendorName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold text-[#1A1D23] text-sm">{vq.vendorName}</p>
                                  <div className="flex gap-2 items-center mt-0.5">
                                    {vq.vendorCode && <span className="text-[10px] text-[#9CA3AF] font-mono">{vq.vendorCode}</span>}
                                    <Badge variant="blue" className="text-[10px]">{vq.region}</Badge>
                                    <Badge variant={vq.status === 'submitted' ? 'success' : 'warning'} className="text-[10px] uppercase">{vq.status}</Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-xs text-[#6B7280]">Total Quoted</p>
                                  <p className="font-bold text-[#1B4F72]">{totalQ > 0 ? formatCurrency(totalQ) : '—'}</p>
                                </div>
                                {vq.status === 'submitted' && vq.submittedAt && (
                                  <div className="text-right hidden md:block">
                                    <p className="text-xs text-[#6B7280]">Submitted</p>
                                    <p className="text-xs font-semibold">{vq.submittedAt}</p>
                                  </div>
                                )}
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-[#6B7280]" /> : <ChevronDown className="w-4 h-4 text-[#6B7280]" />}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="bg-[#F8FAFC] px-4 pb-4">
                                <Table>
                                  <thead>
                                    <tr>
                                      <Th>Product</Th>
                                      <Th>Crop</Th>
                                      <Th>Activity</Th>
                                      <Th>Allocated (₹)</Th>
                                      <Th>Rate / Unit (₹)</Th>
                                      <Th>Qty</Th>
                                      <Th>Quoted Total (₹)</Th>
                                      <Th>Remarks</Th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {vq.items.map((it, i) => (
                                      <tr key={i} className="hover:bg-white">
                                        <Td className="font-medium text-xs">{it.product}</Td>
                                        <Td className="text-xs">{it.crop}</Td>
                                        <Td className="text-xs">{it.activity}</Td>
                                        <Td className="font-semibold text-xs text-[#1B4F72]">{formatCurrency(it.allocatedAmount)}</Td>
                                        <Td className="text-xs">{it.quotedRate ? formatCurrency(it.quotedRate) : <span className="text-[#9CA3AF]">—</span>}</Td>
                                        <Td className="text-xs">{it.quantity || 1}</Td>
                                        <Td className="font-bold text-xs">{it.quotedRate ? formatCurrency((it.quotedRate || 0) * (it.quantity || 1)) : <span className="text-[#9CA3AF]">—</span>}</Td>
                                        <Td className="text-xs text-[#6B7280]">{it.remarks || '—'}</Td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="border-t-2 border-[#DDE3ED] font-bold bg-white">
                                      <Td colSpan={6} className="text-right">Total:</Td>
                                      <Td className="text-[#1B4F72]">{formatCurrency(totalQ)}</Td>
                                      <Td />
                                    </tr>
                                  </tfoot>
                                </Table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-64 text-[#9CA3AF]">
      <p>You do not have access to the Quotation tab.</p>
    </div>
  );
}
