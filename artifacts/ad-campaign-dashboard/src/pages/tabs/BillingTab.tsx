import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Button, Table, Th, Td, Badge, Modal, Label, Input, Textarea, cn, Select } from '../../components/ui';
import { formatCurrency } from '../../lib/mock-data';
import { Bill, ServiceReceiver, VendorProfile, GST_STATES } from '../../types';

export default function BillingTab() {
  const { 
    currentUser, bills, entries, users, 
    serviceReceivers, addServiceReceiver, updateServiceReceiver, deleteServiceReceiver,
    vendorProfiles, updateVendorProfile,
    updateBill
  } = useAppContext();
  const u = currentUser!;
  const isVendor = u.role === 'Vendor';
  
  const [activeTab, setActiveTab] = useState<'bills' | 'receivers' | 'myprofile'>('bills');
  const [activeBillId, setActiveBillId] = useState<string | null>(null);

  // Scoped billings
  const visBillings = useMemo(() => {
    let list = bills;
    if (isVendor) {
      list = bills.filter(b => b.vendorId === u.id);
    } else if (u.role === 'Regional Manager') {
      list = bills.filter(b => b.entryIds.some(eid => {
        const e = entries.find(x => x.id === eid);
        return e?.rmId === u.id || (e && users.find(ux => ux.id === e.userId)?.territory?.region === u.territory?.region);
      }));
    } else if (u.role === 'Zonal Manager') {
      list = bills.filter(b => b.entryIds.some(eid => {
        const e = entries.find(x => x.id === eid);
        const eu = e && users.find(x => x.id === e.userId);
        return eu?.territory?.zone === u.territory?.zone && eu?.territory?.region === u.territory?.region;
      }));
    }
    return [...list].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [bills, isVendor, u, entries, users]);

  // Set first bill as active if none selected
  useMemo(() => {
    if (!activeBillId && visBillings.length > 0) {
      setActiveBillId(visBillings[0].id);
    }
  }, [visBillings, activeBillId]);

  const totalBills = visBillings.length;
  const draftCnt = visBillings.filter(b => b.status === 'draft').length;
  const submittedCnt = visBillings.filter(b => b.status === 'submitted').length;
  const paidCnt = visBillings.filter(b => b.status === 'paid').length;
  
  const totalAmt = visBillings.reduce((s, b) => s + (b.activityAmount || b.totalAmount || 0), 0);
  const pendingAmt = visBillings.filter(b => b.status === 'submitted').reduce((s, b) => s + (b.totalAmount || 0), 0);
  const paidAmt = visBillings.filter(b => b.status === 'paid').reduce((s, b) => s + (b.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">🧾 Billing Section</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isVendor 
              ? 'Prepare GST tax invoices for your approved activities and manage service receiver details.' 
              : 'Review and process vendor bills & tax invoices.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-green-700 text-white hover:bg-green-800 border-none">⬇️ All Bills Excel</Button>
          <Button variant="outline" className="bg-[#1B4F72] text-white hover:bg-[#153d5a] border-none">📄 All Bills PDF</Button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b-2 border-slate-100">
        <button 
          onClick={() => setActiveTab('bills')}
          className={cn(
            "px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-[2px]",
            activeTab === 'bills' ? "border-[#1B4F72] text-[#1B4F72]" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          📋 Bills
        </button>
        {isVendor && (
          <>
            <button 
              onClick={() => setActiveTab('receivers')}
              className={cn(
                "px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-[2px]",
                activeTab === 'receivers' ? "border-[#1B4F72] text-[#1B4F72]" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              🏢 Service Receivers
            </button>
            <button 
              onClick={() => setActiveTab('myprofile')}
              className={cn(
                "px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-[2px]",
                activeTab === 'myprofile' ? "border-[#C2410C] text-[#C2410C]" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              🏪 My Details
            </button>
          </>
        )}
      </div>

      {activeTab === 'bills' && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-l-4 border-l-[#1B4F72]">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Bills</p>
              <p className="text-2xl font-black text-slate-800">{totalBills}</p>
              <p className="text-[10px] text-slate-400 mt-1">{draftCnt} draft · {submittedCnt} submitted · {paidCnt} paid</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-[#6D28D9]">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Billed</p>
              <p className="text-2xl font-black text-[#6D28D9]">₹{(totalAmt / 100000).toFixed(1)}L</p>
              <p className="text-[10px] text-slate-400 mt-1">Base amount excl. GST</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-[#C2410C]">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Payment</p>
              <p className="text-2xl font-black text-[#C2410C]">₹{(pendingAmt / 100000).toFixed(1)}L</p>
              <p className="text-[10px] text-slate-400 mt-1">{submittedCnt} bills awaiting payment</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-[#16A34A]">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Paid Amount</p>
              <p className="text-2xl font-black text-[#16A34A]">₹{(paidAmt / 100000).toFixed(1)}L</p>
              <p className="text-[10px] text-slate-400 mt-1">{paidCnt} bills paid</p>
            </Card>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
            {/* Left Column: Bill List */}
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase">📋 Bills ({visBillings.length})</span>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {visBillings.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-sm font-semibold text-slate-600">No bills yet</p>
                    <p className="text-xs mt-1">
                      {isVendor ? 'Go to Vendor Section → Select approved activities → Raise Bill.' : 'Bills raised by vendors will appear here.'}
                    </p>
                  </div>
                ) : (
                  visBillings.map(b => (
                    <div 
                      key={b.id}
                      onClick={() => setActiveBillId(b.id)}
                      className={cn(
                        "p-4 cursor-pointer border-b border-slate-50 transition-all border-l-4",
                        activeBillId === b.id ? "bg-blue-50 border-l-[#1B4F72]" : "hover:bg-slate-50 border-l-transparent"
                      )}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#1B4F72] truncate">{b.invoiceNumber || b.id.slice(-8)}</p>
                          <p className="text-[11px] text-slate-500 truncate">{b.vendorName}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{b.createdAt} · {b.entryIds.length} activities</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-slate-700">₹{(b.totalAmount / 100000).toFixed(2)}L</p>
                          <p className="text-[10px] text-slate-400 italic">incl. GST</p>
                          <Badge 
                            variant={b.status === 'paid' ? 'success' : b.status === 'submitted' ? 'blue' : 'warning'}
                            className="mt-1 text-[9px] px-1 py-0 uppercase"
                          >
                            {b.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Right Column: Bill Detail / Invoice */}
            <div id="billing-detail-panel">
              {activeBillId ? (
                <InvoiceDetail billId={activeBillId} />
              ) : (
                <Card className="p-16 flex flex-col items-center justify-center text-slate-400">
                  <div className="text-6xl mb-4">🧾</div>
                  <p className="text-lg font-bold text-slate-600">Select a bill to view invoice</p>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'receivers' && isVendor && <ServiceReceiversTab />}
      {activeTab === 'myprofile' && isVendor && <MyProfileTab />}
    </div>
  );
}

// Helper for GST state codes
const getGstStateCode = (gst?: string) => {
  if (!gst || gst.length < 2) return '';
  const code = gst.substring(0, 2);
  if (/^\d{2}$/.test(code)) return code;
  return '';
};

function InvoiceDetail({ billId }: { billId: string }) {
  const { bills, entries, updateBill, currentUser, vendorProfiles, serviceReceivers } = useAppContext();
  const bill = bills.find(b => b.id === billId);
  const isVendor = currentUser?.role === 'Vendor';

  if (!bill) return null;

  const vp = vendorProfiles[bill.vendorId];
  const vt = currentUser?.id === bill.vendorId ? currentUser.territory : {};
  
  // Helper to resolve fields: Bill -> Profile -> User Territory -> Fallback
  const spf = (billKey: keyof Bill, profileKey: keyof VendorProfile, fallback: string) => {
    if (bill[billKey] !== undefined && bill[billKey] !== '') return String(bill[billKey]);
    if (vp && vp[profileKey]) return String(vp[profileKey]);
    // @ts-ignore
    if (vt && vt[profileKey]) return String(vt[profileKey]);
    return fallback;
  };

  const billEntries = entries.filter(e => bill.entryIds.includes(e.id));
  const activityAmt = bill.activityAmount || billEntries.reduce((s, e) => s + (e.amount || 0), 0);
  const svcChargePct = bill.serviceChargePct || 0;
  const svcChargeAmt = bill.serviceChargeAmt || 0;
  const baseAmount = activityAmt + svcChargeAmt;
  const gstRate = bill.gstRate || 18;

  // GST Logic
  const vendorGST = spf('spGST', 'gst', '');
  const receiver = serviceReceivers.find(r => r.id === bill.serviceReceiverId) || bill.receiverDetails;
  const receiverGST = receiver?.gst || '';
  
  const vCode = getGstStateCode(vendorGST);
  const rCode = getGstStateCode(receiverGST);
  const isIGST = vCode && rCode && vCode !== rCode;
  
  const vState = GST_STATES[vCode] || vCode || '—';
  const rState = GST_STATES[rCode] || rCode || '—';

  const cgst = isIGST ? 0 : Math.round(baseAmount * gstRate / 2 / 100);
  const sgst = isIGST ? 0 : Math.round(baseAmount * gstRate / 2 / 100);
  const igst = isIGST ? Math.round(baseAmount * gstRate / 100) : 0;
  const gstAmount = isIGST ? igst : cgst + sgst;
  const totalWithGST = baseAmount + gstAmount;

  const canEdit = isVendor && (bill.status === 'draft' || bill.status === 'submitted');

  const handleUpdateField = (field: keyof Bill, value: any) => {
    updateBill(bill.id, { [field]: value });
  };

  const handleUpdateEntry = (entryId: string, field: 'particulars' | 'hsn', value: string) => {
    const entryDetails = { ...(bill.entryDetails || {}) };
    entryDetails[entryId] = { ...(entryDetails[entryId] || {}), [field]: value };
    updateBill(bill.id, { entryDetails });
  };

  const handleUpdateSvc = (type: 'pct' | 'amt', val: string) => {
    const v = parseFloat(val) || 0;
    if (type === 'pct') {
      const amt = Math.round(activityAmt * v / 100);
      updateBill(bill.id, { serviceChargePct: v, serviceChargeAmt: amt });
    } else {
      updateBill(bill.id, { serviceChargeAmt: v, serviceChargePct: 0 });
    }
  };

  const handleStatusChange = (newStatus: 'submitted' | 'paid') => {
    const updates: Partial<Bill> = { 
      status: newStatus,
      totalAmount: totalWithGST,
      activityAmount: activityAmt
    };
    if (newStatus === 'submitted') updates.submittedAt = new Date().toISOString().split('T')[0];
    if (newStatus === 'paid') updates.paidAt = new Date().toISOString().split('T')[0];
    updateBill(billId, updates);
  };

  return (
    <Card className="p-0 overflow-hidden bg-white shadow-xl border border-slate-200 print:shadow-none print:border-none">
      {/* Header Bar */}
      <div className="bg-gradient-to-br from-[#1B4F72] to-[#2C82B0] p-6 text-white flex justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tight">Tax Invoice</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-mono opacity-80">{bill.invoiceNumber || bill.id}</span>
            <Badge variant={bill.status === 'paid' ? 'success' : bill.status === 'submitted' ? 'blue' : 'warning'} className="uppercase text-[10px] py-0">
              {bill.status}
            </Badge>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-3">
          <div className="text-xs opacity-80">
            <p>Bill Date: <strong>{bill.date || bill.createdAt}</strong></p>
          </div>
          <div className="flex gap-2 no-print">
            {bill.status === 'draft' && isVendor && (
              <Button onClick={() => handleStatusChange('submitted')} size="sm" className="bg-orange-600 hover:bg-orange-700 text-white border-none shadow-lg">📤 Submit Bill</Button>
            )}
            {bill.status === 'submitted' && isVendor && (
               <Button onClick={() => handleUpdateField('status', 'draft')} size="sm" variant="outline" className="bg-white/10 border-white/40 text-white hover:bg-white/20">✏️ Re-open Draft</Button>
            )}
            {bill.status === 'submitted' && !isVendor && (
              <Button onClick={() => handleStatusChange('paid')} size="sm" className="bg-green-600 hover:bg-green-700 text-white border-none">✅ Mark Paid</Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.print()} className="bg-white/10 border-white/40 text-white hover:bg-white/20">🖨️ PDF</Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Bill To / Bill From */}
        <div className="grid grid-cols-2 gap-6">
          {/* Bill To */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">🏢 Bill To — Service Receiver</h3>
            {canEdit ? (
              <div className="mb-4 space-y-2">
                <Label className="text-[10px] text-slate-500 font-bold">Change Receiver</Label>
                <Select 
                  value={bill.serviceReceiverId || ''} 
                  onChange={(e) => {
                    const r = serviceReceivers.find(x => x.id === e.target.value);
                    updateBill(bill.id, { serviceReceiverId: e.target.value, receiverDetails: r ? { ...r } : undefined });
                  }}
                  className="h-8 text-xs bg-white"
                >
                  <option value="">— Select Receiver —</option>
                  {serviceReceivers.filter(r => r.vendorId === bill.vendorId).map(r => (
                    <option key={r.id} value={r.id}>{r.companyName} ({r.gst})</option>
                  ))}
                </Select>
              </div>
            ) : null}
            <div className="space-y-1">
              <p className="font-bold text-slate-900">{receiver?.companyName || '—'}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-slate-700">GSTIN: <span className="font-mono font-bold uppercase">{receiver?.gst || '—'}</span></p>
                {rState !== '—' && <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">{rState}</span>}
              </div>
              {receiver?.address && <p className="text-xs text-slate-500 border-t border-blue-100/50 pt-2 mt-2 italic leading-relaxed">{receiver.address}</p>}
            </div>
            {isIGST ? (
              <div className="mt-4 p-2 bg-red-50 text-red-700 text-[10px] font-bold rounded flex items-center gap-2 border border-red-100">
                ⚠️ INTER-STATE (IGST) — {vState} → {rState}
              </div>
            ) : (
              receiverGST && <div className="mt-4 p-2 bg-green-50 text-green-700 text-[10px] font-bold rounded flex items-center gap-2 border border-green-100">
                ✅ INTRA-STATE (CGST+SGST) — {rState}
              </div>
            )}
          </div>

          {/* Bill From */}
          <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4">
            <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4">🏪 Bill From — Service Provider</h3>
            {canEdit ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px] text-slate-500 font-bold uppercase">Company Name</Label>
                  <Input value={spf('spTradeName', 'tradeName', '')} onChange={e => handleUpdateField('spTradeName', e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-slate-500 font-bold uppercase">GSTIN</Label>
                  <Input value={spf('spGST', 'gst', '')} onChange={e => handleUpdateField('spGST', e.target.value)} className="h-8 text-xs font-mono" maxLength={15} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-slate-500 font-bold uppercase">PAN</Label>
                  <Input value={spf('spPAN', 'pan', '')} onChange={e => handleUpdateField('spPAN', e.target.value)} className="h-8 text-xs font-mono uppercase" maxLength={10} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px] text-slate-500 font-bold uppercase">Address</Label>
                  <Textarea value={spf('spAddress', 'address', '')} onChange={e => handleUpdateField('spAddress', e.target.value)} className="text-xs p-2 min-h-[40px]" rows={2} />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-bold text-slate-900">{spf('spTradeName', 'tradeName', bill.vendorName)}</p>
                <p className="text-xs text-slate-700">GSTIN: <span className="font-mono font-bold uppercase">{spf('spGST', 'gst', '—')}</span></p>
                <p className="text-xs text-slate-700">PAN: <span className="font-mono font-bold uppercase">{spf('spPAN', 'pan', '—')}</span></p>
                <p className="text-xs text-slate-500 border-t border-orange-100/50 pt-2 mt-2 italic whitespace-pre-wrap leading-relaxed">{spf('spAddress', 'address', '—')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Particulars Table */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-100">
            <span className="text-sm font-black text-slate-700 uppercase tracking-tight">📝 Particulars of Service</span>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <Table>
              <thead>
                <tr className="bg-slate-50">
                  <Th className="text-[10px] py-2 w-8">#</Th>
                  <Th className="text-[10px] py-2">Particulars / Description</Th>
                  <Th className="text-[10px] py-2 w-24">HSN/SAC</Th>
                  <Th className="text-[10px] py-2">Date</Th>
                  <Th className="text-[10px] py-2">Area</Th>
                  <Th className="text-[10px] py-2">Product</Th>
                  <Th className="text-[10px] py-2 text-right">Amount</Th>
                </tr>
              </thead>
              <tbody>
                {billEntries.map((e, idx) => {
                  const det = (bill.entryDetails || {})[e.id] || {};
                  return (
                    <tr key={e.id} className="border-t border-slate-100">
                      <Td className="text-[10px] text-slate-400 font-mono">{idx + 1}</Td>
                      <Td>
                        {canEdit ? (
                          <Input 
                            value={det.particulars || ''} 
                            placeholder={e.activity} 
                            onChange={(ev) => handleUpdateEntry(e.id, 'particulars', ev.target.value)}
                            className="h-7 text-[11px] py-1 px-2 border-slate-200"
                          />
                        ) : (
                          <span className="text-[11px] font-medium text-slate-700">{det.particulars || e.activity}</span>
                        )}
                      </Td>
                      <Td>
                        {canEdit ? (
                          <Input 
                            value={det.hsn || ''} 
                            placeholder="998599" 
                            onChange={(ev) => handleUpdateEntry(e.id, 'hsn', ev.target.value)}
                            className="h-7 text-[11px] py-1 px-2 font-mono"
                          />
                        ) : (
                          <span className="text-[11px] font-mono text-slate-500">{det.hsn || '—'}</span>
                        )}
                      </Td>
                      <Td className="text-[10px] whitespace-nowrap">{e.date}</Td>
                      <Td className="text-[11px] font-bold text-slate-700">{e.area}</Td>
                      <Td><Badge variant="blue" className="text-[9px] px-1.5 py-0">{e.product}</Badge></Td>
                      <Td className="text-right font-bold text-slate-900 text-xs">{formatCurrency(e.amount)}</Td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-200">
                <tr className="bg-slate-50/50">
                  <Td colSpan={6} className="text-right font-bold text-slate-600 text-[11px]">SUBTOTAL (ACTIVITY AMOUNT)</Td>
                  <Td className="text-right font-black text-slate-900 text-xs">{formatCurrency(activityAmt)}</Td>
                </tr>
                { (svcChargeAmt > 0 || canEdit) && (
                  <tr className="bg-green-50/30">
                    <Td colSpan={6} className="text-right font-bold text-green-700 text-[11px]">
                      {canEdit ? (
                        <div className="flex items-center justify-end gap-2">
                          <span>Service Charges %</span>
                          <Input 
                            type="number" 
                            value={svcChargePct || ''} 
                            onChange={ev => handleUpdateSvc('pct', ev.target.value)}
                            className="w-16 h-7 text-right text-xs border-green-200"
                            placeholder="%"
                          />
                          <span>OR Amt ₹</span>
                          <Input 
                            type="number" 
                            value={svcChargeAmt || ''} 
                            onChange={ev => handleUpdateSvc('amt', ev.target.value)}
                            className="w-24 h-7 text-right text-xs border-green-200"
                            placeholder="₹"
                          />
                        </div>
                      ) : (
                        `SERVICE CHARGES (${svcChargePct > 0 ? svcChargePct + '%' : 'Flat'})`
                      )}
                    </Td>
                    <Td className="text-right font-black text-green-800 text-xs">{formatCurrency(svcChargeAmt)}</Td>
                  </tr>
                )}
              </tfoot>
            </Table>
          </div>
        </div>

        {/* GST & Totals */}
        <div className="grid grid-cols-[1fr_280px] gap-8">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">🏛️ GST Calculation</h3>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xs font-bold text-slate-700">GST Rate (%):</span>
              {canEdit ? (
                <Select value={gstRate} onChange={ev => handleUpdateField('gstRate', parseInt(ev.target.value))} className="h-8 w-20 text-xs bg-white">
                  {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                </Select>
              ) : (
                <span className="text-sm font-black text-[#1B4F72]">{gstRate}%</span>
              )}
              <Badge variant={isIGST ? 'warning' : 'success'} className="uppercase text-[9px] px-2">
                {isIGST ? 'IGST Applicable' : 'CGST + SGST Applicable'}
              </Badge>
            </div>
            
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-100">
                <tr className="py-2">
                  <td className="py-2 text-slate-600">Activity Amount</td>
                  <td className="py-2 text-right font-bold">{formatCurrency(activityAmt)}</td>
                </tr>
                {svcChargeAmt > 0 && (
                  <tr className="py-2 text-green-700">
                    <td className="py-2">Service Charges</td>
                    <td className="py-2 text-right font-bold">{formatCurrency(svcChargeAmt)}</td>
                  </tr>
                )}
                <tr className="py-2 font-bold bg-white">
                  <td className="py-2 px-2 text-[#1B4F72]">Taxable Value</td>
                  <td className="py-2 px-2 text-right text-[#1B4F72]">{formatCurrency(baseAmount)}</td>
                </tr>
                {isIGST ? (
                  <tr className="py-2 text-orange-700">
                    <td className="py-2">IGST @ {gstRate}%</td>
                    <td className="py-2 text-right font-bold">{formatCurrency(igst)}</td>
                  </tr>
                ) : (
                  <>
                    <tr className="py-2 text-blue-700">
                      <td className="py-2">CGST @ {gstRate/2}%</td>
                      <td className="py-2 text-right font-bold">{formatCurrency(cgst)}</td>
                    </tr>
                    <tr className="py-2 text-blue-700">
                      <td className="py-2">SGST @ {gstRate/2}%</td>
                      <td className="py-2 text-right font-bold">{formatCurrency(sgst)}</td>
                    </tr>
                  </>
                )}
                <tr className="py-3 font-black text-lg bg-[#1B4F72] text-white rounded-b-lg">
                  <td className="py-3 px-3 uppercase tracking-tighter">Total Payable</td>
                  <td className="py-3 px-3 text-right">{formatCurrency(totalWithGST)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">💰 Summary</h3>
            <div className="bg-gradient-to-br from-[#1B4F72] to-[#2C82B0] rounded-xl p-5 text-white shadow-lg text-center">
               <p className="text-[10px] uppercase opacity-70 tracking-widest font-bold mb-1">Grand Total</p>
               <h4 className="text-3xl font-black mb-2">{formatCurrency(totalWithGST)}</h4>
               <p className="text-[10px] leading-tight opacity-80 italic">Amount in words: {totalWithGST.toLocaleString('en-IN')} Only</p>
               <div className="mt-4 pt-4 border-t border-white/20 text-[10px] flex justify-between">
                 <span>Activities: {formatCurrency(activityAmt)}</span>
                 <span>GST: {formatCurrency(gstAmount)}</span>
               </div>
            </div>
            
            {/* Signature Area */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
               <h3 className="text-[9px] font-black text-slate-400 uppercase mb-4 text-center">✍️ Declaration & Signature</h3>
               { (bill.status === 'submitted' || bill.status === 'paid') ? (
                 <div className="border-2 border-[#1B4F72] rounded-lg p-3 text-center text-[#1B4F72] bg-white">
                    <div className="text-xl mb-1">✅</div>
                    <p className="text-[10px] font-black uppercase">Digitally Signed</p>
                    <p className="text-[9px] opacity-70 mt-1">{bill.spTradeName || bill.vendorName}</p>
                    <p className="text-[8px] font-mono mt-1 opacity-50">{bill.submittedAt}</p>
                 </div>
               ) : (
                 <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center text-slate-400 italic">
                    <p className="text-[10px]">Submit to digitally sign this invoice</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ServiceReceiversTab() {
  const { currentUser, serviceReceivers, addServiceReceiver, updateServiceReceiver, deleteServiceReceiver } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ServiceReceiver | null>(null);
  const [form, setForm] = useState<Omit<ServiceReceiver, 'id' | 'createdAt'>>({
    vendorId: currentUser!.id,
    companyName: '',
    gst: '',
    address: '',
    phone: '',
    email: '',
    contactPerson: ''
  });

  const handleSave = () => {
    if (editing) {
      updateServiceReceiver(editing.id, form);
    } else {
      addServiceReceiver({ ...form, createdAt: new Date().toISOString().split('T')[0] });
    }
    setShowModal(false);
    setEditing(null);
    setForm({ vendorId: currentUser!.id, companyName: '', gst: '', address: '', phone: '', email: '', contactPerson: '' });
  };

  const handleEdit = (r: ServiceReceiver) => {
    setEditing(r);
    setForm({ ...r });
    setShowModal(true);
  };

  const myReceivers = serviceReceivers.filter(r => r.vendorId === currentUser?.id);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">🏢 Service Receivers</h3>
          <p className="text-xs text-slate-500 mt-1">Manage the companies you bill. Their details will be used in "Bill To" section of your invoices.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Add Receiver</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myReceivers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            No service receivers added yet.
          </div>
        ) : (
          myReceivers.map(r => (
            <Card key={r.id} className="p-4 hover:border-blue-300 transition-colors cursor-pointer group" onClick={() => handleEdit(r)}>
              <div className="flex justify-between items-start">
                <div className="font-bold text-slate-800">{r.companyName}</div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEdit(r); }}>✏️</Button>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteServiceReceiver(r.id); }} className="text-red-500 hover:text-red-700">🗑️</Button>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-2 space-y-1">
                <p>GST: <span className="font-mono">{r.gst}</span></p>
                <p className="truncate">Addr: {r.address}</p>
                <p>Contact: {r.contactPerson} ({r.phone})</p>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Receiver" : "Add Service Receiver"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label required>Company Name</Label>
              <Input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="Legal entity name" />
            </div>
            <div className="space-y-1">
              <Label required>GST Number</Label>
              <Input value={form.gst} onChange={e => setForm({ ...form, gst: e.target.value })} placeholder="15-digit GSTIN" />
            </div>
          </div>
          <div className="space-y-1">
            <Label required>Full Address</Label>
            <Textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Registered office address" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Contact Person</Label>
              <Input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} placeholder="Full name" />
            </div>
            <div className="space-y-1">
              <Label>Phone Number</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91..." />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Email Address</Label>
            <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="billing@company.com" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.companyName || !form.gst || !form.address}>
              {editing ? 'Update Receiver' : 'Add Receiver'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function MyProfileTab() {
  const { currentUser, vendorProfiles, updateVendorProfile } = useAppContext();
  const profile = vendorProfiles[currentUser!.id] || {
    vendorId: currentUser!.id,
    tradeName: currentUser!.territory?.tradeName || currentUser!.name,
    vendorCode: currentUser!.territory?.vendorCode || '',
    gst: '',
    address: '',
    phone: currentUser!.phone || '',
    email: currentUser!.email || '',
    bankName: '',
    accountNo: '',
    ifsc: '',
    pan: currentUser!.pan || ''
  };

  const [form, setForm] = useState<VendorProfile>(profile);

  const handleSave = () => {
    updateVendorProfile(currentUser!.id, form);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[#C2410C]">🏪 My Service Provider Details</h3>
        <p className="text-xs text-slate-500 mt-1">These details appear as "Bill From" on all your GST invoices. Fill them once — they'll auto-populate every new bill.</p>
      </div>

      <Card className="p-6 space-y-6 border-t-4 border-t-[#C2410C]">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-orange-100">
            <span className="bg-orange-50 border border-orange-200 rounded px-2 py-1 text-[10px] font-bold text-[#C2410C] uppercase tracking-wider">Business Information</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label required>Trade / Company Name</Label>
              <Input value={form.tradeName} onChange={e => setForm({ ...form, tradeName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label required>Vendor Code</Label>
              <Input value={form.vendorCode} onChange={e => setForm({ ...form, vendorCode: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label required>GST Number</Label>
              <Input value={form.gst} onChange={e => setForm({ ...form, gst: e.target.value })} placeholder="GSTIN" />
            </div>
            <div className="space-y-1">
              <Label>PAN Number</Label>
              <Input value={form.pan} onChange={e => setForm({ ...form, pan: e.target.value })} placeholder="Income Tax PAN" />
            </div>
          </div>
          <div className="space-y-1">
            <Label required>Registered Address</Label>
            <Textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} />
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 pb-2 border-b border-blue-100">
            <span className="bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold text-blue-700 uppercase tracking-wider">Contact & Banking</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Phone Number</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Email Address</Label>
              <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1 col-span-1">
              <Label>Bank Name</Label>
              <Input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} />
            </div>
            <div className="space-y-1 col-span-1">
              <Label>Account Number</Label>
              <Input value={form.accountNo} onChange={e => setForm({ ...form, accountNo: e.target.value })} />
            </div>
            <div className="space-y-1 col-span-1">
              <Label>IFSC Code</Label>
              <Input value={form.ifsc} onChange={e => setForm({ ...form, ifsc: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button className="bg-[#C2410C] hover:bg-[#9a3412] text-white" onClick={handleSave}>Save My Details</Button>
        </div>
      </Card>
    </div>
  );
}
