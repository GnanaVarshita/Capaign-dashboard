import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Badge, RoleBadge, TabPills, cn } from '../../components/ui';
import { formatCurrency } from '../../lib/mock-data';

function UserCard({ userId, users }: { userId: string; users: any[] }) {
  const u = users.find(x => x.id === userId);
  if (!u) return null;
  return (
    <div className="flex items-center gap-2 p-2 bg-white border border-[#DDE3ED] rounded-lg text-xs">
      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[10px] shrink-0',
        u.role === 'Owner' ? 'bg-amber-500' : u.role === 'All India Manager' ? 'bg-purple-600' :
        u.role === 'Regional Manager' ? 'bg-blue-600' : u.role === 'Zonal Manager' ? 'bg-green-600' :
        u.role === 'Area Manager' ? 'bg-red-500' : 'bg-orange-500')}>
        {u.name.charAt(0)}
      </div>
      <div>
        <div className="font-semibold text-[#1A1D23]">{u.name}</div>
        <div className="text-[#9CA3AF] font-mono text-[9px]">{u.loginId}</div>
      </div>
      {u.status === 'inactive' && <Badge variant="error" className="ml-auto text-[8px]">Inactive</Badge>}
    </div>
  );
}

export default function HierarchyTab() {
  const { regions, users, entries, calcLiveSpent, getVisiblePOs, currentUser } = useAppContext();
  const [subTab, setSubTab] = useState('tree');
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set(['North']));
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());

  const canSeeVendors = currentUser?.role === 'Owner' || currentUser?.role === 'All India Manager';
  const activePOs = getVisiblePOs().filter(p => p.status === 'Active' || p.status === 'Expiring Soon');

  const aim = users.find(u => u.role === 'All India Manager' && u.status === 'active');
  const owner = users.find(u => u.role === 'Owner' && u.status === 'active');
  const vendors = users.filter(u => u.role === 'Vendor');

  const userRegion = currentUser?.role === 'Regional Manager' ? currentUser.territory?.region : null;

  const toggleRegion = (r: string) => {
    setExpandedRegions(prev => { const s = new Set(prev); s.has(r) ? s.delete(r) : s.add(r); return s; });
  };

  const toggleZone = (z: string) => {
    setExpandedZones(prev => { const s = new Set(prev); s.has(z) ? s.delete(z) : s.add(z); return s; });
  };

  const tabs: { id: string; label: string }[] = [
    { id: 'tree', label: 'Organisation Tree' },
    ...(canSeeVendors ? [{ id: 'vendors', label: 'Vendors' }] : [])
  ];

  const visibleRegions = regions.filter(r => !userRegion || r.name === userRegion);

  return (
    <div className="space-y-6">
      <TabPills tabs={tabs} active={subTab} onChange={setSubTab} />

      {subTab === 'tree' && (
        <div className="space-y-4">
          {(aim || owner) && (
            <Card className="p-4 bg-gradient-to-r from-[#1B4F72]/5 to-[#1B4F72]/10 border-[#1B4F72]/20">
              <div className="flex flex-wrap gap-3">
                {owner && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-200">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center font-black text-white">{owner.name.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-[#1A1D23] text-sm">{owner.name}</p>
                      <RoleBadge role="Owner" />
                      <p className="text-[#9CA3AF] font-mono text-[9px] mt-0.5">{owner.loginId}</p>
                    </div>
                  </div>
                )}
                {aim && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-purple-200">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-black text-white">{aim.name.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-[#1A1D23] text-sm">{aim.name}</p>
                      <RoleBadge role="All India Manager" />
                      <p className="text-[#9CA3AF] font-mono text-[9px] mt-0.5">{aim.loginId}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {visibleRegions.map(region => {
            const rmUsers = users.filter(u => u.role === 'Regional Manager' && u.territory?.region === region.name);
            const rBudget = activePOs.reduce((s, po) => s + (po.regionBudgets[region.name] || 0), 0);
            const rSpent = calcLiveSpent({ region: region.name });
            const isOpen = expandedRegions.has(region.name);

            return (
              <Card key={region.name} className="overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#F8FAFC] transition-colors"
                  onClick={() => toggleRegion(region.name)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: region.color }} />
                    <div>
                      <h3 className="font-bold text-[#1B4F72]">🗺️ {region.name} Region</h3>
                      <p className="text-xs text-[#6B7280]">
                        Budget: <strong>{formatCurrency(rBudget)}</strong> · Spent: <strong className="text-green-600">{formatCurrency(rSpent)}</strong>
                        {region.states?.length > 0 && ` · ${region.states.slice(0, 2).join(', ')}${region.states.length > 2 ? '...' : ''}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {rmUsers.slice(0, 3).map(u => (
                        <div key={u.id} className="w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold" title={u.name}>{u.name.charAt(0)}</div>
                      ))}
                    </div>
                    <span className="text-[#9CA3AF] text-lg">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-[#DDE3ED] p-4 space-y-3">
                    <div>
                      <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Regional Managers</p>
                      <div className="flex flex-wrap gap-2">
                        {rmUsers.length > 0 ? rmUsers.map(u => <UserCard key={u.id} userId={u.id} users={users} />) : <p className="text-xs text-[#9CA3AF]">No regional manager assigned</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {region.zones.map(zone => {
                        const zmUser = users.find(u => u.role === 'Zonal Manager' && u.territory?.zone === zone.name);
                        const amUsers = users.filter(u => u.role === 'Area Manager' && u.territory?.zone === zone.name);
                        const zBudget = activePOs.reduce((s, po) => {
                          const za = ((po.zoneAllocations[region.name] || {})[zone.name] || {}) as Record<string, Record<string, number>>;
                          return s + Object.values(za).reduce((s2: number, p) => s2 + Object.values(p).reduce((s3: number, v: number) => s3 + v, 0), 0);
                        }, 0);
                        const zSpent = calcLiveSpent({ zone: zone.name });
                        const isZoneOpen = expandedZones.has(zone.name);

                        return (
                          <div key={zone.name} className="border border-[#DDE3ED] rounded-xl overflow-hidden">
                            <div
                              className="flex items-center justify-between p-3 bg-[#F8FAFC] cursor-pointer hover:bg-[#F0F4F8]"
                              onClick={() => toggleZone(zone.name)}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">📍</span>
                                <div>
                                  <p className="font-semibold text-[#374151] text-sm">{zone.name}</p>
                                  <p className="text-xs text-[#9CA3AF]">
                                    ZM: {zmUser ? zmUser.name : zone.manager || 'Unassigned'}
                                    {zBudget > 0 && ` · Alloc: ${formatCurrency(zBudget)} · Spent: ${formatCurrency(zSpent)}`}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[#9CA3AF]">{isZoneOpen ? '▲' : '▼'}</span>
                            </div>

                            {isZoneOpen && (
                              <div className="p-3 space-y-2 border-t border-[#DDE3ED]">
                                {zmUser && (
                                  <div className="mb-2">
                                    <p className="text-xs font-bold text-[#6B7280] mb-1">Zonal Manager</p>
                                    <UserCard userId={zmUser.id} users={users} />
                                  </div>
                                )}
                                <p className="text-xs font-bold text-[#6B7280]">Area Managers ({amUsers.length})</p>
                                <div className="flex flex-wrap gap-2">
                                  {amUsers.length > 0 ? amUsers.map(u => <UserCard key={u.id} userId={u.id} users={users} />) : (
                                    <div className="w-full">
                                      {zone.areas.map(a => (
                                        <div key={a.name} className="p-2 bg-[#F8FAFC] rounded-lg text-xs text-[#374151] mb-1">
                                          📌 {a.name} {a.manager && `— ${a.manager}`}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {subTab === 'vendors' && (
        <div className="space-y-4">
          <p className="text-sm text-[#6B7280]">{vendors.length} registered vendors</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vendors.map(v => {
              const vEntries = entries.filter(e => e.vendorId === v.id);
              const approved = vEntries.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0);
              return (
                <Card key={v.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-bold text-white">
                        {v.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-[#1A1D23] text-sm">{v.territory?.tradeName || v.name}</p>
                        <p className="text-xs text-[#9CA3AF] font-mono">{v.territory?.vendorCode || '—'}</p>
                      </div>
                    </div>
                    <Badge variant={v.status === 'active' ? 'success' : 'error'}>{v.status}</Badge>
                  </div>
                  <div className="space-y-1 text-xs text-[#6B7280]">
                    {v.phone && <p>📞 {v.phone}</p>}
                    {v.email && <p>✉️ {v.email}</p>}
                    {v.territory?.assignedZones?.map((z, i) => (
                      <p key={i}>📍 {z.zone}, {z.region} — {z.activities?.join(', ')}</p>
                    ))}
                  </div>
                  {approved > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#F0F4F8]">
                      <p className="text-xs text-[#6B7280]">Approved Activity Amount</p>
                      <p className="font-bold text-green-600">{formatCurrency(approved)}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
