import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Button, Input, Select, Label, Table, Th, Td, Badge, RoleBadge, Modal, SearchInput, cn } from '../../components/ui';

const ROLES = ['Owner', 'All India Manager', 'Regional Manager', 'Zonal Manager', 'Area Manager', 'Vendor'];
const REGIONS = ['North', 'West', 'South', 'East'];

type UserForm = {
  name: string; loginId: string; password: string; confirmPassword: string;
  role: string; status: string;
  phone: string; email: string;
  pan: string; aadhaar: string;
  region: string; zone: string; area: string;
  tradeName: string; vendorCode: string;
  perms: Record<string, boolean>;
  tabPerms: Record<string, boolean>;
};

const defaultForm = (): UserForm => ({
  name: '', loginId: '', password: '', confirmPassword: '',
  role: 'Area Manager', status: 'active',
  phone: '', email: '',
  pan: '', aadhaar: '',
  region: '', zone: '', area: '',
  tradeName: '', vendorCode: '',
  perms: { view: true, enter: false, edit: false, approve: false, manage: false },
  tabPerms: {}
});

const ALL_TABS: { id: string; label: string }[] = [
  { id: 'overview', label: 'Overview' }, { id: 'po', label: 'Purchase Orders' },
  { id: 'hierarchy', label: 'Hierarchy' }, { id: 'activities', label: 'Activities' },
  { id: 'vendor', label: 'Vendors' }, { id: 'billing', label: 'Billing' },
  { id: 'sheet', label: 'Activity Sheet' }, { id: 'approvals', label: 'Approvals' },
  { id: 'po-approvals', label: 'PO Approvals' }, { id: 'po-master', label: 'PO Master' },
  { id: 'users', label: 'Users' }, { id: 'territory', label: 'Territory' },
  { id: 'quick', label: 'Quick View' }, { id: 'transactions', label: 'Transactions' },
  { id: 'settings', label: 'Settings' }, { id: 'quotation', label: 'Quotation' }
];

