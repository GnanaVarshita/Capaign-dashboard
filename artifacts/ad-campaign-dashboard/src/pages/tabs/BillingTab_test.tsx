import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Button, Modal, Label, Input, Textarea, cn, Select, Badge } from '../../components/ui';
import { formatCurrency } from '../../lib/mock-data';
import { Bill, ServiceReceiver, VendorProfile, GST_STATES } from '../../types';

export default function BillingTab() {
  const { 
    currentUser, bills, entries, users, 
    serviceReceivers,
    updateBill, pendingBillData, setPendingBillData, addBill
  } = useAppContext();
  const u = currentUser!;
  const isVendor = u.role === 'Vendor';
  
  const [activeTab, setActiveTab] = useState<'bill-preview' | 'receivers' | 'myprofile'>('bill-preview');
  const [editingBill, setEditingBill] = useState<any>(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [previewBill, setPreviewBill] = useState<any>(null);

  // When bill is raised from Vendor Tab
  useEffect(() => {
    if (pendingBillData) {
      setEditingBill(pendingBillData);
      setActiveTab('bill-preview');
      // Auto-show preview of selected activities
      const selEntries = entries.filter(e => pendingBillData.entryIds.includes(e.id));
      const activityAmount = selEntries.reduce((s, e) => s + e.amount, 0);
      const taxable = activityAmount + Number(pendingBillData.serviceCharge);
      const gstAmt = Math.round(taxable * (pendingBillData.gstRate / 100));
      const totalAmount = taxable + gstAmt;
      
      setPreviewBill({
        ...pendingBillData,
        entries: selEntries,
        activityAmount,
        taxable,
        gstAmt,
        totalAmount
      });
      setShowInvoicePreview(true);
    }
  }, [pendingBillData, entries]);

  const handleSubmitBill = () => {
    if (!editingBill) return;
    const selEntries = entries.filter(e => editingBill.entryIds.includes(e.id));
    const activityAmount = selEntries.reduce((s, e) => s + e.amount, 0);
    const taxable = activityAmount + Number(editingBill.serviceCharge);
    const gstAmt = Math.round(taxable * (editingBill.gstRate / 100));
    const totalAmount = taxable + gstAmt;

    const receiver = serviceReceivers.find(r => r.id === editingBill.serviceReceiverId);

    addBill({
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
              ? 'Raise bills for your approved activities. Review, modify, and submit bills here.' 
              : 'View vendor bills & tax invoices.'}
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b-2 border-slate-100">
        <button 
          onClick={() => setActiveTab('bill-preview')}
          className={cn(
            "px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-[2px]",
            activeTab === 'bill-preview' ? "border-[#1B4F72] text-[#1B4F72]" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          📝 Bill Preview & Submission
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

      {activeTab === 'bill-preview' && (
        <>
          {/* Bill Edit Form */}
          {editingBill && !showInvoicePreview && (
            <Card className="p-6 mb-6 border-l-4 border-l-blue-600 bg-blue-50">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">📋</span>
                <div>
                  <h3 className="text-lg font-bold text-blue-900">Bill Details - Modify & Review</h3>
                  <p className="text-sm text-blue-700 mt-1">Update bill details as needed, then click "Preview Invoice" to review before submission.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Invoice Number *</Label>
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
                  <Button onClick={handlePreviewInvoice} className="bg-blue-600 hover:bg-blue-700 flex-1">👁️ Preview Invoice & Review</Button>
                  <Button variant="outline" onClick={() => { setEditingBill(null); setPendingBillData(null); }}>❌ Cancel</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Invoice Preview Modal */}
          {showInvoicePreview && previewBill && (
            <Modal isOpen={true} onClose={() => setShowInvoicePreview(false)}>
              <div className="bg-white p-8 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Tax Invoice Preview</h2>
                  <Button variant="outline" onClick={() => setShowInvoicePreview(false)}>✕ Close</Button>
                </div>

                <div className="border border-slate-300 p-6 bg-slate-50 rounded mb-6">
                  {/* Invoice Header */}
                  <div className="grid grid-cols-3 gap-4 mb-6 pb-4 border-b-2">
                    <div>
                      <p className="font-bold text-lg">TAX INVOICE</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Invoice #: {previewBill.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Date: {previewBill.date || new Date().toISOString().split('T')[0]}</p>
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
                    <p className="font-semibold mb-2">GST Calculation ({previewBill.gstRate}%):</p>
                    <p>Taxable: {formatCurrency(previewBill.taxable)} × {previewBill.gstRate}% = {formatCurrency(previewBill.gstAmt)}</p>
                    <p className="mt-2 p-2 bg-green-100 rounded font-bold">Grand Total: {formatCurrency(previewBill.totalAmount)}</p>
                  </div>

                  {previewBill.remarks && (
                    <div className="mb-4 p-3 bg-slate-100 rounded">
                      <p className="text-sm"><span className="font-semibold">Remarks:</span> {previewBill.remarks}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-center flex-wrap mt-6 pt-6 border-t-2 border-slate-200">
                  <Button 
                    onClick={() => {
                      handleSubmitBill();
                      setShowInvoicePreview(false);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white border-none shadow-lg font-bold text-base px-8 py-3"
                  >
                    ✅ SUBMIT BILL
                  </Button>
                  <Button 
                    onClick={() => setShowInvoicePreview(false)}
                    variant="outline"
                    className="font-semibold"
                  >
                    ← Back to Edit
                  </Button>
                  <Button 
                    onClick={() => { setShowInvoicePreview(false); setEditingBill(null); setPendingBillData(null); }}
                    variant="outline"
                    className="bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    ✕ Cancel
                  </Button>
                </div>
              </div>
            </Modal>
          )}

          {!editingBill && (
            <Card className="p-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-lg font-bold text-slate-600">No Bill to Review</p>
              <p className="text-sm text-slate-500 mt-2">Go to Vendor Section → Select Approved Activities → Click "Raise Bill" to start</p>
            </Card>
          )}
        </>
      )}

      {activeTab === 'receivers' && isVendor && <ServiceReceiversTab />}
      {activeTab === 'myprofile' && isVendor && <MyProfileTab />}
    </div>
  );
}

function ServiceReceiversTab() {
  // Placeholder - implement as needed
  return <div className="p-6">Service Receivers Tab</div>;
}

function MyProfileTab() {
  // Placeholder - implement as needed
  return <div className="p-6">My Profile Tab</div>;
}
