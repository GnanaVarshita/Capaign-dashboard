import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Button, Input, Label, Table, Th, Td, Badge, Modal, Select, cn } from '../../components/ui';
import { Quotation, QuotationItem } from '../../types';
import { exportToExcel } from '../../lib/utils';
import { formatCurrency } from '../../lib/mock-data';
import { FileText, Plus, Send, Eye, Tag, ChevronDown, ChevronUp, ClipboardList, Users } from 'lucide-react';

type AdminTab = 'requests' | 'responses';
type VendorTab = 'open' | 'submitted';

export default function QuotationTab() {
  const { currentUser, quotations, pos, users, crops, products, activities, addQuotation, updateQuotation, deleteQuotation, submitQuotation, saveDraftQuotation } = useAppContext();
  const u = currentUser!;
  const isVendor = u.role === 'Vendor';
  const isAdmin = ['Owner', 'All India Manager', 'Finance Administrator'].includes(u.role);

  const [adminTab, setAdminTab] = useState<AdminTab>('requests');
  const [vendorTab, setVendorTab] = useState<VendorTab>('open');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuot, setSelectedQuot] = useState<string | null>(null);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  // Vendor quotation interaction state
  const [activeVendorQuot, setActiveVendorQuot] = useState<string | null>(null);
  const [draftPrices, setDraftPrices] = useState<Record<string, number>>({});
  const [draftRemarks, setDraftRemarks] = useState('');

  // Create form
  const [createForm, setCreateForm] = useState({
    poId: '',
    vendorIds: [] as string[],
    dueDate: '',
    remarks: '',
    items: [] as QuotationItem[]
  });

  const vendors = users.filter(u => u.role === 'Vendor' && u.status === 'active');
  const approvedPOs = pos.filter(p => p.approvalStatus === 'approved' && p.status !== 'Lapsed');

  const vendorQuots = useMemo(() => {
    if (!isVendor) return [];
    return quotations.filter(q => q.vendorIds.includes(u.id));
  }, [quotations, isVendor, u.id]);

  const openVendorQuots = vendorQuots.filter(q => q.status === 'open' && !q.submissions[u.id]);
  const submittedVendorQuots = vendorQuots.filter(q => q.submissions[u.id]);

  const handleCreateQuotation = () => {
    const po = pos.find(p => p.id === createForm.poId);
    if (!po || createForm.vendorIds.length === 0 || createForm.items.length === 0) return;

    addQuotation({
      poId: po.id,
      poNumber: po.poNumber,
      requestedById: u.id,
      requestedByName: u.name,
      requestedByRole: u.role,
      createdAt: new Date().toISOString().split('T')[0],
      dueDate: createForm.dueDate,
      remarks: createForm.remarks,
      status: 'open',
      vendorIds: createForm.vendorIds,
      items: createForm.items
    });

    setShowCreateModal(false);
    setCreateForm({ poId: '', vendorIds: [], dueDate: '', remarks: '', items: [] });
  };

  const handleAddItem = () => {
    setCreateForm(f => ({
      ...f,
      items: [...f.items, {
        id: `qi-${Date.now()}`,
        activity: '',
        product: '',
        crop: '',
        region: '',
        unit: 'per event',
        estimatedQuantity: 0
      }]
    }));
  };

  const handleItemChange = (idx: number, field: keyof QuotationItem, value: any) => {
    setCreateForm(f => ({
      ...f,
      items: f.items.map((it, i) => i === idx ? { ...it, [field]: value } : it)
    }));
  };

  const handleRemoveItem = (idx: number) => {
    setCreateForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const handleVendorToggle = (vendorId: string) => {
    setCreateForm(f => ({
      ...f,
      vendorIds: f.vendorIds.includes(vendorId)
        ? f.vendorIds.filter(id => id !== vendorId)
        : [...f.vendorIds, vendorId]
    }));
  };

  const startQuoting = (quot: Quotation) => {
    const existing = quot.submissions[u.id];
    if (existing) {
      const priceMap: Record<string, number> = {};
      existing.quotedItems.forEach(qi => { priceMap[qi.itemId] = qi.quotedPricePerUnit; });
      setDraftPrices(priceMap);
      setDraftRemarks(existing.remarks || '');
    } else {
      setDraftPrices({});
      setDraftRemarks('');
    }
    setActiveVendorQuot(quot.id);
  };

  const handleSaveDraft = (quot: Quotation) => {
    const quotedItems = quot.items.map(item => ({
      itemId: item.id,
      activity: item.activity,
      product: item.product,
      crop: item.crop,
      region: item.region,
      quotedPricePerUnit: draftPrices[item.id] || 0,
      remarks: ''
    }));
    const total = quotedItems.reduce((s, qi) => {
      const item = quot.items.find(i => i.id === qi.itemId);
      return s + (qi.quotedPricePerUnit * (item?.estimatedQuantity || 1));
    }, 0);

    saveDraftQuotation(quot.id, u.id, {
      vendorId: u.id,
      vendorName: u.territory?.tradeName || u.name,
      quotedItems,
      totalQuotedAmount: total,
      remarks: draftRemarks
    });
    setActiveVendorQuot(null);
  };

  const handleSubmitQuote = (quot: Quotation) => {
    const quotedItems = quot.items.map(item => ({
      itemId: item.id,
      activity: item.activity,
      product: item.product,
      crop: item.crop,
      region: item.region,
      quotedPricePerUnit: draftPrices[item.id] || 0,
      remarks: ''
    }));
    const total = quotedItems.reduce((s, qi) => {
      const item = quot.items.find(i => i.id === qi.itemId);
      return s + (qi.quotedPricePerUnit * (item?.estimatedQuantity || 1));
    }, 0);

    submitQuotation(quot.id, u.id, {
      vendorId: u.id,
      vendorName: u.territory?.tradeName || u.name,
      status: 'submitted',
      quotedItems,
      totalQuotedAmount: total,
      remarks: draftRemarks
    });
    setActiveVendorQuot(null);
  };

  const exportResponses = (quot: Quotation) => {
    const rows: any[] = [];
    Object.values(quot.submissions).forEach(sub => {
      sub.quotedItems.forEach(qi => {
        rows.push({
          'Vendor': sub.vendorName,
          'Status': sub.status,
          'Activity': qi.activity,
          'Product': qi.product,
          'Crop': qi.crop,
          'Region': qi.region || '',
          'Quoted Price/Unit': qi.quotedPricePerUnit,
          'Total': sub.totalQuotedAmount,
          'Submitted At': sub.submittedAt,
          'Remarks': qi.remarks || ''
        });
      });
    });
    exportToExcel(rows, `quotation-${quot.id}.xls`);
  };

  // ─── VENDOR VIEW ───────────────────────────────────────────────────────────
  if (isVendor) {
    const displayQuots = vendorTab === 'open' ? openVendorQuots : submittedVendorQuots;
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-blue-600" />
              Quotation Requests
            </h1>
            <p className="text-sm text-slate-500 mt-1">Submit your price quotes for activities in issued Purchase Orders.</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-blue-500 font-bold uppercase">Open Requests</p>
              <p className="text-xl font-black text-blue-700">{openVendorQuots.length}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-green-500 font-bold uppercase">Submitted</p>
              <p className="text-xl font-black text-green-700">{submittedVendorQuots.length}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-1 border-b-2 border-slate-100">
          {(['open', 'submitted'] as VendorTab[]).map(t => (
            <button key={t} onClick={() => setVendorTab(t)}
              className={cn("px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-[2px]",
                vendorTab === t ? "border-[#1B4F72] text-[#1B4F72]" : "border-transparent text-slate-500 hover:text-slate-700"
              )}>
              {t === 'open' ? 'Open Requests' : 'My Submissions'}
            </button>
          ))}
        </div>

        {displayQuots.length === 0 ? (
          <Card className="p-16 text-center">
            <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-lg font-bold text-slate-500">
              {vendorTab === 'open' ? 'No open quotation requests' : 'No submitted quotations yet'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {vendorTab === 'open' ? 'You will be notified when a new quotation request is raised.' : 'Submit quotes to see them here.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayQuots.map(quot => {
              const submission = quot.submissions[u.id];
              const isActive = activeVendorQuot === quot.id;
              return (
                <Card key={quot.id} className={cn("p-0 overflow-hidden border-l-4 transition-colors",
                  isActive ? "border-l-blue-500" : submission ? "border-l-green-500" : "border-l-amber-500"
                )}>
                  <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">PO: {quot.poNumber}</span>
                        <Badge variant={quot.status === 'open' ? 'blue' : 'warning'} className="text-[10px]">{quot.status.toUpperCase()}</Badge>
                        {submission && <Badge variant={submission.status === 'submitted' ? 'success' : 'warning'} className="text-[10px]">
                          {submission.status === 'submitted' ? 'SUBMITTED' : 'DRAFT'}
                        </Badge>}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Requested by: {quot.requestedByName} · {quot.createdAt}
                        {quot.dueDate && ` · Due: ${quot.dueDate}`}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{quot.items.length} line items to quote</p>
                    </div>
                    <div className="flex gap-2">
                      {submission?.status === 'submitted' ? (
                        <Button size="sm" variant="secondary" onClick={() => setActiveVendorQuot(isActive ? null : quot.id)}>
                          {isActive ? 'Close' : 'View My Quote'}
                        </Button>
                      ) : (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { startQuoting(quot); }}>
                          {submission ? 'Edit Draft' : 'Submit Quote'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {isActive && (
                    <div className="border-t border-slate-100 bg-slate-50 p-6 space-y-4">
                      {quot.remarks && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                          <strong>Remarks from requester:</strong> {quot.remarks}
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="text-left p-2 text-xs font-bold text-slate-600">#</th>
                              <th className="text-left p-2 text-xs font-bold text-slate-600">Activity</th>
                              <th className="text-left p-2 text-xs font-bold text-slate-600">Product</th>
                              <th className="text-left p-2 text-xs font-bold text-slate-600">Crop</th>
                              <th className="text-left p-2 text-xs font-bold text-slate-600">Region</th>
                              <th className="text-left p-2 text-xs font-bold text-slate-600">Est. Qty</th>
                              <th className="text-left p-2 text-xs font-bold text-slate-600">Unit</th>
                              <th className="text-left p-2 text-xs font-bold text-slate-600 min-w-[140px]">Your Price / Unit (₹)</th>
                              <th className="text-right p-2 text-xs font-bold text-slate-600">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quot.items.map((item, idx) => {
                              const price = draftPrices[item.id] || 0;
                              const subtotal = price * (item.estimatedQuantity || 1);
                              const disabled = submission?.status === 'submitted';
                              return (
                                <tr key={item.id} className="border-t border-slate-100 bg-white">
                                  <td className="p-2 text-xs text-slate-400">{idx + 1}</td>
                                  <td className="p-2 text-xs font-medium text-slate-700">{item.activity}</td>
                                  <td className="p-2"><Badge variant="blue" className="text-[9px]">{item.product}</Badge></td>
                                  <td className="p-2 text-xs text-slate-600">{item.crop}</td>
                                  <td className="p-2 text-xs text-slate-500">{item.region || '—'}</td>
                                  <td className="p-2 text-xs text-slate-600">{item.estimatedQuantity || '—'}</td>
                                  <td className="p-2 text-xs text-slate-500">{item.unit || 'per event'}</td>
                                  <td className="p-2">
                                    {disabled ? (
                                      <span className="font-mono font-bold text-sm text-slate-800">₹{price.toLocaleString()}</span>
                                    ) : (
                                      <input
                                        type="number"
                                        value={price || ''}
                                        onChange={e => setDraftPrices(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                                        className="w-full border border-slate-200 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-blue-400"
                                        placeholder="0"
                                      />
                                    )}
                                  </td>
                                  <td className="p-2 text-right font-bold text-sm text-slate-800">
                                    ₹{subtotal.toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-100 border-t-2 border-slate-300">
                              <td colSpan={8} className="p-2 text-right font-black text-slate-700 text-sm">TOTAL QUOTED AMOUNT</td>
                              <td className="p-2 text-right font-black text-[#1B4F72] text-base">
                                ₹{Object.entries(draftPrices).reduce((s, [id, price]) => {
                                  const item = quot.items.find(it => it.id === id);
                                  return s + (price * (item?.estimatedQuantity || 1));
                                }, 0).toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {submission?.status !== 'submitted' && (
                        <>
                          <div className="space-y-1">
                            <Label>Remarks (Optional)</Label>
                            <textarea
                              value={draftRemarks}
                              onChange={e => setDraftRemarks(e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 min-h-[60px]"
                              placeholder="Any notes or conditions..."
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setActiveVendorQuot(null)}>Cancel</Button>
                            <Button variant="secondary" onClick={() => handleSaveDraft(quot)}>Save as Draft</Button>
                            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleSubmitQuote(quot)}>
                              <Send className="w-4 h-4 mr-2" />
                              Submit Quotation
                            </Button>
                          </div>
                        </>
                      )}
                      {submission?.status === 'submitted' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex items-center gap-2">
                          ✅ Your quotation was submitted on {submission.submittedAt}. It is now under review.
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── ADMIN VIEW ────────────────────────────────────────────────────────────
  const totalResponses = quotations.reduce((s, q) => s + Object.keys(q.submissions).length, 0);
  const pendingResponses = quotations.filter(q => q.status === 'open' && q.vendorIds.some(vid => !q.submissions[vid])).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-purple-600" />
            Quotation Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Issue quotation requests to vendors for PO activities and review their pricing submissions.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-[#1B4F72] hover:bg-[#153d5a] text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Quotation Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-[#1B4F72]">
          <p className="text-xs text-slate-500 font-bold uppercase">Total Requests</p>
          <p className="text-2xl font-black text-slate-800">{quotations.length}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-xs text-slate-500 font-bold uppercase">Open</p>
          <p className="text-2xl font-black text-amber-600">{quotations.filter(q => q.status === 'open').length}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-500">
          <p className="text-xs text-slate-500 font-bold uppercase">Total Responses</p>
          <p className="text-2xl font-black text-green-600">{totalResponses}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <p className="text-xs text-slate-500 font-bold uppercase">Awaiting Response</p>
          <p className="text-2xl font-black text-red-600">{pendingResponses}</p>
        </Card>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b-2 border-slate-100">
        {(['requests', 'responses'] as AdminTab[]).map(t => (
          <button key={t} onClick={() => setAdminTab(t)}
            className={cn("px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-[2px]",
              adminTab === t ? "border-[#1B4F72] text-[#1B4F72]" : "border-transparent text-slate-500 hover:text-slate-700"
            )}>
            {t === 'requests' ? 'Quotation Requests' : 'Vendor Responses'}
          </button>
        ))}
      </div>

      {/* Requests Tab */}
      {adminTab === 'requests' && (
        <div className="space-y-4">
          {quotations.length === 0 ? (
            <Card className="p-16 text-center">
              <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-lg font-bold text-slate-500">No quotation requests yet</p>
              <p className="text-sm text-slate-400 mt-1">Click "New Quotation Request" to invite vendors to quote.</p>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              <Table>
                <thead>
                  <tr><Th>PO Number</Th><Th>Vendors Invited</Th><Th>Line Items</Th><Th>Responses</Th><Th>Status</Th><Th>Due Date</Th><Th>Created By</Th><Th>Actions</Th></tr>
                </thead>
                <tbody>
                  {quotations.map(quot => {
                    const invited = quot.vendorIds.length;
                    const responded = Object.keys(quot.submissions).length;
                    return (
                      <tr key={quot.id} className="hover:bg-slate-50">
                        <Td className="font-bold text-[#1B4F72]">{quot.poNumber}</Td>
                        <Td>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span className="text-sm">{invited}</span>
                          </div>
                        </Td>
                        <Td>{quot.items.length}</Td>
                        <Td>
                          <span className={cn("text-sm font-bold", responded === invited ? "text-green-600" : responded > 0 ? "text-amber-600" : "text-red-500")}>
                            {responded}/{invited}
                          </span>
                        </Td>
                        <Td>
                          <Badge variant={quot.status === 'open' ? 'blue' : 'warning'} className="text-[10px] uppercase">{quot.status}</Badge>
                        </Td>
                        <Td className="text-xs text-slate-500">{quot.dueDate || '—'}</Td>
                        <Td className="text-xs text-slate-500">{quot.requestedByName}</Td>
                        <Td>
                          <div className="flex gap-1">
                            <Button size="sm" variant="secondary" onClick={() => {
                              setSelectedQuot(quot.id);
                              setAdminTab('responses');
                            }}>
                              <Eye className="w-3 h-3 mr-1" />
                              Responses
                            </Button>
                            {quot.status === 'open' && (
                              <Button size="sm" variant="outline" onClick={() => updateQuotation(quot.id, { status: 'closed' })}>
                                Close
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => deleteQuotation(quot.id)}>
                              ✕
                            </Button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card>
          )}
        </div>
      )}

      {/* Responses Tab */}
      {adminTab === 'responses' && (
        <div className="space-y-4">
          {/* Filter by quotation */}
          <div className="flex items-center gap-4">
            <Label>Filter by Quotation Request:</Label>
            <Select value={selectedQuot || ''} onChange={e => setSelectedQuot(e.target.value || null)} className="w-72">
              <option value="">All Responses</option>
              {quotations.map(q => (
                <option key={q.id} value={q.id}>PO: {q.poNumber} — {q.createdAt}</option>
              ))}
            </Select>
          </div>

          {(() => {
            const filteredQuots = selectedQuot ? quotations.filter(q => q.id === selectedQuot) : quotations;
            const allResponses = filteredQuots.flatMap(q =>
              Object.values(q.submissions).map(sub => ({ quot: q, sub }))
            );

            if (allResponses.length === 0) {
              return (
                <Card className="p-12 text-center">
                  <p className="text-slate-500 font-semibold">No vendor responses yet.</p>
                  <p className="text-slate-400 text-sm mt-1">Vendors will appear here after submitting their quotations.</p>
                </Card>
              );
            }

            return (
              <div className="space-y-4">
                {filteredQuots.map(quot => {
                  const subs = Object.values(quot.submissions);
                  if (subs.length === 0) return null;
                  return (
                    <Card key={quot.id} className="p-0 overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-700">PO: {quot.poNumber}</span>
                          <span className="text-xs text-slate-400 ml-3">Due: {quot.dueDate || 'No deadline'}</span>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => exportResponses(quot)}>
                          📊 Export Excel
                        </Button>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {subs.map(sub => {
                          const isExpanded = expandedSubmission === `${quot.id}-${sub.vendorId}`;
                          return (
                            <div key={sub.vendorId} className="p-4">
                              <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => setExpandedSubmission(isExpanded ? null : `${quot.id}-${sub.vendorId}`)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#1B4F72] flex items-center justify-center text-white text-xs font-bold">
                                    {sub.vendorName[0]}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-800 text-sm">{sub.vendorName}</p>
                                    <p className="text-xs text-slate-500">Submitted: {sub.submittedAt}</p>
                                  </div>
                                  <Badge variant={sub.status === 'submitted' ? 'success' : 'warning'} className="text-[9px] uppercase">{sub.status}</Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <p className="font-black text-[#1B4F72] text-sm">₹{sub.totalQuotedAmount.toLocaleString()}</p>
                                    <p className="text-xs text-slate-400">Total Quote</p>
                                  </div>
                                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="mt-4 overflow-x-auto">
                                  <table className="w-full border-collapse text-xs">
                                    <thead>
                                      <tr className="bg-slate-50">
                                        <th className="text-left p-2 font-bold text-slate-600">Activity</th>
                                        <th className="text-left p-2 font-bold text-slate-600">Product</th>
                                        <th className="text-left p-2 font-bold text-slate-600">Crop</th>
                                        <th className="text-left p-2 font-bold text-slate-600">Region</th>
                                        <th className="text-right p-2 font-bold text-slate-600">Quoted Price/Unit (₹)</th>
                                        <th className="text-right p-2 font-bold text-slate-600">Est. Qty</th>
                                        <th className="text-right p-2 font-bold text-slate-600">Subtotal (₹)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sub.quotedItems.map((qi, idx) => {
                                        const item = quot.items.find(i => i.id === qi.itemId);
                                        const subtotal = qi.quotedPricePerUnit * (item?.estimatedQuantity || 1);
                                        return (
                                          <tr key={idx} className="border-t border-slate-100">
                                            <td className="p-2 font-medium text-slate-700">{qi.activity}</td>
                                            <td className="p-2">
                                              <Badge variant="blue" className="text-[9px]">{qi.product}</Badge>
                                            </td>
                                            <td className="p-2 text-slate-600">{qi.crop}</td>
                                            <td className="p-2 text-slate-500">{qi.region || '—'}</td>
                                            <td className="p-2 text-right font-mono font-bold text-slate-800">₹{qi.quotedPricePerUnit.toLocaleString()}</td>
                                            <td className="p-2 text-right text-slate-600">{item?.estimatedQuantity || '—'}</td>
                                            <td className="p-2 text-right font-bold text-[#1B4F72]">₹{subtotal.toLocaleString()}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                    <tfoot>
                                      <tr className="bg-slate-50 border-t-2 border-slate-200">
                                        <td colSpan={6} className="p-2 text-right font-black text-slate-700">TOTAL</td>
                                        <td className="p-2 text-right font-black text-[#1B4F72] text-base">₹{sub.totalQuotedAmount.toLocaleString()}</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                  {sub.remarks && (
                                    <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded text-xs text-slate-600">
                                      <strong>Vendor Remarks:</strong> {sub.remarks}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Create Quotation Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Quotation Request" width="max-w-4xl">
        <div className="space-y-6">
          {/* PO Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label required>Select Purchase Order</Label>
              <Select value={createForm.poId} onChange={e => setCreateForm(f => ({ ...f, poId: e.target.value }))}>
                <option value="">Select PO...</option>
                {approvedPOs.map(p => (
                  <option key={p.id} value={p.id}>{p.poNumber} — ₹{(p.budget / 100000).toFixed(1)}L</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Due Date (Optional)</Label>
              <Input type="date" value={createForm.dueDate} onChange={e => setCreateForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>

          {/* Vendor Selection */}
          <div className="space-y-2">
            <Label required>Select Vendors to Invite</Label>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 min-h-[48px]">
              {vendors.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No active vendors found.</p>
              ) : vendors.map(v => {
                const selected = createForm.vendorIds.includes(v.id);
                return (
                  <button key={v.id} onClick={() => handleVendorToggle(v.id)}
                    className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                      selected ? "bg-[#1B4F72] text-white border-[#1B4F72]" : "bg-white text-slate-600 border-slate-300 hover:border-[#1B4F72]"
                    )}>
                    {v.territory?.tradeName || v.name}
                  </button>
                );
              })}
            </div>
            {createForm.vendorIds.length > 0 && (
              <p className="text-xs text-green-600 font-medium">{createForm.vendorIds.length} vendor(s) selected</p>
            )}
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label required>Activity Line Items</Label>
              <Button size="sm" variant="secondary" onClick={handleAddItem}>
                <Plus className="w-3 h-3 mr-1" />
                Add Line Item
              </Button>
            </div>

            {createForm.items.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-lg">
                <p className="text-sm text-slate-400">No items yet. Click "Add Line Item" to define activities.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-2 text-left text-xs font-bold text-slate-600">Activity</th>
                      <th className="p-2 text-left text-xs font-bold text-slate-600">Product</th>
                      <th className="p-2 text-left text-xs font-bold text-slate-600">Crop</th>
                      <th className="p-2 text-left text-xs font-bold text-slate-600">Region</th>
                      <th className="p-2 text-left text-xs font-bold text-slate-600">Est. Qty</th>
                      <th className="p-2 text-left text-xs font-bold text-slate-600">Unit</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {createForm.items.map((item, idx) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="p-1.5">
                          <Select value={item.activity} onChange={e => handleItemChange(idx, 'activity', e.target.value)} className="h-8 text-xs">
                            <option value="">Select...</option>
                            {activities.map(a => <option key={a} value={a}>{a}</option>)}
                          </Select>
                        </td>
                        <td className="p-1.5">
                          <Select value={item.product} onChange={e => handleItemChange(idx, 'product', e.target.value)} className="h-8 text-xs">
                            <option value="">Select...</option>
                            {products.map(p => <option key={p} value={p}>{p}</option>)}
                          </Select>
                        </td>
                        <td className="p-1.5">
                          <Select value={item.crop} onChange={e => handleItemChange(idx, 'crop', e.target.value)} className="h-8 text-xs">
                            <option value="">Select...</option>
                            {crops.map(c => <option key={c} value={c}>{c}</option>)}
                          </Select>
                        </td>
                        <td className="p-1.5">
                          <Input value={item.region || ''} onChange={e => handleItemChange(idx, 'region', e.target.value)} className="h-8 text-xs" placeholder="Region" />
                        </td>
                        <td className="p-1.5">
                          <Input type="number" value={item.estimatedQuantity || ''} onChange={e => handleItemChange(idx, 'estimatedQuantity', Number(e.target.value))} className="h-8 text-xs w-20" placeholder="Qty" />
                        </td>
                        <td className="p-1.5">
                          <Input value={item.unit || ''} onChange={e => handleItemChange(idx, 'unit', e.target.value)} className="h-8 text-xs w-24" placeholder="per event" />
                        </td>
                        <td className="p-1.5">
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 h-7 w-7 p-0" onClick={() => handleRemoveItem(idx)}>✕</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <Label>Remarks / Instructions for Vendors</Label>
            <textarea
              value={createForm.remarks}
              onChange={e => setCreateForm(f => ({ ...f, remarks: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F72] min-h-[60px]"
              placeholder="Instructions, scope, or notes for vendors..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button
              className="bg-[#1B4F72] hover:bg-[#153d5a] text-white"
              onClick={handleCreateQuotation}
              disabled={!createForm.poId || createForm.vendorIds.length === 0 || createForm.items.length === 0}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Quotation Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