export default function UserMgmtTab() {
  const { users, addUser, updateUser, deleteUser, currentUser, regions } = useAppContext();
  const u = currentUser!;

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState(defaultForm());
  const [credForm, setCredForm] = useState({ name: '', loginId: '', password: '', confirmPassword: '' });
  const [credUserId, setCredUserId] = useState('');
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const filtered = users.filter(user => {
    const matchSearch = !search || [user.name, user.loginId, user.role, user.territory?.region || '', user.territory?.zone || ''].join(' ').toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || user.role === roleFilter;
    return matchSearch && matchRole;
  });

  const set = (k: keyof UserForm, v: any) => setForm(f => ({ ...f, [k]: v }));
  const setPerms = (k: string) => setForm(f => ({ ...f, perms: { ...f.perms, [k]: !f.perms[k] } }));
  const setTabPerm = (tabId: string) => setForm(f => ({
    ...f,
    tabPerms: { ...f.tabPerms, [tabId]: f.tabPerms[tabId] === false ? true : false }
  }));

  const openCreate = () => {
    setForm(defaultForm());
    setEditId('');
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (uid: string) => {
    const user = users.find(x => x.id === uid);
    if (!user) return;
    setForm({
      name: user.name, loginId: user.loginId, password: user.password || '', confirmPassword: user.password || '',
      role: user.role, status: user.status,
      phone: user.phone || '', email: user.email || '',
      pan: user.pan || '', aadhaar: user.aadhaar || '',
      region: user.territory?.region || '', zone: user.territory?.zone || '', area: user.territory?.area || '',
      tradeName: user.territory?.tradeName || '', vendorCode: user.territory?.vendorCode || '',
      perms: { ...{ view: false, enter: false, edit: false, approve: false, manage: false }, ...user.perms },
      tabPerms: user.tabPerms || {}
    });
    setEditId(uid);
    setFormError('');
    setShowModal(true);
  };

  const openCreds = (uid: string) => {
    const user = users.find(x => x.id === uid);
    if (!user) return;
    setCredForm({ name: user.name, loginId: user.loginId, password: '', confirmPassword: '' });
    setCredUserId(uid);
    setFormError('');
    setShowPassword(false);
    setShowCredsModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.loginId.trim()) { setFormError('Name and Login ID are required.'); return; }
    if (!editId && !form.password) { setFormError('Password is required for new users.'); return; }
    if (form.password && form.password !== form.confirmPassword) { setFormError('Passwords do not match.'); return; }
    
    const territory: any = {};
    if (['Regional Manager', 'Zonal Manager', 'Area Manager'].includes(form.role)) { if (form.region) territory.region = form.region; }
    if (['Zonal Manager', 'Area Manager'].includes(form.role)) { if (form.zone) territory.zone = form.zone; }
    if (form.role === 'Area Manager') { if (form.area) territory.area = form.area; }
    if (form.role === 'Vendor') {
      if (form.tradeName) territory.tradeName = form.tradeName;
      if (form.vendorCode) territory.vendorCode = form.vendorCode;
    }

    const userData: any = {
      name: form.name.trim(), loginId: form.loginId.trim(),
      role: form.role as any, status: form.status as any,
      territory, perms: form.perms, tabPerms: form.tabPerms,
      phone: form.phone, email: form.email,
      pan: form.pan, aadhaar: form.aadhaar
    };
    if (form.password) userData.password = form.password;

    if (editId) {
      updateUser(editId, userData);
    } else {
      addUser(userData);
    }
    setShowModal(false);
  };

  const handleCreds = () => {
    if (!credForm.name.trim() || !credForm.loginId.trim()) { setFormError('Name and Login ID required.'); return; }
    if (credForm.password && credForm.password !== credForm.confirmPassword) { setFormError('Passwords do not match.'); return; }
    const updates: any = { name: credForm.name, loginId: credForm.loginId };
    if (credForm.password) updates.password = credForm.password;
    updateUser(credUserId, updates);
    setShowCredsModal(false);
  };

  const getZonesForRegion = (region: string) => {
    return regions.find(r => r.name === region)?.zones.map(z => z.name) || [];
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-bold text-[#1A1D23] text-base">System Users ({filtered.length})</h3>
          <div className="flex gap-2 flex-wrap">
            <SearchInput value={search} onChange={setSearch} placeholder="Search users..." />
            <Select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-40">
              <option value="">All Roles</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
            <Button onClick={openCreate}>+ Add User</Button>
          </div>
        </div>

        <Table>
          <thead>
            <tr><Th>Name</Th><Th>Login ID</Th><Th>Role</Th><Th>Territory</Th><Th>Permissions</Th><Th>Status</Th><Th>Actions</Th></tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.id} className="hover:bg-[#F8FAFC]">
                <Td className="font-bold text-[#1A1D23]">{user.name}</Td>
                <Td className="font-mono text-xs text-[#6B7280]">{user.loginId}</Td>
                <Td><RoleBadge role={user.role} /></Td>
                <Td className="text-xs text-[#6B7280]">
                  {user.territory?.region && <div> {user.territory.region}{user.territory?.zone ? ` · ${user.territory.zone}` : ''}{user.territory?.area ? ` · ${user.territory.area}` : ''}</div>}
                  {user.territory?.tradeName && <div> {user.territory.tradeName}</div>}
                  {!user.territory?.region && !user.territory?.tradeName && <span>All Regions</span>}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-0.5">
                    {user.perms.view && <Badge variant="green" className="text-[9px]">View</Badge>}
                    {user.perms.enter && <Badge variant="blue" className="text-[9px]">Enter</Badge>}
                    {user.perms.edit && <Badge variant="warning" className="text-[9px]">Edit</Badge>}
                    {user.perms.approve && <Badge variant="purple" className="text-[9px]">Approve</Badge>}
                    {user.perms.manage && <Badge variant="error" className="text-[9px]">Manage</Badge>}
                  </div>
                </Td>
                <Td>
                  <Badge variant={user.status === 'active' ? 'success' : 'error'}>{user.status}</Badge>
                </Td>
                <Td>
                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(user.id)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => openCreds(user.id)} title={u.role === 'Owner' ? 'View/Edit credentials' : 'Edit credentials'}>Credentials</Button>
                    {user.id !== u.id && (
                      <Button size="sm" variant={user.status === 'active' ? 'danger' : 'success'} onClick={() => updateUser(user.id, { status: user.status === 'active' ? 'inactive' : 'active' })}>
                        {user.status === 'active' ? '⊘' : '✓'}
                      </Button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit User' : 'Add New User'} width="max-w-2xl">
        {formError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{formError}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Label required>Full Name</Label><Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full Name" /></div>
          <div><Label required>Login ID</Label><Input value={form.loginId} onChange={e => set('loginId', e.target.value)} placeholder="loginid" /></div>
          <div>
            <Label required={!editId}>Password {editId && <span className="text-[9px] text-[#9CA3AF] ml-1">(leave blank to keep)</span>}</Label>
            <Input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={editId ? 'New password (optional)' : 'Password'} />
          </div>
          <div><Label required={!editId}>Confirm Password</Label><Input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Confirm password" /></div>
          <div>
            <Label required>Role</Label>
            <Select value={form.role} onChange={e => set('role', e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Phone number" /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" /></div>
          <div><Label>PAN</Label><Input value={form.pan} onChange={e => set('pan', e.target.value)} placeholder="ABCDE1234F" /></div>
          <div><Label>AADHAAR</Label><Input value={form.aadhaar} onChange={e => set('aadhaar', e.target.value)} placeholder="1234 5678 9012" /></div>

          {['Regional Manager', 'Zonal Manager', 'Area Manager'].includes(form.role) && (
            <div>
              <Label>Region</Label>
              <Select value={form.region} onChange={e => { set('region', e.target.value); set('zone', ''); }}>
                <option value="">Select Region...</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </Select>
            </div>
          )}
          {['Zonal Manager', 'Area Manager'].includes(form.role) && form.region && (
            <div>
              <Label>Zone</Label>
              <Select value={form.zone} onChange={e => set('zone', e.target.value)}>
                <option value="">Select Zone...</option>
                {getZonesForRegion(form.region).map(z => <option key={z} value={z}>{z}</option>)}
              </Select>
            </div>
          )}
          {form.role === 'Area Manager' && (
            <div><Label>Area</Label><Input value={form.area} onChange={e => set('area', e.target.value)} placeholder="e.g. Lucknow" /></div>
          )}
          {form.role === 'Vendor' && (
            <>
              <div><Label>Trade Name</Label><Input value={form.tradeName} onChange={e => set('tradeName', e.target.value)} placeholder="Company / Trade Name" /></div>
              <div><Label>Vendor Code</Label><Input value={form.vendorCode} onChange={e => set('vendorCode', e.target.value)} placeholder="VND-XXXX-001" /></div>
            </>
          )}

          <div className="col-span-2">
            <Label>Permissions</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {[
                { key: 'view', label: 'View' }, { key: 'enter', label: 'Enter Data' },
                { key: 'edit', label: 'Edit' }, { key: 'approve', label: 'Approve' }, { key: 'manage', label: 'Manage' }
              ].map(p => (
                <label key={p.key} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-xs font-semibold transition-all',
                  form.perms[p.key] ? 'bg-[#1B4F72] text-white border-[#1B4F72]' : 'bg-white text-[#374151] border-[#DDE3ED] hover:border-[#1B4F72]'
                )}>
                  <input type="checkbox" className="hidden" checked={form.perms[p.key]} onChange={() => setPerms(p.key)} />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            <Label>Tab Restrictions (Uncheck to hide tab for user)</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ALL_TABS.map(tab => {
                const isHidden = form.tabPerms[tab.id] === false;
                return (
                  <label key={tab.id} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-[10px] font-semibold transition-all',
                    !isHidden ? 'bg-green-500 text-white border-green-600' : 'bg-white text-[#374151] border-[#DDE3ED] hover:border-red-500'
                  )}>
                    <input type="checkbox" className="hidden" checked={!isHidden} onChange={() => setTabPerm(tab.id)} />
                    {tab.label}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSave}>{editId ? 'Save Changes' : 'Create User'}</Button>
        </div>
      </Modal>

      <Modal open={showCredsModal} onClose={() => setShowCredsModal(false)} title="Change Credentials">
        {formError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">⚠ {formError}</div>}
        <div className="space-y-4">
          <div><Label required>Display Name</Label><Input value={credForm.name} onChange={e => setCredForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><Label required>Login ID</Label><Input value={credForm.loginId} onChange={e => setCredForm(f => ({ ...f, loginId: e.target.value }))} /></div>
          {u.role === 'Owner' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Current Password {users.find(x => x.id === credUserId)?.password && <span className="text-[9px] text-[#9CA3AF] ml-1">(view only)</span>}</Label>
                {users.find(x => x.id === credUserId)?.password && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-[#1B4F72] font-semibold hover:underline"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                )}
              </div>
              {users.find(x => x.id === credUserId)?.password && (
                <div className="px-3 py-2.5 bg-[#F3F4F6] border border-[#DDE3ED] rounded-lg font-mono text-sm text-[#1A1D23] break-all">
                  {showPassword ? users.find(x => x.id === credUserId)?.password : '••••••••'}
                </div>
              )}
            </div>
          )}
          <div><Label>New Password <span className="text-[9px] text-[#9CA3AF] ml-1">(leave blank to keep current)</span></Label><Input type="password" value={credForm.password} onChange={e => setCredForm(f => ({ ...f, password: e.target.value }))} placeholder="New password" /></div>
          <div><Label>Confirm Password</Label><Input type="password" value={credForm.confirmPassword} onChange={e => setCredForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Confirm password" /></div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCredsModal(false)}>Cancel</Button>
            <Button onClick={handleCreds}>Save Credentials</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
