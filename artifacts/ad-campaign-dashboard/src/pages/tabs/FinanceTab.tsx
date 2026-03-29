import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Table, Th, Td, Badge, Button, Modal, Label } from '../../components/ui';
import { formatCurrency } from '../../lib/mock-data';

export default function FinanceTab() {
  const { currentUser, bills, entries, users, updateBill } = useAppContext();
  const u = currentUser!;
  const isVendor = u.role === 'Vendor';
  const isOwner = u.role === 'Owner';
  const isFinanceAdmin = u.role === 'Finance Administrator';
  const canManage = isOwner || isFinanceAdmin;

  const [showModifyModal, setShowModifyModal] = useState<string | null>(null);

  const financeBills = useMemo(() => {
    let list = bills.filter(b => b.status === 'submitted' || b.status === 'paid');
    if (isVendor) {
      list = list.filter(b => b.vendorId === u.id);
    }
    // Owner and Finance Admin see all bills
    return list.sort((a, b) => (b.submittedAt || b.createdAt || '').localeCompare(a.submittedAt || a.createdAt || ''));
  }, [bills, isVendor, u.id]);

  const calculateDays = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateGST = (bill: any) => {
    const taxable = (bill.activityAmount || 0) + (bill.serviceChargeAmt || 0);
    const gstAmt = bill.totalAmount - taxable;
    // Assume CGST = SGST = gstAmt / 2, IGST = 0 for simplicity
    const cgst = gstAmt / 2;
    const sgst = gstAmt / 2;
    const igst = 0;
    return { taxable, cgst, sgst, igst };
  };

  const handleMarkAsPaid = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (bill) {
      updateBill(billId, { ...bill, status: 'paid', paidAt: new Date().toISOString().split('T')[0] });
    }
  };

  const handleRequestModify = (billId: string) => {
    updateBill(billId, {
      modificationRequested: true,
      modificationRequestedAt: new Date().toISOString().split('T')[0]
    });
    setShowModifyModal(null);
  };

  const handleApproveModify = (billId: string) => {
    updateBill(billId, {
      modificationApprovedBy: u.id,
      modificationApprovedAt: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">💰 Finance Section</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isVendor ? 'Track your submitted bills and payments received. You can request modification if needed.' : 'Manage vendor bill payments and financial overview. Approve bill modifications as needed.'}
          </p>
        </div>
      </div>

      <Card className="p-6">
        <CardTitle>Bill Payments & Approvals</CardTitle>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>SI No</Th>
                <Th>Date</Th>
                <Th>Vendor</Th>
                <Th>Taxable Value</Th>
                <Th>CGST</Th>
                <Th>SGST</Th>
                <Th>IGST</Th>
                <Th>Invoice Value</Th>
                <Th>Days Count</Th>
                <Th>Bill Payment Date</Th>
                <Th>Amount Paid to Vendor</Th>
                <Th>Payment ID</Th>
                <Th>Date of Payment</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {financeBills.length === 0 ? (
                <tr><Td colSpan={13} className="text-center py-12 text-slate-400">No bills to display.</Td></tr>
              ) : (
                financeBills.map((bill, index) => {
                  const gst = calculateGST(bill);
                  const days = calculateDays(bill.submittedAt || bill.createdAt || '');
                  const hasModifyRequest = bill.modificationRequested && !bill.modificationApprovedAt;
                  const canModify = bill.modificationApprovedBy === u.id || isOwner || isFinanceAdmin;
                  
                  return (
                    <tr key={bill.id}>
                      <Td>{index + 1}</Td>
                      <Td>{bill.date || bill.createdAt}</Td>
                      <Td>{bill.vendorName}</Td>
                      <Td>{formatCurrency(gst.taxable)}</Td>
                      <Td>{formatCurrency(gst.cgst)}</Td>
                      <Td>{formatCurrency(gst.sgst)}</Td>
                      <Td>{formatCurrency(gst.igst)}</Td>
                      <Td>{formatCurrency(bill.totalAmount)}</Td>
                      <Td>{days}</Td>
                      <Td>{bill.paidAt || '—'}</Td>
                      <Td>{bill.status === 'paid' ? formatCurrency(bill.totalAmount) : '—'}</Td>
                      <Td>
                        {bill.status === 'paid' && canManage ? (
                          <input
                            type="text"
                            value={bill.paymentId || ''}
                            onChange={(e) => updateBill(bill.id, { paymentId: e.target.value })}
                            placeholder="Enter Payment ID"
                            className="w-full px-2 py-1 text-xs border rounded"
                          />
                        ) : (
                          <span className="text-xs">{bill.paymentId || '—'}</span>
                        )}
                      </Td>
                      <Td>
                        {bill.status === 'paid' && canManage ? (
                          <input
                            type="date"
                            value={bill.paymentDate || ''}
                            onChange={(e) => updateBill(bill.id, { paymentDate: e.target.value })}
                            className="w-full px-2 py-1 text-xs border rounded"
                          />
                        ) : (
                          <span className="text-xs">{bill.paymentDate || '—'}</span>
                        )}
                      </Td>
                      <Td>
                        <div className="flex gap-1">
                          <Badge 
                            variant={bill.status === 'paid' ? 'success' : 'blue'}
                            className="text-[10px] px-2 py-1"
                          >
                            {bill.status}
                          </Badge>
                          {hasModifyRequest && (
                            <Badge className="text-[10px] px-2 py-1 bg-orange-100 text-orange-800">
                              ⚠️ Modify Requested
                            </Badge>
                          )}
                          {bill.modificationApprovedBy && !hasModifyRequest && (
                            <Badge className="text-[10px] px-2 py-1 bg-green-100 text-green-800">
                              ✓ Modify Approved
                            </Badge>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <div className="flex flex-col gap-1">
                          {/* For Vendor: Request Modify or Show Approval Status */}
                          {isVendor && (
                            <>
                              {bill.status === 'submitted' && !bill.modificationRequested && !bill.modificationApprovedBy && (
                                <Button
                                  onClick={() => setShowModifyModal(bill.id)}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                >
                                  📝 Request Modify
                                </Button>
                              )}
                              {bill.modificationRequested && !bill.modificationApprovedAt && (
                                <Badge className="text-[9px] px-2 py-1 bg-yellow-100 text-yellow-800 text-center">
                                  ⏳ Awaiting Approval
                                </Badge>
                              )}
                              {bill.modificationApprovedBy && (
                                <Badge className="text-[9px] px-2 py-1 bg-green-100 text-green-800 text-center">
                                  ✓ Approved - Go to Billing
                                </Badge>
                              )}
                            </>
                          )}

                          {/* For Admin: Approve Modify or Mark Paid */}
                          {canManage && (
                            <>
                              {hasModifyRequest && (
                                <Button
                                  onClick={() => handleApproveModify(bill.id)}
                                  size="sm"
                                  className="text-xs bg-green-600 hover:bg-green-700"
                                >
                                  ✓ Approve Modify
                                </Button>
                              )}
                              {!hasModifyRequest && (
                                <Button
                                  onClick={() => handleMarkAsPaid(bill.id)}
                                  disabled={bill.status === 'paid'}
                                  size="sm"
                                  className="text-xs"
                                >
                                  {bill.status === 'paid' ? '✓ Paid' : 'Mark as Paid'}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Request Modify Modal */}
      {showModifyModal && (
        <Modal open={true} onClose={() => setShowModifyModal(null)} title="Request Bill Modification">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <p className="text-sm text-slate-600 mb-4">
              Your modification request will be sent to the Owner or Finance Admin for approval. Once approved, you'll be able to modify this bill.
            </p>
            <div className="space-y-3 mb-6">
              <p className="text-sm"><span className="font-semibold">Reason for modification:</span></p>
              <p className="text-xs text-slate-500">
                Correction needed - You can provide details in the billing section once approved.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  handleRequestModify(showModifyModal);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                ✓ Send Request
              </Button>
              <Button
                onClick={() => setShowModifyModal(null)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}