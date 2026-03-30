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
        <div className="space-y-4">
          <Card className="p-6">
            <CardTitle>
              Pending Approvals for Verification
              <Badge variant={pending.length > 0 ? 'warning' : 'success'}>{pending.length} Pending</Badge>
            </CardTitle>
          </Card>

          {pending.length === 0 ? (
            <Card className="p-6 text-center py-12 text-[#9CA3AF]">
              ✅ All caught up! No pending approvals.
            </Card>
          ) : (
            pending.map(e => (
              <Card key={e.id} className="p-6 border-l-4 border-l-yellow-500 hover:shadow-lg transition">
                {/* Entry Header */}
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-lg text-[#1A1D23]">{e.userName}</div>
                      <div className="text-sm text-[#6B7280]">
                        {e.area} {e.pin && <span className="text-[#9CA3AF]">({e.pin})</span>}
                      </div>
                    </div>
                    <Badge variant={e.status === 'pending' ? 'warning' : 'success'}>
                      {e.status === 'pending' ? '⏳ Awaiting Approval' : e.status.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Entry Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4 p-3 bg-slate-50 rounded">
                    <div>
                      <span className="text-[#6B7280]">Date:</span>
                      <div className="font-semibold">{e.date}</div>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">PO:</span>
                      <div className="font-bold text-[#1B4F72]">{e.po}</div>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Product:</span>
                      <Badge variant="blue" className="mt-1">{e.product}</Badge>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Activity:</span>
                      <div className="font-semibold">{e.activity}</div>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Amount:</span>
                      <div className="font-bold text-green-600">{formatCurrency(e.amount)}</div>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Vendor:</span>
                      <div className="font-semibold text-xs">{e.vendorName || '—'}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[#6B7280]">ZM / RM:</span>
                      <div className="font-semibold text-xs mt-1">
                        <span className="text-purple-600">{e.zmName || '—'}</span> / <span className="text-blue-600">{e.rmName || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {e.description && (
                  <div className="mb-4 p-3 bg-blue-50 rounded border-l-4 border-l-blue-400">
                    <span className="text-xs font-bold text-slate-700">Description:</span>
                    <p className="text-sm text-slate-700 mt-1">{e.description}</p>
                  </div>
                )}

                {/* Photo Evidence Section */}
                {(e.campaignPhoto || e.expensePhoto || e.otherPhoto) && (
                  <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded border-2 border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                      📸 Activity Evidence & Supporting Photos
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Campaign Photo */}
                      {e.campaignPhoto && (
                        <div className="p-2 bg-white rounded border border-blue-300 hover:shadow-md transition">
                          <p className="text-xs font-bold text-blue-900 mb-2">📷 Campaign Photo</p>
                          <img 
                            src={e.campaignPhoto} 
                            alt="Campaign" 
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition"
                            onClick={() => {
                              const modal = document.createElement('div');
                              modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                              modal.innerHTML = `<div class="relative"><img src="${e.campaignPhoto}" class="max-w-4xl max-h-screen"/><button onclick="this.parentElement.parentElement.remove()" class="absolute top-4 right-4 text-white text-2xl font-bold">&times;</button></div>`;
                              document.body.appendChild(modal);
                            }}
                          />
                          <p className="text-xs text-green-600 mt-1 font-semibold">✓ Uploaded for verification</p>
                        </div>
                      )}

                      {/* Expense Photo */}
                      {e.expensePhoto && (
                        <div className="p-2 bg-white rounded border border-amber-300 hover:shadow-md transition">
                          <p className="text-xs font-bold text-amber-900 mb-2">💰 Expense Photo</p>
                          <img 
                            src={e.expensePhoto} 
                            alt="Expense" 
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition"
                            onClick={() => {
                              const modal = document.createElement('div');
                              modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                              modal.innerHTML = `<div class="relative"><img src="${e.expensePhoto}" class="max-w-4xl max-h-screen"/><button onclick="this.parentElement.parentElement.remove()" class="absolute top-4 right-4 text-white text-2xl font-bold">&times;</button></div>`;
                              document.body.appendChild(modal);
                            }}
                          />
                          <p className="text-xs text-green-600 mt-1 font-semibold">✓ Uploaded for verification</p>
                        </div>
                      )}

                      {/* Other Photo */}
                      {e.otherPhoto && (
                        <div className="p-2 bg-white rounded border border-purple-300 hover:shadow-md transition">
                          <p className="text-xs font-bold text-purple-900 mb-2">📹 Other Photo</p>
                          <img 
                            src={e.otherPhoto} 
                            alt="Other" 
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition"
                            onClick={() => {
                              const modal = document.createElement('div');
                              modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                              modal.innerHTML = `<div class="relative"><img src="${e.otherPhoto}" class="max-w-4xl max-h-screen"/><button onclick="this.parentElement.parentElement.remove()" class="absolute top-4 right-4 text-white text-2xl font-bold">&times;</button></div>`;
                              document.body.appendChild(modal);
                            }}
                          />
                          <p className="text-xs text-green-600 mt-1 font-semibold">✓ Uploaded for verification</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-blue-700 mt-3 italic">💡 Click any photo to view full-screen for detailed verification</p>
                  </div>
                )}

                {/* Approval Buttons */}
                <div className="flex gap-3 pt-3 border-t border-slate-200">
                  <Button 
                    variant="success" 
                    onClick={() => updateEntryStatus(e.id, 'approved', u.name, u.role)}
                    className="flex-1 py-2"
                  >
                    ✓ Approve
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={() => updateEntryStatus(e.id, 'rejected', u.name, u.role)}
                    className="flex-1 py-2"
                  >
                    ✗ Reject
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {subTab === 'history' && (
        <div className="space-y-4">
          <Card className="p-6">
            <CardTitle>Approval History with Evidence</CardTitle>
          </Card>

          {historyEntries.length === 0 ? (
            <Card className="p-6 text-center py-12 text-[#9CA3AF]">
              No approval history yet.
            </Card>
          ) : (
            historyEntries.map(e => (
              <Card key={e.id} className="p-6 border-l-4 border-l-green-500 hover:shadow-lg transition">
                {/* Entry Header */}
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-lg text-[#1A1D23]">{e.userName}</div>
                      <div className="text-sm text-[#6B7280]">
                        {e.area} {e.pin && <span className="text-[#9CA3AF]">({e.pin})</span>}
                      </div>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>

                  {/* Entry Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4 p-3 bg-slate-50 rounded">
                    <div>
                      <span className="text-[#6B7280]">Date:</span>
                      <div className="font-semibold">{e.date}</div>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">PO:</span>
                      <div className="font-bold text-[#1B4F72]">{e.po}</div>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Product:</span>
                      <Badge variant="blue" className="mt-1">{e.product}</Badge>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Activity:</span>
                      <div className="font-semibold">{e.activity}</div>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Amount:</span>
                      <div className="font-bold text-green-600">{formatCurrency(e.amount)}</div>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Vendor:</span>
                      <div className="font-semibold text-xs">{e.vendorName || '—'}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[#6B7280]">Decided By:</span>
                      <div className="font-semibold text-xs mt-1">
                        {e.decidedBy} {e.decidedByDesignation && <span className="text-slate-500">({e.decidedByDesignation})</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {e.description && (
                  <div className="mb-4 p-3 bg-blue-50 rounded border-l-4 border-l-blue-400">
                    <span className="text-xs font-bold text-slate-700">Description:</span>
                    <p className="text-sm text-slate-700 mt-1">{e.description}</p>
                  </div>
                )}

                {/* Photo Evidence Section */}
                {(e.campaignPhoto || e.expensePhoto || e.otherPhoto) && (
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded border-2 border-green-200">
                    <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                      📸 Activity Evidence & Supporting Photos
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Campaign Photo */}
                      {e.campaignPhoto && (
                        <div className="p-2 bg-white rounded border border-blue-300 hover:shadow-md transition">
                          <p className="text-xs font-bold text-blue-900 mb-2">📷 Campaign Photo</p>
                          <img 
                            src={e.campaignPhoto} 
                            alt="Campaign" 
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition"
                            onClick={() => {
                              const modal = document.createElement('div');
                              modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                              modal.innerHTML = `<div class="relative"><img src="${e.campaignPhoto}" class="max-w-4xl max-h-screen"/><button onclick="this.parentElement.parentElement.remove()" class="absolute top-4 right-4 text-white text-2xl font-bold">&times;</button></div>`;
                              document.body.appendChild(modal);
                            }}
                          />
                          <p className="text-xs text-green-600 mt-1 font-semibold">✓ Verified</p>
                        </div>
                      )}

                      {/* Expense Photo */}
                      {e.expensePhoto && (
                        <div className="p-2 bg-white rounded border border-amber-300 hover:shadow-md transition">
                          <p className="text-xs font-bold text-amber-900 mb-2">💰 Expense Photo</p>
                          <img 
                            src={e.expensePhoto} 
                            alt="Expense" 
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition"
                            onClick={() => {
                              const modal = document.createElement('div');
                              modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                              modal.innerHTML = `<div class="relative"><img src="${e.expensePhoto}" class="max-w-4xl max-h-screen"/><button onclick="this.parentElement.parentElement.remove()" class="absolute top-4 right-4 text-white text-2xl font-bold">&times;</button></div>`;
                              document.body.appendChild(modal);
                            }}
                          />
                          <p className="text-xs text-green-600 mt-1 font-semibold">✓ Verified</p>
                        </div>
                      )}

                      {/* Other Photo */}
                      {e.otherPhoto && (
                        <div className="p-2 bg-white rounded border border-purple-300 hover:shadow-md transition">
                          <p className="text-xs font-bold text-purple-900 mb-2">📹 Other Photo</p>
                          <img 
                            src={e.otherPhoto} 
                            alt="Other" 
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition"
                            onClick={() => {
                              const modal = document.createElement('div');
                              modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                              modal.innerHTML = `<div class="relative"><img src="${e.otherPhoto}" class="max-w-4xl max-h-screen"/><button onclick="this.parentElement.parentElement.remove()" class="absolute top-4 right-4 text-white text-2xl font-bold">&times;</button></div>`;
                              document.body.appendChild(modal);
                            }}
                          />
                          <p className="text-xs text-green-600 mt-1 font-semibold">✓ Verified</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-green-700 mt-3 italic">💡 Click any photo to view full-screen</p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
