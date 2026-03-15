import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Button, Input, Select, Label, Table, Th, Td, Badge, cn } from '../../components/ui';
import { formatCurrency } from '../../lib/mock-data';
import { CheckCircle2, XCircle, Search, Trash2 } from 'lucide-react';

export function ActivitySheetTab() {
  const { currentUser, pos, products, activities, users, addEntry, entries, deleteEntry } = useAppContext();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    po: '', product: '', activity: '', amount: '',
    area: currentUser?.territory?.area || '', pin: '',
    description: '', vendorId: ''
  });

  const [error, setError] = useState('');

  const activePOs = pos.filter(p => p.approvalStatus === 'approved' && p.status !== 'Lapsed');
  const vendors = users.filter(u => u.role === 'Vendor');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.po || !formData.product || !formData.activity || !formData.amount || !formData.area || !formData.description) {
      setError('Please fill all required fields');
      return;
    }

    const vendor = vendors.find(v => v.id === formData.vendorId);

    addEntry({
      userId: currentUser!.id,
      userName: currentUser!.name,
      userRole: currentUser!.role,
      po: formData.po,
      product: formData.product,
      activity: formData.activity,
      amount: parseFloat(formData.amount),
      area: formData.area,
      pin: formData.pin,
      zmId: currentUser!.territory?.reportingZMId || '',
      zmName: users.find(u => u.id === currentUser!.territory?.reportingZMId)?.name || '',
      rmId: currentUser!.territory?.reportingRMId || '',
      rmName: users.find(u => u.id === currentUser!.territory?.reportingRMId)?.name || '',
      vendorId: vendor?.id || '',
      vendorName: vendor?.territory?.tradeName || vendor?.name || '',
      vendorCode: vendor?.territory?.vendorCode || '',
      description: formData.description,
      date: formData.date,
      remarks: ''
    });

    setFormData(prev => ({ ...prev, amount: '', description: '' }));
    setError('');
  };

  const myEntries = entries.filter(e => e.userId === currentUser?.id);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-6 bg-gradient-to-br from-white to-blue-50/50">
        <CardTitle className="border-none mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg">
              {currentUser?.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{currentUser?.name}</h2>
              <p className="text-sm text-muted-foreground">{currentUser?.role} • {currentUser?.territory.region || 'All Regions'}</p>
            </div>
          </div>
        </CardTitle>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold">{error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><Label required>Date</Label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
            <div><Label required>Area / Location</Label><Input type="text" value={formData.area} readOnly={!!currentUser?.territory?.area} className={currentUser?.territory?.area ? "bg-slate-50 text-slate-500" : ""} onChange={e => setFormData({...formData, area: e.target.value})} /></div>
            <div><Label>PIN Code</Label><Input type="text" maxLength={6} value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} /></div>
            <div>
              <Label required>PO Number</Label>
              <Select value={formData.po} onChange={e => setFormData({...formData, po: e.target.value})}>
                <option value="">Select PO...</option>
                {activePOs.map(p => <option key={p.id} value={p.poNumber}>{p.poNumber}</option>)}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border/50">
            <div>
              <Label required>Vendor</Label>
              <Select value={formData.vendorId} onChange={e => setFormData({...formData, vendorId: e.target.value})}>
                <option value="">Select Vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.territory.tradeName || v.name}</option>)}
              </Select>
            </div>
            <div>
              <Label required>Product</Label>
              <Select value={formData.product} onChange={e => setFormData({...formData, product: e.target.value})}>
                <option value="">Select Product...</option>
                {products.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <div>
              <Label required>Activity</Label>
              <Select value={formData.activity} onChange={e => setFormData({...formData, activity: e.target.value})}>
                <option value="">Select Activity...</option>
                {activities.map(a => <option key={a} value={a}>{a}</option>)}
              </Select>
            </div>
            <div><Label required>Amount (₹)</Label><Input type="number" min="0" placeholder="e.g. 15000" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
          </div>

          <div>
            <Label required>Description</Label>
            <textarea 
              className="w-full h-24 rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none transition-all"
              placeholder="Detailed description of the activity..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setFormData(prev => ({...prev, amount: '', description: ''}))}>Clear</Button>
            <Button type="submit">Submit Entry</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <CardTitle>My Submissions</CardTitle>
        <Table>
          <thead>
            <tr><Th>Date</Th><Th>PO</Th><Th>Location</Th><Th>Vendor</Th><Th>Product / Activity</Th><Th>Amount</Th><Th>Status</Th><Th>Action</Th></tr>
          </thead>
          <tbody>
            {myEntries.length === 0 ? (
              <tr><Td colSpan={8} className="text-center py-8 text-muted-foreground">No entries submitted yet.</Td></tr>
            ) : (
              myEntries.map(e => (
                <tr key={e.id}>
                  <Td>{e.date}</Td>
                  <Td className="font-bold text-primary">{e.po}</Td>
                  <Td>{e.area} <span className="text-xs text-muted-foreground">({e.pin})</span></Td>
                  <Td>{e.vendorName}</Td>
                  <Td>
                    <div className="flex flex-col gap-1">
                      <Badge variant="blue" className="w-fit">{e.product}</Badge>
                      <span className="text-xs">{e.activity}</span>
                    </div>
                  </Td>
                  <Td className="font-bold">{formatCurrency(e.amount)}</Td>
                  <Td>
                    {e.status === 'pending' && <Badge variant="warning">Pending</Badge>}
                    {e.status === 'approved' && <Badge variant="success">Approved</Badge>}
                    {e.status === 'rejected' && <Badge variant="error">Rejected</Badge>}
                  </Td>
                  <Td>
                    {e.status === 'pending' ? (
                      <Button variant="danger" className="h-8 px-3 text-xs" onClick={() => deleteEntry(e.id)}><Trash2 className="w-3 h-3 mr-1" /> Delete</Button>
                    ) : '-'}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

export function ApprovalsTab() {
  const { getVisiblePendingEntries, updateEntryStatus } = useAppContext();
  const pending = getVisiblePendingEntries();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-6">
        <CardTitle>
          Pending Approvals
          <Badge variant="warning">{pending.length} Pending</Badge>
        </CardTitle>
        <Table>
          <thead>
            <tr><Th>Submitted By</Th><Th>PO</Th><Th>Location</Th><Th>Vendor</Th><Th>Details</Th><Th>Amount</Th><Th>Actions</Th></tr>
          </thead>
          <tbody>
            {pending.length === 0 ? (
              <tr><Td colSpan={7} className="text-center py-12 text-muted-foreground">All caught up! No pending approvals.</Td></tr>
            ) : (
              pending.map(e => (
                <tr key={e.id}>
                  <Td>
                    <div className="font-bold">{e.userName}</div>
                    <div className="text-xs text-muted-foreground">{e.userRole}</div>
                  </Td>
                  <Td className="font-bold text-primary">{e.po}</Td>
                  <Td>{e.area}</Td>
                  <Td>{e.vendorName}</Td>
                  <Td>
                    <Badge variant="blue" className="mb-1">{e.product}</Badge>
                    <div className="text-xs">{e.activity}</div>
                    <div className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate" title={e.description}>{e.description}</div>
                  </Td>
                  <Td className="font-bold text-lg">{formatCurrency(e.amount)}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button className="h-9 px-3 bg-green-600 hover:bg-green-700" onClick={() => updateEntryStatus(e.id, 'approved', 'Current User')}>
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button variant="danger" className="h-9 px-3" onClick={() => updateEntryStatus(e.id, 'rejected', 'Current User')}>
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
