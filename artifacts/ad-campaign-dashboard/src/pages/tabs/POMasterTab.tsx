import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Button, Input, Select, Textarea, Label, Table, Th, Td, Badge, Modal, ProgressBar, SearchInput, InfoBanner, cn } from '../../components/ui';
import { formatCurrency, formatLakhs, pct } from '../../lib/mock-data';
import { POWizardModal, PODistributionModal, MasterItemModal } from './components/POMasterModals';

const statusBadge = (s: string) =>
  s === 'Active' ? <Badge variant="success">{s}</Badge> :
  s === 'Expiring Soon' ? <Badge variant="warning">{s}</Badge> :
  s === 'Lapsed' ? <Badge variant="error">{s}</Badge> :
  <Badge variant="default">{s}</Badge>;

const approvalBadge = (s: string) =>
  s === 'approved' ? <Badge variant="success">Approved</Badge> :
  s === 'rejected' ? <Badge variant="error">Rejected</Badge> :
  <Badge variant="warning">Pending</Badge>;

export default function POMasterTab() {
  const { 
    pos, setPOs, addPO, updatePO, lapsePO, approvePO, rejectPO, 
    calcLiveSpent, calcPendingSpent, 
    regions, products, crops, activities,
    addProduct: apiAddProduct, updateProduct: apiUpdateProduct, deleteProduct: apiDeleteProduct,
    addActivity: apiAddActivity, updateActivity: apiUpdateActivity, deleteActivity: apiDeleteActivity,
    addCrop: apiAddCrop, updateCrop: apiUpdateCrop, deleteCrop: apiDeleteCrop,
    currentUser 
  } = useAppContext();
  const u = currentUser!;
  const canManage = u.role === 'Owner' || u.perms.manage;
  const canApprove = u.role === 'Owner' || u.role === 'All India Manager';

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(pos[0]?.id || '');
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [showDistModal, setShowDistModal] = useState(false);
  const [distRegion, setDistRegion] = useState('');
  const [distData, setDistData] = useState<Record<string, Record<string, Record<string, number>>>>({});

  // Product Master Modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', description: '' });
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  // Activity Master Modal state
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityForm, setActivityForm] = useState({ name: '', description: '' });
  const [editingActivity, setEditingActivity] = useState<string | null>(null);

  // Crop Master Modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropForm, setCropForm] = useState({ name: '', description: '' });
  const [editingCrop, setEditingCrop] = useState<string | null>(null);

  const initForm = {
    poNumber: '', budget: '', from: '', to: '', status: 'Draft' as any,
    remarks: '', regionBudgets: {} as Record<string, string>
  };
  const [form, setForm] = useState(initForm);

  const userRegion = currentUser?.role === 'Regional Manager' ? currentUser.territory?.region : null;

  const filtered = pos.filter(p => {
    const matchSearch = p.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      (p.remarks || '').toLowerCase().includes(search.toLowerCase()) ||
      p.status.toLowerCase().includes(search.toLowerCase());
    
    if (userRegion) {
      return matchSearch && p.regionBudgets[userRegion];
    }
    return matchSearch;
  });

  const selected = pos.find(p => p.id === selectedId) || pos[0];

  const openCreate = () => {
    setForm(initForm);
    setEditMode(false);
    setWizardStep(1);
    setShowWizard(true);
  };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      poNumber: selected.poNumber, budget: String(selected.budget),
      from: selected.from, to: selected.to, status: selected.status,
      remarks: selected.remarks || '',
      regionBudgets: Object.fromEntries(Object.entries(selected.regionBudgets).map(([k, v]) => [k, String(v)]))
    });
    setEditMode(true);
    setWizardStep(1);
    setShowWizard(true);
  };

  const handleSavePO = () => {
    const regionBudgets = Object.fromEntries(
      Object.entries(form.regionBudgets).filter(([, v]) => v && parseFloat(v) > 0).map(([k, v]) => [k, parseFloat(v)])
    );
    if (editMode && selected) {
      updatePO(selected.id, {
        poNumber: form.poNumber, budget: parseFloat(form.budget) || 0,
        from: form.from, to: form.to, status: selected.status,
        remarks: form.remarks, regionBudgets
      });
    } else {
      addPO({
        poNumber: form.poNumber, budget: parseFloat(form.budget) || 0,
        from: form.from, to: form.to, status: 'Draft' as const,
        remarks: form.remarks, createdBy: u.name,
        createdAt: new Date().toISOString().split('T')[0],
        approvalStatus: 'pending' as const, approvedBy: '', approvedAt: '', rejectionReason: '',
        regionBudgets, allocations: {}, zoneAllocations: {}
      });
    }
    setShowWizard(false);
  };

  const openDistribute = (region: string) => {
    if (!selected) return;
    setDistRegion(region);
    const existing = selected.allocations[region] || {};
    const d: Record<string, Record<string, Record<string, number>>> = {};
    products.forEach(p => {
      d[p] = {};
      crops.forEach(c => {
        d[p][c] = {};
        activities.forEach(a => { 
          d[p][c][a] = ((existing[p] || {})[c] || {})[a] || 0; 
        });
      });
    });
    setDistData(d);
    setShowDistModal(true);
  };

  const saveDistribution = () => {
    if (!selected) return;
    const newAlloc = { ...selected.allocations };
    newAlloc[distRegion] = {};
    Object.entries(distData).forEach(([p, crops_obj]) => {
      newAlloc[distRegion][p] = {};
      Object.entries(crops_obj).forEach(([c, acts]) => {
        newAlloc[distRegion][p][c] = {};
        Object.entries(acts).forEach(([a, v]) => { 
          if (v > 0) newAlloc[distRegion][p][c][a] = v; 
        });
      });
    });
    updatePO(selected.id, { allocations: newAlloc });
    setShowDistModal(false);
  };

  const autoGenPO = () => setForm(f => ({ ...f, poNumber: `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}` }));

  // Product Master Handlers
  const openAddProduct = () => {
    setProductForm({ name: '', description: '' });
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const openEditProduct = (product: string) => {
    setProductForm({ name: product, description: '' });
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const saveProduct = () => {
    if (!productForm.name.trim()) return;
    if (editingProduct) {
      apiUpdateProduct(editingProduct, productForm.name);
    } else {
      apiAddProduct(productForm.name);
    }
    setShowProductModal(false);
    setProductForm({ name: '', description: '' });
    setEditingProduct(null);
  };

  const deleteProduct = (product: string) => {
    if (confirm(`Delete product "${product}"?`)) {
      apiDeleteProduct(product);
    }
  };

  // Activity Master Handlers
  const openAddActivity = () => {
    setActivityForm({ name: '', description: '' });
    setEditingActivity(null);
    setShowActivityModal(true);
  };

  const openEditActivity = (activity: string) => {
    setActivityForm({ name: activity, description: '' });
    setEditingActivity(activity);
    setShowActivityModal(true);
  };

  const saveActivity = () => {
    if (!activityForm.name.trim()) return;
    if (editingActivity) {
      apiUpdateActivity(editingActivity, activityForm.name);
    } else {
      apiAddActivity(activityForm.name);
    }
    setShowActivityModal(false);
    setActivityForm({ name: '', description: '' });
    setEditingActivity(null);
  };

  const deleteActivity = (activity: string) => {
    if (confirm(`Delete activity "${activity}"?`)) {
      apiDeleteActivity(activity);
    }
  };

  // Crop Master Handlers
  const openAddCrop = () => {
    setCropForm({ name: '', description: '' });
    setEditingCrop(null);
    setShowCropModal(true);
  };

  const openEditCrop = (crop: string) => {
    setCropForm({ name: crop, description: '' });
    setEditingCrop(crop);
    setShowCropModal(true);
  };

  const saveCrop = () => {
    if (!cropForm.name.trim()) return;
    if (editingCrop) {
      apiUpdateCrop(editingCrop, cropForm.name);
    } else {
      apiAddCrop(cropForm.name);
    }
    setShowCropModal(false);
    setCropForm({ name: '', description: '' });
    setEditingCrop(null);
  };

  const deleteCrop = (crop: string) => {
    if (confirm(`Delete crop "${crop}"?`)) {
      apiDeleteCrop(crop);
    }
  };

  return (
    <div className="space-y-0">
      {/* PO Master Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#1A1D23]">PO Master Management</h2>
        <p className="text-sm text-[#6B7280] mt-1">Create and manage Purchase Orders, Products, Crops, and Activities</p>
      </div>

      {/* Product Master & Activity Master Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Product Master Card */}
        <div className="border border-[#DDE3ED] rounded-xl bg-white overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-[#EBF3FA] to-[#F0F9FF] border-b border-[#DDE3ED] flex items-center justify-between">
            <h3 className="font-bold text-[#1B4F72] flex items-center gap-2">Product Master</h3>
            {canManage && <Button size="sm" onClick={openAddProduct}>+ Add Product</Button>}
          </div>
          <div className="max-h-[280px] overflow-y-auto divide-y divide-[#F0F4F8]">
            {products.length === 0 ? (
              <div className="p-6 text-center text-[#9CA3AF] text-sm">
                <p>No products added yet.</p>
              </div>
            ) : (
              products.map((product, idx) => (
                <div key={idx} className="p-3.5 hover:bg-[#F9FAFB] transition-colors flex items-center justify-between group">
                  <div className="flex-1">
                    <p className="font-semibold text-[#1A1D23] text-sm">{product}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">Product Code: PRD-{String(idx + 1).padStart(3, '0')}</p>
                  </div>
                  {canManage && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" onClick={() => openEditProduct(product)} className="text-xs">Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => deleteProduct(product)} className="text-xs">Delete</Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Crop Master Card */}
        <div className="border border-[#DDE3ED] rounded-xl bg-white overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-[#DCFCE7] to-[#ECFDF5] border-b border-[#DDE3ED] flex items-center justify-between">
            <h3 className="font-bold text-[#166534] flex items-center gap-2">Crop Master</h3>
            {canManage && <Button size="sm" onClick={openAddCrop}>+ Add Crop</Button>}
          </div>
          <div className="max-h-[280px] overflow-y-auto divide-y divide-[#F0F4F8]">
            {crops.length === 0 ? (
              <div className="p-6 text-center text-[#9CA3AF] text-sm">
                <p>No crops added yet.</p>
              </div>
            ) : (
              crops.map((crop, idx) => (
                <div key={idx} className="p-3.5 hover:bg-[#F9FAFB] transition-colors flex items-center justify-between group">
                  <div className="flex-1">
                    <p className="font-semibold text-[#1A1D23] text-sm">{crop}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">Crop Code: CRP-{String(idx + 1).padStart(3, '0')}</p>
                  </div>
                  {canManage && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" onClick={() => openEditCrop(crop)} className="text-xs">Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => deleteCrop(crop)} className="text-xs">Delete</Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        {/* Activity Master Card */}
        <div className="border border-[#DDE3ED] rounded-xl bg-white overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-[#FEF3C7] to-[#FEF9E7] border-b border-[#DDE3ED] flex items-center justify-between">
            <h3 className="font-bold text-[#B45309] flex items-center gap-2">Activity Master</h3>
            {canManage && <Button size="sm" onClick={openAddActivity}>+ Add Activity</Button>}
          </div>
          <div className="max-h-[280px] overflow-y-auto divide-y divide-[#F0F4F8]">
            {activities.length === 0 ? (
              <div className="p-6 text-center text-[#9CA3AF] text-sm">
                <p>No activities added yet.</p>
              </div>
            ) : (
              activities.map((activity, idx) => (
                <div key={idx} className="p-3.5 hover:bg-[#F9FAFB] transition-colors flex items-center justify-between group">
                  <div className="flex-1">
                    <p className="font-semibold text-[#1A1D23] text-sm">{activity}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">Activity Code: ACT-{String(idx + 1).padStart(3, '0')}</p>
                  </div>
                  {canManage && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" onClick={() => openEditActivity(activity)} className="text-xs">Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => deleteActivity(activity)} className="text-xs">Delete</Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Visual Divider */}
      <div className="border-t-2 border-[#EEF2F7] py-4">
        <p className="text-sm font-bold text-[#1A1D23]">Purchase Orders</p>
      </div>

      {/* Purchase Orders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* LEFT - List */}
        <div className="border border-[#DDE3ED] rounded-xl lg:rounded-r-none lg:border-r-0 bg-white overflow-hidden">
          <div className="p-4 border-b border-[#DDE3ED] flex items-center justify-between bg-[#F8FAFC]">
            <h3 className="font-bold text-[#1A1D23]">Purchase Orders</h3>
            {canManage && <Button size="sm" onClick={openCreate}>+ New PO</Button>}
          </div>
          <div className="p-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search POs..." />
          </div>
          <div className="overflow-y-auto max-h-[600px] divide-y divide-[#F0F4F8]">
            {filtered.map(po => {
              const spent = calcLiveSpent({ po: po.poNumber });
              const utilPct = pct(spent, po.budget);
              return (
                <div
                  key={po.id}
                  onClick={() => setSelectedId(po.id)}
                  className={cn('p-4 cursor-pointer hover:bg-[#F8FAFC] transition-colors', selectedId === po.id ? 'bg-[#EBF5FB] border-l-4 border-l-[#1B4F72]' : '')}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-bold text-[#1B4F72] text-sm">{po.poNumber}</span>
                    {statusBadge(po.status)}
                  </div>
                  <p className="text-xs text-[#9CA3AF] mb-2">{po.from} - {po.to}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1A1D23]">{formatLakhs(po.budget)}</span>
                    <span className="text-xs text-[#9CA3AF]">{utilPct}% used</span>
                  </div>
                  <ProgressBar value={utilPct} className="mt-1.5 h-1.5" />
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT - Detail */}
        <div className="lg:col-span-2 border border-[#DDE3ED] rounded-xl lg:rounded-l-none bg-white overflow-hidden">
          {!selected ? (
            <div className="flex items-center justify-center h-full min-h-[400px] text-[#9CA3AF] flex-col gap-3">
              
              <p>Select a PO to view details</p>
            </div>
          ) : (
            <>
              <div className="p-5 bg-[#F8FAFC] border-b border-[#DDE3ED] flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-[#1B4F72] text-lg">{selected.poNumber}</h2>
                    {statusBadge(selected.status)}
                    {approvalBadge(selected.approvalStatus)}
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1">📋 {selected.from} to {selected.to}  Created by {selected.createdBy} on {selected.createdAt}</p>
                  {selected.remarks && <p className="text-xs text-[#6B7280]"> {selected.remarks}</p>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {canManage && <Button size="sm" variant="outline" onClick={openEdit}> Edit</Button>}
                  {canManage && selected.status !== 'Lapsed' && <Button size="sm" variant="danger" onClick={() => { if(confirm('Mark this PO as Lapsed?')) lapsePO(selected.id); }}>Mark Lapsed</Button>}
                  {canApprove && selected.approvalStatus === 'pending' && <Button size="sm" variant="success" onClick={() => approvePO(selected.id, u.name)}>Approve</Button>}
                </div>
              </div>

              {selected.approvalStatus === 'pending' && (
                <div className="m-4"><InfoBanner color="amber"> This PO is pending approval. Budget allocation is read-only until approved.</InfoBanner></div>
              )}

              <div className="p-5 space-y-6 overflow-y-auto max-h-[560px]">
                <div>
                  <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">Budget Summary {userRegion && ` - ${userRegion}`}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: userRegion ? 'My Region Budget' : 'Total PO Budget', value: formatCurrency(userRegion ? (selected.regionBudgets[userRegion] || 0) : selected.budget), color: 'text-[#1B4F72]' },
                      { label: userRegion ? 'Distributed Amount' : 'Assigned to Regions', value: formatCurrency(userRegion ? Object.values((selected.allocations[userRegion] || {}) as Record<string, Record<string, Record<string, number>>>).reduce((s, crops_obj) => s + Object.values(crops_obj).reduce((cs, acts) => cs + Object.values(acts).reduce((as, v) => as + (typeof v === 'number' ? v : 0), 0), 0), 0) : Object.values(selected.regionBudgets || {}).reduce((s, v) => s + (v as number), 0)), color: 'text-[#374151]' },
                      { label: 'Spent (Approved)', value: formatCurrency(calcLiveSpent({ po: selected.poNumber, ...(userRegion ? { region: userRegion } : {}) })), color: 'text-green-600' }
                    ].map(k => (
                      <div key={k.label} className="bg-[#F8FAFC] rounded-xl p-3 text-center border border-[#DDE3ED]">
                        <p className="text-[9px] text-[#6B7280] font-semibold uppercase mb-1">{k.label}</p>
                        <p className={`font-black text-base ${k.color}`}>{k.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">Region Budget Assignments</p>
                  <Table>
                    <thead>
                      <tr><Th>Region</Th><Th>Assigned</Th><Th>Distributed</Th><Th>Spent</Th><Th>Utilization</Th><Th>Actions</Th></tr>
                    </thead>
                    <tbody>
                      {Object.entries(selected.regionBudgets || {})
                        .filter(([region]) => !userRegion || region === userRegion)
                        .map(([region, budget]) => {
                        const distributed = Object.values((selected.allocations[region] || {}) as Record<string, Record<string, Record<string, number>>>).reduce((s: number, crops_obj) => s + Object.values(crops_obj).reduce((cs: number, acts) => cs + Object.values(acts).reduce((as: number, v: any) => as + (typeof v === 'number' ? v : 0), 0), 0), 0);
                        const spent = calcLiveSpent({ po: selected.poNumber, region });
                        const utilPct = pct(spent, budget as number);
                        return (
                          <tr key={region} className="hover:bg-[#F8FAFC]">
                            <Td className="font-bold text-[#1B4F72]"> {region}</Td>
                            <Td>{formatCurrency(budget as number)}</Td>
                            <Td>{distributed > 0 ? formatCurrency(distributed) : <span className="text-[#9CA3AF] text-xs">-</span>}</Td>
                            <Td className="font-bold text-green-600">{formatCurrency(spent)}</Td>
                            <Td>
                              <div className="flex items-center gap-2 min-w-[80px]">
                                <ProgressBar value={utilPct} className="flex-1" />
                                <span className="text-xs font-bold">{utilPct}%</span>
                              </div>
                            </Td>
                            <Td>
                              {canManage && selected.approvalStatus === 'approved' && (
                                <Button size="sm" variant="outline" onClick={() => openDistribute(region)}>Distribute</Button>
                              )}
                            </Td>
                          </tr>
                        );
                      })}
                      {Object.keys(selected.regionBudgets || {}).length === 0 && (
                        <tr><Td colSpan={6} className="text-center py-4 text-[#9CA3AF] text-xs">No region budgets assigned yet.</Td></tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                {/* {Object.entries(selected.allocations || {}).map(([region, prods]) => {
                  if (Object.keys(prods).length === 0) return null;
                  return (
                    <div key={region}>
                      <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2"> {region}  Product/Activity Allocation</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(prods).map(([prod, acts]) => {
                          const pTotal = Object.values(acts).reduce((s, v) => s + (v as number), 0);
                          const pSpent = calcLiveSpent({ po: selected.poNumber, region, product: prod });
                          if (pTotal === 0) return null;
                          return (
                            <div key={prod} className="border border-[#DDE3ED] rounded-xl p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-[#374151] text-sm">{prod}</span>
                                <span className="text-xs text-[#6B7280]">{formatCurrency(pTotal)}</span>
                              </div>
                              <ProgressBar value={pct(pSpent, pTotal)} className="mb-2" />
                              {Object.entries(acts).map(([act, val]) => (
                                <div key={act} className="flex justify-between text-xs py-1 border-b border-[#F0F4F8] last:border-0">
                                  <span className="text-[#6B7280]">{act}</span>
                                  <span className="font-semibold text-[#1B4F72]">{formatCurrency(val as number)}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })} */}

                {Object.entries(selected.allocations || {}).map(([region, prods]) => {
  if (Object.keys(prods).length === 0) return null;
  
  // Calculate actual totals properly for product/crop/activity structure
  const regionAllocations: Record<string, number> = {};
  Object.entries(prods as Record<string, Record<string, Record<string, number>>>).forEach(([prod, crops_obj]) => {
    Object.values(crops_obj).forEach(activities => {
      Object.values(activities).forEach(amount => {
        regionAllocations[prod] = (regionAllocations[prod] || 0) + (amount || 0);
      });
    });
  });
  
  return (
    <div key={region}>
      <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">
        {region} Product/Crop/Activity Allocation
      </p>
      <div className="space-y-4">
        {Object.entries(prods as Record<string, Record<string, Record<string, number>>>).map(([prod, crops_obj]) => {
          // Sum all crops and activities for this product
          const pTotal = Object.values(crops_obj).reduce((s: number, activities) => {
            return s + Object.values(activities).reduce((cs: number, v: any) => cs + (typeof v === 'number' ? v : 0), 0);
          }, 0);
          
          const pSpent = calcLiveSpent({ po: selected.poNumber, region, product: prod });
          if (pTotal === 0) return null;
          
          return (
            <div key={prod} className="border border-[#DDE3ED] rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-[#374151] text-sm">{prod}</span>
                <span className="text-xs text-[#6B7280]">{formatCurrency(pTotal)}</span>
              </div>
              <ProgressBar value={pct(pSpent, pTotal)} className="mb-3" />
              
              {/* Iterate through crops FIRST */}
              {Object.entries(crops_obj).map(([crop, activities]) => {
                const cropTotal = Object.values(activities).reduce((s: number, v: any) => s + (typeof v === 'number' ? v : 0), 0);
                if (cropTotal === 0) return null;
                
                return (
                  <div key={`${prod}-${crop}`} className="ml-2 mb-2 pb-2 border-b border-[#F0F4F8] last:border-0">
                    <p className="text-xs font-semibold text-[#6B7280] mb-1.5">{crop}</p>
                    {/* Then iterate through activities */}
                    {Object.entries(activities).map(([act, val]) => (
                      <div key={`${prod}-${crop}-${act}`} className="flex justify-between text-xs py-1 pl-3">
                        <span className="text-[#6B7280]">{act}</span>
                        <span className="font-semibold text-[#1B4F72]">{formatCurrency(val || 0)}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
})}
              </div>
            </>
          )}
        </div>
      </div>

      {/* PO Wizard Modal — extracted component */}
      <POWizardModal
        open={showWizard}
        onClose={() => setShowWizard(false)}
        editMode={editMode}
        wizardStep={wizardStep}
        setWizardStep={setWizardStep}
        form={form}
        setForm={setForm}
        regions={regions}
        onSave={handleSavePO}
        onAutoGen={autoGenPO}
      />

      {/* Distribution Modal — extracted component */}
      <PODistributionModal
        open={showDistModal}
        onClose={() => setShowDistModal(false)}
        distRegion={distRegion}
        regionBudget={selected?.regionBudgets[distRegion] || 0}
        products={products}
        crops={crops}
        activities={activities}
        distData={distData}
        setDistData={setDistData}
        onSave={saveDistribution}
      />

      {/* Product Master Modal — extracted component */}
      <MasterItemModal
        open={showProductModal}
        onClose={() => { setShowProductModal(false); setProductForm({ name: '', description: '' }); setEditingProduct(null); }}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        label="Product Name"
        placeholder="e.g. Rice, Wheat, Fertilizer"
        itemName={productForm.name}
        setItemName={n => setProductForm(f => ({ ...f, name: n }))}
        itemDescription={productForm.description}
        setItemDescription={d => setProductForm(f => ({ ...f, description: d }))}
        isEditing={!!editingProduct}
        onSave={saveProduct}
      />

      {/* Activity Master Modal — extracted component */}
      <MasterItemModal
        open={showActivityModal}
        onClose={() => { setShowActivityModal(false); setActivityForm({ name: '', description: '' }); setEditingActivity(null); }}
        title={editingActivity ? 'Edit Activity' : 'Add Activity'}
        label="Activity Name"
        placeholder="e.g. Village Meeting, Demo, Training"
        itemName={activityForm.name}
        setItemName={n => setActivityForm(f => ({ ...f, name: n }))}
        itemDescription={activityForm.description}
        setItemDescription={d => setActivityForm(f => ({ ...f, description: d }))}
        isEditing={!!editingActivity}
        onSave={saveActivity}
      />

      {/* Crop Master Modal — extracted component */}
      <MasterItemModal
        open={showCropModal}
        onClose={() => { setShowCropModal(false); setCropForm({ name: '', description: '' }); setEditingCrop(null); }}
        title={editingCrop ? 'Edit Crop' : 'Add Crop'}
        label="Crop Name"
        placeholder="e.g. Wheat, Rice, Cotton, Corn"
        itemName={cropForm.name}
        setItemName={n => setCropForm(f => ({ ...f, name: n }))}
        itemDescription={cropForm.description}
        setItemDescription={d => setCropForm(f => ({ ...f, description: d }))}
        isEditing={!!editingCrop}
        onSave={saveCrop}
      />
    </div>
  );
}

