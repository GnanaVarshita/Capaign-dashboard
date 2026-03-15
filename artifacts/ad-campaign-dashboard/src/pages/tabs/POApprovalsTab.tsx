import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Button, Badge, Table, Th, Td } from '../../components/ui';
import { formatCurrency } from '../../lib/mock-data';

export default function POApprovalsTab() {
  const { pos, approvePO, rejectPO, currentUser } = useAppContext();
  const u = currentUser!;

  const pendingPOs = pos.filter(p => p.approvalStatus === 'pending');
  const decidedPOs = pos.filter(p => p.approvalStatus !== 'pending');

  const statusBadge = (s: string) =>
    s === 'approved' ? <Badge variant="success">✓ Approved</Badge> :
    s === 'rejected' ? <Badge variant="error">✗ Rejected</Badge> :
    <Badge variant="warning">⏳ Pending</Badge>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <CardTitle>
          Pending PO Approvals
          <Badge variant={pendingPOs.length > 0 ? 'warning' : 'success'}>{pendingPOs.length} Pending</Badge>
        </CardTitle>
        {pendingPOs.length === 0 ? (
          <div className="py-12 text-center text-[#9CA3AF]">✅ No pending PO approvals.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pendingPOs.map(po => (
              <div key={po.id} className="border border-amber-200 rounded-xl p-5 bg-amber-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-[#1B4F72] text-base">{po.poNumber}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">Created by {po.createdBy} on {po.createdAt}</p>
                  </div>
                  <Badge variant="warning">{po.status}</Badge>
                </div>
                <div className="space-y-1 mb-4 text-sm">
                  <p><span className="text-[#6B7280]">Budget:</span> <strong className="text-[#1B4F72]">{formatCurrency(po.budget)}</strong></p>
                  <p><span className="text-[#6B7280]">Period:</span> <strong>{po.from} → {po.to}</strong></p>
                  {po.remarks && <p><span className="text-[#6B7280]">Remarks:</span> {po.remarks}</p>}
                  {Object.keys(po.regionBudgets || {}).length > 0 && (
                    <div>
                      <p className="text-[#6B7280] text-xs font-semibold mt-2 mb-1">Region Budgets:</p>
                      {Object.entries(po.regionBudgets).map(([r, b]) => (
                        <p key={r} className="text-xs">• {r}: <strong>{formatCurrency(b as number)}</strong></p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="success" size="sm" className="flex-1" onClick={() => approvePO(po.id, u.name)}>✓ Approve</Button>
                  <Button variant="danger" size="sm" className="flex-1" onClick={() => rejectPO(po.id)}>✗ Reject</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <CardTitle>PO Approval History</CardTitle>
        <Table>
          <thead>
            <tr>
              <Th>PO Number</Th><Th>Budget</Th><Th>Period</Th><Th>Status</Th><Th>Approved By</Th><Th>Remarks</Th>
            </tr>
          </thead>
          <tbody>
            {decidedPOs.length === 0 ? (
              <tr><Td colSpan={6} className="text-center py-8 text-[#9CA3AF]">No history yet.</Td></tr>
            ) : decidedPOs.map(po => (
              <tr key={po.id} className="hover:bg-[#F8FAFC]">
                <Td className="font-bold text-[#1B4F72]">{po.poNumber}</Td>
                <Td className="font-semibold">{formatCurrency(po.budget)}</Td>
                <Td className="text-xs">{po.from} → {po.to}</Td>
                <Td>{statusBadge(po.approvalStatus)}</Td>
                <Td className="text-xs text-[#6B7280]">{po.approvedBy || '—'}</Td>
                <Td className="text-xs text-[#6B7280]">{po.remarks || '—'}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
