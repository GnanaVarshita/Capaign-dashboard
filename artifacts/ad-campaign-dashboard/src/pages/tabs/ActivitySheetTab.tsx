import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Button, Input, Select, Textarea, Label, Table, Th, Td, Badge, StatusBadge, RoleBadge, SearchInput, InfoBanner, cn } from '../../components/ui';
import { formatCurrency } from '../../lib/mock-data';
import { exportToExcel, exportToPDF } from '../../lib/utils';

export default function ActivitySheetTab() {
  const { currentUser, getVisiblePOs, crops, products, activities, users, addEntry, getMyEntries, deleteEntry, calcLiveSpent, calcPendingSpent, toast } = useAppContext();
  const u = currentUser!;

  const approvedPOs = getVisiblePOs().filter(p => p.approvalStatus === 'approved' && p.status !== 'Lapsed');
  const myEntries = getMyEntries();

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    area: u.territory?.area || '',
    pin: '',
    po: '',
    vendorId: '',
    zmId: u.role === 'Zonal Manager' ? u.id : (u.territory?.reportingZMId || ''),
    rmId: u.role === 'Regional Manager' ? u.id : (u.territory?.reportingRMId || ''),
    product: '',
    activity: '',
    crop: '',
    amount: '',
    description: '',
    campaignPhoto: '',  // Campaign photo
    expensePhoto: '',   // Expense photo
    otherPhoto: ''      // Other photo
  });
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const areaLocked = u.role === 'Area Manager';
  const zmLocked = ['Area Manager', 'Zonal Manager'].includes(u.role);
  const rmLocked = ['Area Manager', 'Zonal Manager', 'Regional Manager'].includes(u.role);

  const zmUser = users.find(x => x.id === form.zmId && x.role === 'Zonal Manager');
  const rmUser = users.find(x => x.id === form.rmId && x.role === 'Regional Manager');

  const availableVendors = useMemo(() => {
    const allVendors = users.filter(x => x.role === 'Vendor' && x.status === 'active');
    const linked = u.territory?.linkedVendorIds || [];
    if (linked.length) return allVendors.filter(v => linked.includes(v.id));
    const uZone = u.territory?.zone;
    const uRegion = u.territory?.region;
    if (uZone) return allVendors.filter(v => (v.territory?.assignedZones || []).some((z: any) => z.zone === uZone));
    if (uRegion) return allVendors.filter(v => (v.territory?.assignedZones || []).some((z: any) => z.region === uRegion));
    return allVendors;
  }, [users, u]);

  const selectedPO = approvedPOs.find(p => p.poNumber === form.po);

  const liveBudget = useMemo(() => {
    if (!selectedPO) return null;
    const myRegion = u.territory?.region || '';
    const spent = calcLiveSpent({ po: form.po, ...(myRegion ? { region: myRegion } : {}) });
    const pending = calcPendingSpent({ po: form.po, ...(myRegion ? { region: myRegion } : {}) });
    const budget = myRegion ? (selectedPO.regionBudgets[myRegion] || 0) : selectedPO.budget;
    return { budget, spent, pending, balance: budget - spent };
  }, [selectedPO, form.po, u, calcLiveSpent, calcPendingSpent]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (!form.date) missing.push('Date');
    if (!form.area.trim()) missing.push('Area');
    if (!form.po) missing.push('PO Number');
    if (!form.vendorId) missing.push('Vendor');
    if (!form.product) missing.push('Product');
    if (!form.activity) missing.push('Activity');
    if (!form.amount) missing.push('Amount');
    if (!form.description.trim()) missing.push('Description');
    if (['Area Manager', 'Zonal Manager'].includes(u.role) && !form.zmId) missing.push('Zonal Manager');
    if (['Area Manager', 'Zonal Manager', 'Regional Manager'].includes(u.role) && !form.rmId) missing.push('Regional Manager');
    if (form.pin && !/^\d{6}$/.test(form.pin)) { setError('PIN Code must be exactly 6 digits.'); return; }
    if (missing.length) { setError('Required: ' + missing.join(', ')); return; }
    setError('');

    const vendor = users.find(v => v.id === form.vendorId);
    const zm = users.find(u => u.id === form.zmId);
    const rm = users.find(u => u.id === form.rmId);

    addEntry({
      userId: u.id, userName: u.name, userRole: u.role,
      po: form.po, product: form.product, crop: form.crop, activity: form.activity,
      amount: parseFloat(form.amount), area: form.area.trim(), pin: form.pin,
      zmId: zm?.id || '', zmName: zm?.name || '',
      rmId: rm?.id || '', rmName: rm?.name || '',
      vendorId: vendor?.id || '', vendorName: vendor?.territory?.tradeName || vendor?.name || '',
      vendorCode: vendor?.territory?.vendorCode || '',
      description: form.description.trim(), date: form.date, remarks: '',
      region: u.territory?.region, zone: u.territory?.zone
    });

    setForm(f => ({ ...f, po: '', product: '', activity: '',
    crop: '', amount: '', pin: '', description: '', vendorId: '' }));
  };

  const filteredEntries = myEntries.filter(e => {
    const matchSearch = !search || [e.area, e.pin, e.po, e.product, e.activity, e.vendorName, e.description, e.zmName, e.rmName].join(' ').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <Card className="p-5 border-l-4 border-l-[#1B4F72]">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#1B4F72] flex items-center justify-center font-bold text-white">{u.name.charAt(0)}</div>
          <div>
            <p className="font-bold text-[#1A1D23]">{u.name}</p>
            <div className="flex items-center gap-2"><RoleBadge role={u.role} />{u.territory?.region && <span className="text-xs text-[#9CA3AF]">· {u.territory.region}{u.territory?.zone ? ` · ${u.territory.zone}` : ''}{u.territory?.area ? ` · ${u.territory.area}` : ''}</span>}</div>
          </div>
        </div>
      </Card>

      {liveBudget && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-6">
            <div><p className="text-xs text-[#6B7280] font-semibold">PO Budget</p><p className="font-black text-[#1B4F72] text-lg">{formatCurrency(liveBudget.budget)}</p></div>
            <div><p className="text-xs text-[#6B7280] font-semibold">Spent (Approved)</p><p className="font-black text-green-600 text-lg">{formatCurrency(liveBudget.spent)}</p></div>
            <div><p className="text-xs text-[#6B7280] font-semibold">Pending Approval</p><p className="font-black text-amber-600 text-lg">{formatCurrency(liveBudget.pending)}</p></div>
            <div><p className="text-xs text-[#6B7280] font-semibold">Balance</p><p className={`font-black text-lg ${liveBudget.balance < 0 ? 'text-red-600' : 'text-[#1A1D23]'}`}>{formatCurrency(liveBudget.balance)}</p></div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <CardTitle>Submit Activity Entry</CardTitle>
        {error && <InfoBanner color="red"><span> {error}</span></InfoBanner>}
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><Label required>Date</Label><Input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
            <div>
              <Label required>Area / Location</Label>
              <Input value={form.area} readOnly={areaLocked} className={areaLocked ? 'bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed' : ''} onChange={e => set('area', e.target.value)} placeholder="e.g. Lucknow" title={areaLocked ? 'Your assigned area — cannot be changed' : ''} />
              {areaLocked && <p className="text-[9px] text-[#9CA3AF] mt-0.5">Auto-filled</p>}
            </div>
            <div><Label>PIN Code</Label><Input value={form.pin} onChange={e => set('pin', e.target.value)} maxLength={6} placeholder="6-digit PIN" /></div>
            <div>
              <Label required>PO Number</Label>
              <Select value={form.po} onChange={e => set('po', e.target.value)}>
                <option value="">Select PO...</option>
                {approvedPOs.map(p => <option key={p.id} value={p.poNumber}>{p.poNumber} ({p.status})</option>)}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#F0F4F8]">
            <div>
              <Label>Zonal Manager {zmLocked && <span className="text-[9px] bg-[#E5E7EB] text-[#6B7280] px-1.5 py-0.5 rounded-full ml-1">Auto-filled</span>}</Label>
              {zmLocked ? (
                <Input value={zmUser ? `${zmUser.name}${zmUser.territory?.zone ? ` — ${zmUser.territory.zone}` : ''}` : form.zmId || 'N/A'} readOnly className="bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed" />
              ) : (
                <Select value={form.zmId} onChange={e => set('zmId', e.target.value)}>
                  <option value="">— N/A / Select —</option>
                  {users.filter(x => x.role === 'Zonal Manager' && x.status === 'active').map(x => <option key={x.id} value={x.id}>{x.name}{x.territory?.zone ? ` — ${x.territory.zone}` : ''}</option>)}
                </Select>
              )}
            </div>
            <div>
              <Label>Regional Manager {rmLocked && <span className="text-[9px] bg-[#E5E7EB] text-[#6B7280] px-1.5 py-0.5 rounded-full ml-1">Auto-filled</span>}</Label>
              {rmLocked ? (
                <Input value={rmUser ? `${rmUser.name}${rmUser.territory?.region ? ` — ${rmUser.territory.region}` : ''}` : form.rmId || 'N/A'} readOnly className="bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed" />
              ) : (
                <Select value={form.rmId} onChange={e => set('rmId', e.target.value)}>
                  <option value="">— N/A / Select —</option>
                  {users.filter(x => x.role === 'Regional Manager' && x.status === 'active').map(x => <option key={x.id} value={x.id}>{x.name}{x.territory?.region ? ` — ${x.territory.region}` : ''}</option>)}
                </Select>
              )}
            </div>
            <div>
              <Label required>Vendor</Label>
              <Select value={form.vendorId} onChange={e => set('vendorId', e.target.value)}>
                <option value="">{availableVendors.length ? 'Select Vendor...' : '— No vendors assigned —'}</option>
                {availableVendors.map(v => <option key={v.id} value={v.id}>{v.territory?.tradeName || v.name}{v.territory?.vendorCode ? ` (${v.territory.vendorCode})` : ''}</option>)}
              </Select>
            </div>
            <div><Label required>Amount (₹)</Label><Input type="number" min="0" step="1" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="e.g. 15000" /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Crop</Label>
              <Select value={form.crop} onChange={e => set('crop', e.target.value)}>
                <option value="">Select Crop...</option>
                {crops && crops.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div>
              <Label required>Product</Label>
              <Select value={form.product} onChange={e => set('product', e.target.value)}>
                <option value="">Select Product...</option>
                {products.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <div>
              <Label required>Activity Type</Label>
              <Select value={form.activity} onChange={e => set('activity', e.target.value)}>
                <option value="">Select Activity...</option>
                {activities.map(a => <option key={a} value={a}>{a}</option>)}
              </Select>
            </div>
          </div>

          <div>
            <Label required>Description</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Detailed description of the activity conducted..." />
          </div>

          {/* Photo Upload Fields */}
          <div className="border-t-2 border-slate-200 pt-4">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"> Photo Uploads for Verification</h4>
            <p className="text-sm text-slate-600 mb-4">Upload photos for ZM/RM/AIM verification (will be sent with activity entry)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Campaign Photo */}
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <Label className="font-bold text-sm text-blue-900 mb-2 block">Campaign Photo</Label>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setForm(f => ({ ...f, campaignPhoto: reader.result as string }));
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-sm"
                />
                {form.campaignPhoto && <p className="text-xs text-green-600 mt-2">✓ Photo uploaded</p>}
                <p className="text-xs text-slate-500 mt-1">Campaign activity photo</p>
              </div>

              {/* Expense Photo */}
              <div className="p-3 bg-amber-50 rounded border border-amber-200">
                <Label className="font-bold text-sm text-amber-900 mb-2 block">Expense Photo</Label>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setForm(f => ({ ...f, expensePhoto: reader.result as string }));
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-sm"
                />
                {form.expensePhoto && <p className="text-xs text-green-600 mt-2">✓ Photo uploaded</p>}
                <p className="text-xs text-slate-500 mt-1">Expense receipt/bill photo</p>
              </div>

              {/* Other Photo */}
              <div className="p-3 bg-purple-50 rounded border border-purple-200">
                <Label className="font-bold text-sm text-purple-900 mb-2 block"> Other Photo</Label>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setForm(f => ({ ...f, otherPhoto: reader.result as string }));
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-sm"
                />
                {form.otherPhoto && <p className="text-xs text-green-600 mt-2">✓ Photo uploaded</p>}
                <p className="text-xs text-slate-500 mt-1">Any other supporting photo</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => { setForm(f => ({ ...f, po: '', product: '', activity: '',
    crop: '', amount: '', pin: '', description: '', vendorId: '', campaignPhoto: '', expensePhoto: '', otherPhoto: '' })); setError(''); }}>Clear</Button>
            <Button type="submit">Submit Entry</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-bold text-[#1A1D23]">My Activity Sheet</h3>
          <div className="flex gap-2 flex-wrap">
            <SearchInput value={search} onChange={setSearch} placeholder="Search entries..." />
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-36">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
            <Button variant="secondary" size="sm" onClick={() => {
              const rows = filteredEntries.map((e, i) => ({
                '#': i + 1, Date: e.date, Area: e.area || '', PIN: e.pin || '',
                'PO Number': e.po, 'Zonal Manager': e.zmName || '', 'Regional Manager': e.rmName || '',
                Vendor: e.vendorName || '', Product: e.product, Crop: e.crop || '',
                Activity: e.activity, 'Amount (₹)': e.amount, Description: e.description,
                Status: e.status, 'Decided By': e.decidedBy || ''
              }));
              exportToExcel(rows, `Activity_Sheet_${u.name.replace(' ', '_')}`);
            }}>Excel</Button>
            <Button variant="secondary" size="sm" onClick={() => {
              const rows = filteredEntries.map((e, i) => ({
                '#': i + 1, Date: e.date, Area: e.area || '', PO: e.po,
                Vendor: e.vendorName || '', Product: e.product, Activity: e.activity,
                'Amount (₹)': e.amount, Description: e.description, Status: e.status
              }));
              exportToPDF(rows, `Activity_Sheet_${u.name}`);
            }}>PDF</Button>
          </div>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>#</Th><Th>Date</Th><Th>Area</Th><Th>PIN</Th><Th>PO</Th><Th>ZM</Th><Th>RM</Th><Th>Vendor</Th><Th>Product</Th><Th>Activity</Th><Th>Amount</Th><Th>Description</Th><Th>Status</Th><Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr><Td colSpan={14} className="text-center py-10 text-[#9CA3AF]">{myEntries.length === 0 ? 'No entries yet. Fill the form above.' : 'No entries match your filter.'}</Td></tr>
            ) : filteredEntries.map((e, idx) => (
              <tr key={e.id} className="hover:bg-[#F8FAFC]">
                <Td className="text-[#9CA3AF] text-xs">{idx + 1}</Td>
                <Td className="whitespace-nowrap text-[#374151]">{e.date}</Td>
                <Td className="font-medium">{e.area || '—'}</Td>
                <Td className="font-mono text-xs text-[#9CA3AF]">{e.pin || '—'}</Td>
                <Td className="font-bold text-[#1B4F72]">{e.po}</Td>
                <Td className="text-xs text-purple-600">{e.zmName || '—'}</Td>
                <Td className="text-xs text-blue-600">{e.rmName || '—'}</Td>
                <Td className="text-xs">{e.vendorName ? <span className="bg-[#F3F4F6] px-1.5 py-0.5 rounded-md">{e.vendorName}</span> : '—'}</Td>
                <Td><Badge variant="blue">{e.product}</Badge></Td>
                <Td className="text-xs">{e.activity}</Td>
                <Td className="font-bold text-[#1B4F72] whitespace-nowrap">{formatCurrency(e.amount)}</Td>
                <Td className="max-w-[150px] text-xs text-[#6B7280]" title={e.description}><span className="line-clamp-2">{e.description}</span></Td>
                <Td>
                  <StatusBadge status={e.status} />
                  {e.decidedBy && <div className="text-[9px] text-[#9CA3AF] mt-0.5">{e.decidedBy}</div>}
                </Td>
                <Td>
                  {e.status === 'pending'
                    ? <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete this entry?')) deleteEntry(e.id); }}>Delete</Button>
                    : <span className="text-[#9CA3AF] text-xs">—</span>}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

