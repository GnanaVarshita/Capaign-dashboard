import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Button, Table, Th, Td, Badge, StatusBadge, SearchInput, TabPills, cn } from '../../components/ui';
import { formatCurrency } from '../../lib/mock-data';

export default function ApprovalsTab() {
  const { getVisiblePendingEntries, updateEntryStatus, entries, currentUser, users } = useAppContext();
  const u = currentUser!;
  const pending = getVisiblePendingEntries();
  const [subTab, setSubTab] = useState('pending');

  const historyEntries = entries.filter(e => e.status !== 'pending').filter(e => {
    if (u.role === 'Owner' || u.role === 'All India Manager') return true;
    if (u.role === 'Regional Manager') return e.rmId === u.id || users.find(x => x.id === e.userId)?.territory?.region === u.territory?.region;
    if (u.role === 'Zonal Manager') return e.zmId === u.id || users.find(x => x.id === e.userId)?.territory?.zone === u.territory?.zone;
    return false;
  });

  return (
    <div className="space-y-5">
      <TabPills
        tabs={[
          { id: 'pending', label: 'Pending', badge: pending.length },
          { id: 'history', label: 'History' }
        ]}
        active={subTab}
        onChange={setSubTab}
      />

      {subTab === 'pending' && (
        <Card className="p-6">
          <CardTitle>
            Pending Approvals
            <Badge variant={pending.length > 0 ? 'warning' : 'success'}>{pending.length} Pending</Badge>
          </CardTitle>
          <Table>
            <thead>
              <tr>
                <Th>Date</Th><Th>Submitted By</Th><Th>Area</Th><Th>PO</Th><Th>ZM</Th><Th>RM</Th><Th>Vendor</Th><Th>Product</Th><Th>Activity</Th><Th>Amount</Th><Th>Description</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr><Td colSpan={12} className="text-center py-12 text-[#9CA3AF]">✅ All caught up! No pending approvals.</Td></tr>
              ) : pending.map(e => (
                <tr key={e.id} className="hover:bg-[#F8FAFC]">
                  <Td className="whitespace-nowrap text-[#374151]">{e.date}</Td>
                  <Td>
                    <div className="font-bold text-[#1A1D23]">{e.userName}</div>
                    <Badge variant="purple" className="text-[9px] mt-0.5">{e.userRole}</Badge>
                  </Td>
                  <Td>{e.area || '—'} {e.pin && <span className="text-[#9CA3AF] text-xs">({e.pin})</span>}</Td>
                  <Td className="font-bold text-[#1B4F72]">{e.po}</Td>
                  <Td className="text-xs text-purple-600">{e.zmName || '—'}</Td>
                  <Td className="text-xs text-blue-600">{e.rmName || '—'}</Td>
                  <Td className="text-xs">{e.vendorName || '—'}</Td>
                  <Td><Badge variant="blue">{e.product}</Badge></Td>
                  <Td className="text-xs">{e.activity}</Td>
                  <Td className="font-bold text-[#1B4F72] whitespace-nowrap">{formatCurrency(e.amount)}</Td>
                  <Td className="max-w-[160px] text-xs text-[#6B7280]" title={e.description}>
                    <span className="line-clamp-2">{e.description}</span>
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-1">
                      <Button variant="success" size="sm" onClick={() => updateEntryStatus(e.id, 'approved', u.name)}>✓ Approve</Button>
                      <Button variant="danger" size="sm" onClick={() => updateEntryStatus(e.id, 'rejected', u.name)}>✗ Reject</Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {subTab === 'history' && (
        <Card className="p-6">
          <CardTitle>Approval History</CardTitle>
          <Table>
            <thead>
              <tr>
                <Th>Date</Th><Th>Submitted By</Th><Th>PO</Th><Th>Area</Th><Th>Product</Th><Th>Activity</Th><Th>Amount</Th><Th>Status</Th><Th>Decided By</Th>
              </tr>
            </thead>
            <tbody>
              {historyEntries.length === 0 ? (
                <tr><Td colSpan={9} className="text-center py-10 text-[#9CA3AF]">No approval history yet.</Td></tr>
              ) : historyEntries.map(e => (
                <tr key={e.id} className="hover:bg-[#F8FAFC]">
                  <Td className="whitespace-nowrap">{e.date}</Td>
                  <Td className="font-medium">{e.userName}</Td>
                  <Td className="font-bold text-[#1B4F72]">{e.po}</Td>
                  <Td>{e.area || '—'}</Td>
                  <Td><Badge variant="blue">{e.product}</Badge></Td>
                  <Td className="text-xs">{e.activity}</Td>
                  <Td className="font-bold">{formatCurrency(e.amount)}</Td>
                  <Td><StatusBadge status={e.status} /></Td>
                  <Td className="text-xs text-[#6B7280]">{e.decidedBy || '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
