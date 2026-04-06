import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Button, Table, Th, Td, Badge, Modal, Label, Input, Textarea, cn, Select } from '../../components/ui';
import { formatCurrency } from '../../lib/mock-data';
import { exportToExcel } from '../../lib/utils';
import { Bill, ServiceReceiver, VendorProfile, GST_STATES } from '../../types';

// Number to Indian words conversion (Rupees format)
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert100 = (n: number): string => {
    if (n === 0) return '';
    else if (n < 10) return ones[n];
    else if (n < 20) return teens[n - 10];
    else return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
  };

  const convertBelowThousand = (n: number): string => {
    if (n === 0) return '';
    else if (n < 100) return convert100(n);
    else {
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertBelowThousand(n % 100) : '');
    }
  };

  if (num === 0) return 'Zero';
  
  let crores = Math.floor(num / 10000000);
  let remainder = num % 10000000;
  let lakhs = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousands = Math.floor(remainder / 1000);
  let hundreds = remainder % 1000;

  let words = '';
  if (crores > 0) words += convertBelowThousand(crores) + ' Crore ';
  if (lakhs > 0) words += convertBelowThousand(lakhs) + ' Lakh ';
  if (thousands > 0) words += convertBelowThousand(thousands) + ' Thousand ';
  if (hundreds > 0) words += convertBelowThousand(hundreds) + ' ';

  return words.trim();
}

export default function BillingTab() {
  const { currentUser, crops, bills, entries, users, 
    serviceReceivers, addServiceReceiver, updateServiceReceiver, deleteServiceReceiver,
    vendorProfiles, updateVendorProfile,
    updateBill, pendingBillData, setPendingBillData, addBill
  } = useAppContext();
  const u = currentUser!;
  const isVendor = u.role === 'Vendor';
  
  const [activeTab, setActiveTab] = useState<'bills' | 'receivers' | 'myprofile'>('bills');
  const [activeBillId, setActiveBillId] = useState<string | null>(null);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [previewBill, setPreviewBill] = useState<any>(null);
    const [editInvoiceMode, setEditInvoiceMode] = useState(false);
  const [filterCrop, setFilterCrop] = useState('');

  useEffect(() => {
    if (pendingBillData) {
      setEditingBill(pendingBillData);
      setActiveTab('bills');
      setActiveBillId(null); // Clear any selected bill so form is shown
      // Don't auto-show preview - let user fill form and click preview button
      setShowInvoicePreview(false);
    }
  }, [pendingBillData, entries]);

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

  // Set first bill as active if none selected (but not if editing new bill)
  useMemo(() => {
    if (!activeBillId && !editingBill && visBillings.length > 0) {
      setActiveBillId(visBillings[0].id);
    }
  }, [visBillings, activeBillId, editingBill]);

  const totalBills = visBillings.length;
  const draftCnt = visBillings.filter(b => b.status === 'draft').length;
  const submittedCnt = visBillings.filter(b => b.status === 'submitted').length;
  const paidCnt = visBillings.filter(b => b.status === 'paid').length;
  
  const totalAmt = visBillings.reduce((s, b) => s + (b.activityAmount || b.totalAmount || 0), 0);
  const pendingAmt = visBillings.filter(b => b.status === 'submitted').reduce((s, b) => s + (b.totalAmount || 0), 0);
  const paidAmt = visBillings.filter(b => b.status === 'paid').reduce((s, b) => s + (b.totalAmount || 0), 0);
  const handleSubmitBill = () => {
    if (!editingBill) return;
    const selEntries = entries.filter(e => editingBill.entryIds.includes(e.id));
    const activityAmount = selEntries.reduce((s, e) => s + e.amount, 0);
    const taxable = activityAmount + Number(editingBill.serviceCharge);
    const gstAmt = Math.round(taxable * (editingBill.gstRate / 100));
    const totalAmount = taxable + gstAmt;

    const receiver = serviceReceivers.find(r => r.id === editingBill.serviceReceiverId);

    const newBillId = addBill({
      vendorId: u.id,
      vendorName: u.territory?.tradeName || u.name,
      vendorCode: u.territory?.vendorCode,
      entryIds: editingBill.entryIds,
      activityAmount,
      serviceChargeAmt: Number(editingBill.serviceCharge),
      gstRate: editingBill.gstRate,
      totalAmount,
      status: 'submitted',
      createdAt: new Date().toISOString().split('T')[0],
      date: new Date().toISOString().split('T')[0],
      submittedAt: new Date().toISOString().split('T')[0],
      invoiceNumber: editingBill.invoiceNumber,
      remarks: editingBill.remarks,
      serviceReceiverId: editingBill.serviceReceiverId,
      receiverDetails: receiver ? { ...receiver } : undefined
    });

    // Set the newly created bill as active
    setActiveBillId(newBillId);
    setEditingBill(null);
    setPendingBillData(null);
    setShowInvoicePreview(false);
  };

  const handlePreviewInvoice = () => {
    if (!editingBill) return;
    const selEntries = entries.filter(e => editingBill.entryIds.includes(e.id));
    const activityAmount = selEntries.reduce((s, e) => s + e.amount, 0);
    const taxable = activityAmount + Number(editingBill.serviceCharge);
    const gstAmt = Math.round(taxable * (editingBill.gstRate / 100));
    const totalAmount = taxable + gstAmt;
    
    setPreviewBill({
      ...editingBill,
      entries: selEntries,
      activityAmount,
      taxable,
      gstAmt,
      totalAmount
    });
    setShowInvoicePreview(true);
  };

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
          {editingBill && !showInvoicePreview && (
            <Card className="p-6 mb-6 border-l-4 border-l-orange-500 bg-orange-50">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="text-lg font-bold text-orange-900">Review Bill Details Before Submission</h3>
                  <p className="text-sm text-orange-700 mt-1">Click "👁️ Preview Invoice" below to review all selected activities, charges, and calculations before submitting your bill.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Invoice Number</Label>
                    <Input value={editingBill.invoiceNumber} onChange={e => setEditingBill({...editingBill, invoiceNumber: e.target.value})} />
                  </div>
                  <div>
                    <Label>Service Receiver</Label>
                    <Select value={editingBill.serviceReceiverId || ''} onChange={e => setEditingBill({...editingBill, serviceReceiverId: e.target.value})}>
                      <option value="">Select Receiver...</option>
                      {serviceReceivers.filter(r => r.vendorId === u.id).map(r => (
                        <option key={r.id} value={r.id}>{r.companyName}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Service Charges</Label>
                    <Input type="number" value={editingBill.serviceCharge} onChange={e => setEditingBill({...editingBill, serviceCharge: Number(e.target.value)})} />
                  </div>
                  <div>
                    <Label>GST Rate (%)</Label>
                    <Select value={editingBill.gstRate} onChange={e => setEditingBill({...editingBill, gstRate: Number(e.target.value)})}>
                      <option value={18}>18%</option>
                      <option value={12}>12%</option>
                      <option value={5}>5%</option>
                      <option value={0}>0%</option>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Remarks</Label>
                  <Textarea value={editingBill.remarks} onChange={e => setEditingBill({...editingBill, remarks: e.target.value})} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handlePreviewInvoice} className="bg-blue-600 hover:bg-blue-700 flex-1">👁️ Preview Invoice & Review Details</Button>
                  <Button variant="outline" onClick={() => { setEditingBill(null); setPendingBillData(null); }}>❌ Cancel</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Invoice Preview Modal */}
          {showInvoicePreview && previewBill && (
            <Modal open={true} onClose={() => { setShowInvoicePreview(false); setEditInvoiceMode(false); }} title={`Preview ${editInvoiceMode ? '(Editing Mode)' : ''}`}>
              <div className="bg-white p-8 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <Button variant="outline" onClick={() => { setShowInvoicePreview(false); setEditInvoiceMode(false); }}>✕ Close</Button>
                </div>

                <div className="border border-slate-300 p-6 bg-slate-50 rounded mb-6">
                  {/* Invoice Header */}
                  <div className="grid grid-cols-3 gap-4 mb-6 pb-4 border-b-2">
                    <div>
                      <p className="font-bold text-lg">TAX INVOICE</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Invoice #: {editInvoiceMode ? <input type="text" value={editInvoiceMode ? previewBill.invoiceNumber : ''} onChange={(e) => setPreviewBill({...previewBill, invoiceNumber: e.target.value})} className="border px-2 py-1" /> : previewBill.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Date: {editInvoiceMode ? <input type="date" value={previewBill.date || new Date().toISOString().split('T')[0]} onChange={(e) => setPreviewBill({...previewBill, date: e.target.value})} className="border px-2 py-1" /> : (previewBill.date || new Date().toISOString().split('T')[0])}</p>
                    </div>
                  </div>

                  {/* Vendor Details */}
                  <div className="grid grid-cols-2 gap-6 mb-6 pb-4 border-b">
                    <div>
                      <p className="font-semibold mb-2">FROM (Service Provider):</p>
                      <p className="font-bold">{u.territory?.tradeName || u.name}</p>
                      <p className="text-sm">Code: {u.territory?.vendorCode || 'N/A'}</p>
                      <p className="text-sm">GST: {u.territory?.gst || 'N/A'}</p>
                      <p className="text-sm">{u.territory?.address || u.phone || ''}</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">TO (Service Receiver):</p>
                      {previewBill.serviceReceiverId && serviceReceivers.find(r => r.id === previewBill.serviceReceiverId) ? (
                        (() => {
                          const receiver = serviceReceivers.find(r => r.id === previewBill.serviceReceiverId);
                          return (
                            <>
                              <p className="font-bold">{receiver?.companyName}</p>
                              <p className="text-sm">GST: {receiver?.gst}</p>
                              <p className="text-sm">{receiver?.address}</p>
                              <p className="text-sm">Contact: {receiver?.phone}</p>
                            </>
                          );
                        })()
                      ) : (
                        <p className="text-sm italic text-slate-500">No receiver selected</p>
                      )}
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="mb-6">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-200">
                          <th className="border border-slate-300 p-2 text-left font-semibold">S.L.</th>
                          <th className="border border-slate-300 p-2 text-left font-semibold">Particulars</th>
                          <th className="border border-slate-300 p-2 text-right font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewBill.entries && previewBill.entries.map((entry: any, idx: number) => (
                          <tr key={entry.id}>
                            <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                            <td className="border border-slate-300 p-2">{entry.activity || 'Service'}</td>
                            <td className="border border-slate-300 p-2 text-right">{formatCurrency(entry.amount)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100">
                          <td colSpan={2} className="border border-slate-300 p-2 font-semibold text-right">Activity Amount:</td>
                          <td className="border border-slate-300 p-2 text-right font-semibold">{formatCurrency(previewBill.activityAmount)}</td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="border border-slate-300 p-2 font-semibold text-right">Service Charges:</td>
                          <td className="border border-slate-300 p-2 text-right font-semibold">{formatCurrency(Number(previewBill.serviceCharge || 0))}</td>
                        </tr>
                        <tr className="bg-blue-50">
                          <td colSpan={2} className="border border-slate-300 p-2 font-semibold text-right">Taxable Value:</td>
                          <td className="border border-slate-300 p-2 text-right font-semibold">{formatCurrency(previewBill.taxable)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* GST Details */}
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold">GST Rate:</p>
                      {editInvoiceMode ? (
                        <select value={previewBill.gstRate} onChange={(e) => {
                          const newRate = Number(e.target.value);
                          const newGstAmt = Math.round(previewBill.taxable * (newRate / 100));
                          const newTotal = previewBill.taxable + newGstAmt;
                          setPreviewBill({...previewBill, gstRate: newRate, gstAmt: newGstAmt, totalAmount: newTotal});
                        }} className="border px-2 py-1 rounded">
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      ) : (
                        <span className="font-bold">{previewBill.gstRate}%</span>
                      )}
                    </div>
                    <p>Taxable: {formatCurrency(previewBill.taxable)} × {previewBill.gstRate}% = {formatCurrency(previewBill.gstAmt)}</p>
                    <p className="mt-2 p-2 bg-green-100 rounded font-bold">Grand Total: {formatCurrency(previewBill.totalAmount)}</p>
                  </div>

                  {/* Remarks */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold mb-2">Remarks:</p>
                    {editInvoiceMode ? (
                      <textarea value={previewBill.remarks || ''} onChange={(e) => setPreviewBill({...previewBill, remarks: e.target.value})} className="w-full border px-3 py-2 rounded text-sm" rows={3} placeholder="Add any remarks..." />
                    ) : (
                      <div className="p-3 bg-slate-100 rounded text-sm">{previewBill.remarks || '—'}</div>
                    )}
                  </div>
                </div>

                {/* Edit/Close Buttons */}
                <div className="flex gap-2 justify-center flex-wrap mt-6 pt-6 border-t-2 border-slate-200">
                  {!editInvoiceMode && (
                    <Button 
                      onClick={() => setEditInvoiceMode(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg font-bold text-base px-6 py-2"
                    >
                      ✏️ Edit Details
                    </Button>
                  )}
                  {editInvoiceMode && (
                    <Button 
                      onClick={() => setEditInvoiceMode(false)}
                      className="bg-slate-600 hover:bg-slate-700 text-white border-none shadow-lg font-bold text-base px-6 py-2"
                    >
                      ✓ Done Editing
                    </Button>
                  )}
                  <Button 
                    onClick={() => {
                      // Save as draft - update editingBill with preview data and set status to draft
                      setEditingBill({
                        ...editingBill,
                        invoiceNumber: previewBill.invoiceNumber,
                        serviceCharge: previewBill.taxable - previewBill.activityAmount,
                        gstRate: previewBill.gstRate
                      });
                      // Create bill with draft status
                      const selEntries = entries.filter(e => editingBill.entryIds.includes(e.id));
                      const activityAmount = selEntries.reduce((s, e) => s + e.amount, 0);
                      const taxable = activityAmount + Number(previewBill.taxable - previewBill.activityAmount);
                      const gstAmt = Math.round(taxable * (previewBill.gstRate / 100));
                      const totalAmount = taxable + gstAmt;
                      const receiver = serviceReceivers.find(r => r.id === editingBill.serviceReceiverId);
                      
                      addBill({
                        vendorId: u.id,
                        vendorName: u.territory?.tradeName || u.name,
                        vendorCode: u.territory?.vendorCode,
                        entryIds: editingBill.entryIds,
                        activityAmount,
                        serviceChargeAmt: Number(previewBill.taxable - previewBill.activityAmount),
                        gstRate: previewBill.gstRate,
                        totalAmount,
                        status: 'draft',
                        createdAt: new Date().toISOString().split('T')[0],
                        date: previewBill.date || new Date().toISOString().split('T')[0],
                        invoiceNumber: previewBill.invoiceNumber,
                        remarks: editingBill.remarks,
                        serviceReceiverId: editingBill.serviceReceiverId,
                        receiverDetails: receiver ? { ...receiver } : undefined
                      });
                      setEditingBill(null);
                      setPendingBillData(null);
                      setShowInvoicePreview(false);
                      setEditInvoiceMode(false);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-lg font-bold text-base px-6 py-2"
                  >
                    💾 Save as Draft
                  </Button>
                  <Button 
                    onClick={() => {
                      handleSubmitBill();
                      setShowInvoicePreview(false);
                      setEditInvoiceMode(false);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white border-none shadow-lg font-bold text-base px-8 py-3"
                  >
                    ✅ SUBMIT BILL
                  </Button>
                  <Button 
                    onClick={() => { setShowInvoicePreview(false); setEditInvoiceMode(false); }}
                    variant="outline"
                    className="font-semibold"
                  >
                    ← Back
                  </Button>
                  <Button 
                    onClick={() => { setShowInvoicePreview(false); setEditInvoiceMode(false); setEditingBill(null); setPendingBillData(null); }}
                    variant="outline"
                    className="bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    ✕ Cancel
                  </Button>
                </div>
              </div>
            </Modal>
          )}

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

  const canEdit = isVendor && (bill.status === 'draft' || bill.status === 'submitted' || bill.modificationApprovedBy);

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
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #billing-detail-panel, #billing-detail-panel * { visibility: visible; }
          #billing-detail-panel { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      <Card className="p-0 overflow-hidden bg-white shadow-xl border border-slate-200 print:shadow-none print:border-none">
      {/* Header Bar */}
      <div className="bg-gradient-to-br from-[#1B4F72] to-[#2C82B0] p-6 text-white flex justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tight">Tax Invoice</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm font-mono opacity-80">{bill.invoiceNumber || bill.id}</span>
            <Badge variant={bill.status === 'paid' ? 'success' : bill.status === 'submitted' ? 'blue' : 'warning'} className="uppercase text-[10px] py-0">
              {bill.status}
            </Badge>
            {bill.modificationApprovedBy && (
              <Badge className="uppercase text-[10px] py-0 bg-green-500 hover:bg-green-600">
                ✓ Modification Approved
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-3">
          <div className="text-xs opacity-80">
            <p>Bill Date: <strong>{bill.date || bill.createdAt}</strong></p>
          </div>
          <div className="flex gap-2 no-print flex-wrap">
            {bill.status === 'draft' && isVendor && (
              <Button onClick={() => handleStatusChange('submitted')} size="sm" className="bg-orange-600 hover:bg-orange-700 text-white border-none shadow-lg">📤 Submit Bill</Button>
            )}
            {bill.status === 'submitted' && isVendor && !bill.modificationApprovedBy && (
               <Button onClick={() => handleUpdateField('status', 'draft')} size="sm" variant="outline" className="bg-white/10 border-white/40 text-white hover:bg-white/20">✏️ Re-open Draft</Button>
            )}
            {bill.status === 'submitted' && bill.modificationApprovedBy && isVendor && (
               <Button onClick={() => handleUpdateField('modificationApprovedBy', undefined)} size="sm" className="bg-green-600 hover:bg-green-700 text-white border-none shadow-lg">✓ Done Editing</Button>
            )}
            {bill.status === 'submitted' && !isVendor && (
              <Button onClick={() => handleStatusChange('paid')} size="sm" className="bg-green-600 hover:bg-green-700 text-white border-none">✅ Mark Paid</Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.print()} className="bg-white/10 border-white/40 text-white hover:bg-white/20">🖨️ PDF</Button>
            <Button variant="outline" size="sm" onClick={() => {
              const data = billEntries.map((e, i) => ({
                'SI No': i + 1,
                'Date': e.date,
                'P.O Number': e.po,
                'Bill Number': bill.invoiceNumber || bill.id,
                'Area Manager': e.userName,
                'Product': e.product,
                'Activity': e.activity,
                'Amount': e.amount
              }));
              exportToExcel(data, `bill-activities-${bill.invoiceNumber || bill.id}.xls`);
            }} className="bg-white/10 border-white/40 text-white hover:bg-white/20">📊 Excel</Button>
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
               <p className="text-[10px] leading-tight opacity-80 italic">₹ {numberToWords(Math.floor(totalWithGST))} Only</p>
               <div className="mt-4 pt-4 border-t border-white/20 text-[10px] flex justify-between">
                 <span>Activities: {formatCurrency(activityAmt)}</span>
                 <span>GST: {formatCurrency(gstAmount)}</span>
               </div>
            </div>
            
            {/* Bank Details Area */}
            {(vp?.bankName || vp?.accountNo || canEdit) && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="text-[9px] font-black text-green-600 uppercase mb-3 text-center">🏦 Bank Details for Payment</h3>
                <div className="grid grid-cols-1 gap-2 text-[10px] font-mono">
                  <div className="bg-white p-2 rounded border border-green-100">
                    <span className="text-green-600 font-bold">Account Name:</span> {vp?.tradeName || bill.vendorName}
                  </div>
                  <div className="bg-white p-2 rounded border border-green-100">
                    <span className="text-green-600 font-bold">Account No.:</span> {vp?.accountNo || '—'}
                  </div>
                  <div className="bg-white p-2 rounded border border-green-100">
                    <span className="text-green-600 font-bold">IFSC Code:</span> {vp?.ifsc || '—'}
                  </div>
                  <div className="bg-white p-2 rounded border border-green-100">
                    <span className="text-green-600 font-bold">Bank Name:</span> {vp?.bankName || '—'}
                  </div>
                </div>
              </div>
            )}
            
            {/* Signature Area */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
               <h3 className="text-[9px] font-black text-slate-400 uppercase mb-4 text-center">✍️ Declaration & Signature</h3>
               <div className="text-[9px] text-slate-600 mb-3 p-2 bg-white rounded border border-slate-100 italic">
                  <p>I/We hereby declare that the particulars given above are true and correct and it is based on the invoices/documents issued for the said supply of services.</p>
               </div>
               { (bill.status === 'submitted' || bill.status === 'paid') ? (
                 <div className="border-2 border-[#1B4F72] rounded-lg p-3 text-center text-[#1B4F72] bg-white">
                    <div className="text-xl mb-1">✅</div>
                    <p className="text-[10px] font-black uppercase">Digitally Signed</p>
                    <p className="text-[9px] mt-1 font-semibold">{bill.signatoryName || bill.spTradeName || bill.vendorName}</p>
                    <p className="text-[8px] opacity-70">{bill.signatoryDesignation || 'Authorized Signatory'}</p>
                    <p className="text-[7px] font-mono mt-1 opacity-50">{bill.submittedAt}</p>
                 </div>
               ) : (
                 <div className="space-y-2">
                    {canEdit ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <Label className="text-[8px] font-bold text-slate-500">Signatory Name</Label>
                            <Input 
                              value={bill.signatoryName || ''} 
                              onChange={e => handleUpdateField('signatoryName', e.target.value)}
                              className="h-7 text-[10px]"
                              placeholder="Full Name"
                            />
                          </div>
                          <div>
                            <Label className="text-[8px] font-bold text-slate-500">Designation</Label>
                            <Input 
                              value={bill.signatoryDesignation || ''} 
                              onChange={e => handleUpdateField('signatoryDesignation', e.target.value)}
                              className="h-7 text-[10px]"
                              placeholder="e.g., MD, CFO"
                            />
                          </div>
                        </div>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center text-slate-400 italic mt-2">
                          <p className="text-[9px]">✍️ Mark this bill as submitted to digitally sign</p>
                        </div>
                      </>
                    ) : (
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center text-slate-400 italic">
                        <p className="text-[10px]">Ready to submit. Fill signatory details to complete.</p>
                      </div>
                    )}
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </Card>
    </>
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


