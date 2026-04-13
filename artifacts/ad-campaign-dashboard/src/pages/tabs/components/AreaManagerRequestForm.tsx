import React from 'react';
import { Card, Button, Label, Input, Select, Textarea, Badge } from '../../../components/ui';
import { exportToExcel } from '../../../lib/utils';
import { BudgetRequestGroup } from '../../../types';

interface MdoEntry {
  mdoName: string;
  estimatedSales: number;
  activityBudgets: Record<string, number>;
  remarks: string;
  crop: string;
  product: string;
  totalBudget: number;
}

interface FormData {
  mdoName: string;
  estimatedSales: number;
  activityBudgets: Record<string, number>;
  remarks: string;
  crop: string;
}

interface AreaManagerRequestFormProps {
  selectedRequestGroup: string | null;
  setSelectedRequestGroup: (id: string | null) => void;
  budgetRequestGroups: BudgetRequestGroup[];
  showNewRequestForm: boolean;
  setShowNewRequestForm: (show: boolean) => void;
  selectedProduct: string | null;
  setSelectedProduct: (p: string | null) => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  mdoList: MdoEntry[];
  setMdoList: React.Dispatch<React.SetStateAction<MdoEntry[]>>;
  products: string[];
  activities: string[];
  crops: string[];
  onSubmit: () => void;
}

export function AreaManagerRequestForm({
  selectedRequestGroup, setSelectedRequestGroup, budgetRequestGroups,
  showNewRequestForm, setShowNewRequestForm,
  selectedProduct, setSelectedProduct,
  formData, setFormData,
  mdoList, setMdoList,
  products, activities, crops,
  onSubmit
}: AreaManagerRequestFormProps) {

  const handleExportExcel = () => {
    if (mdoList.length === 0) return;
    const rows = mdoList.map((mdo, idx) => {
      const row: Record<string, any> = {
        'SI No': idx + 1,
        'Product': mdo.product,
        'Crop': mdo.crop || '—',
        'MDO Name': mdo.mdoName,
        'Estimated Sales (₹)': mdo.estimatedSales,
      };
      activities.forEach(act => {
        row[`${act} (₹)`] = mdo.activityBudgets?.[act] || 0;
      });
      row['Total Budget (₹)'] = mdo.totalBudget;
      row['Remarks'] = mdo.remarks || '';
      return row;
    });
    exportToExcel(rows, `BudgetRequest_${budgetRequestGroups.find(g => g.id === selectedRequestGroup)?.requestNumber || 'Draft'}`);
  };

  return (
    <>
      {/* Step 1 - Select Request Cycle */}
      <Card className="p-6 mb-6 border-l-4 border-l-red-600 bg-red-50">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">📋</span>
          <div>
            <h3 className="text-lg font-bold text-red-900">Step 1: Select Request Cycle to Submit Budget</h3>
            <p className="text-sm text-red-700 mt-1">Choose which AIM-created request cycle you want to submit budget requests under.</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-bold">Available Request Cycles *</Label>
            <Select
              value={selectedRequestGroup || ''}
              onChange={e => {
                setSelectedRequestGroup(e.target.value || null);
                if (e.target.value) setShowNewRequestForm(true);
              }}
            >
              <option value="">-- SELECT A REQUEST CYCLE --</option>
              {budgetRequestGroups.filter(g => g.status === 'active').map(g => (
                <option key={g.id} value={g.id}>
                  {g.requestNumber} - {g.description || '(No description)'} {g.targetDate ? `| Target: ${g.targetDate}` : ''}
                </option>
              ))}
            </Select>
          </div>
          {selectedRequestGroup && (
            <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
              <p className="font-bold text-green-800">
                ✅ Selected: {budgetRequestGroups.find(g => g.id === selectedRequestGroup)?.requestNumber}
              </p>
              <p className="text-sm text-green-700 mt-1">Now proceed to Step 2 to submit budget requests</p>
            </div>
          )}
          {!selectedRequestGroup && budgetRequestGroups.filter(g => g.status === 'active').length === 0 && (
            <p className="text-sm text-red-600 italic font-semibold">No active request cycles available. Please contact AIM to create one.</p>
          )}
        </div>
      </Card>

      {/* Step 2 - Request Form */}
      {showNewRequestForm && selectedRequestGroup && (
        <Card className="p-6 border-l-4 border-l-green-600 bg-green-50">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-green-200">
            <div>
              <h3 className="text-lg font-bold text-green-900">📋 Step 2: Submit Budget Requests for Activities</h3>
              <p className="text-sm text-green-700 mt-1">
                For Request Cycle: <span className="font-bold">{budgetRequestGroups.find(g => g.id === selectedRequestGroup)?.requestNumber}</span>
              </p>
            </div>
            <Badge variant="success" className="uppercase text-sm px-3 py-1">
              {budgetRequestGroups.find(g => g.id === selectedRequestGroup)?.requestNumber}
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
              <h4 className="text-sm font-bold text-amber-800 mb-3 uppercase flex items-center gap-2">
                📝 Step 2B: Enter MDO Budget Request Details
              </h4>
              <p className="text-xs text-amber-700 mb-4">Select product and crop, then add MDOs with estimated sales and budget allocations</p>

              {/* Product Selector — always visible */}
              <div className="mb-4 p-3 bg-white rounded border-2 border-amber-300">
                <Label className="font-bold text-sm text-amber-900">Select Product *</Label>
                <Select value={selectedProduct || ''} onChange={e => setSelectedProduct(e.target.value || null)}>
                  <option value="">-- Select Product to Add MDOs --</option>
                  {products.map((p, idx) => (
                    <option key={`${p}-${idx}`} value={p}>{p}</option>
                  ))}
                </Select>
                {selectedProduct && (
                  <div className="mt-2 p-2 bg-amber-100 rounded text-sm text-amber-900">
                    📦 <span className="font-semibold">{selectedProduct}</span> — Adding MDOs for this product
                  </div>
                )}
              </div>

              {/* Crop Selector — shown after product is selected, as sub-filter */}
              {selectedProduct && (
                <div className="mb-6 p-3 bg-white rounded border-2 border-green-300">
                  <Label className="font-bold text-sm text-green-900">Select Crop (Optional) — Sub-filter of {selectedProduct}</Label>
                  <Select value={formData.crop || ''} onChange={e => setFormData(f => ({ ...f, crop: e.target.value }))}>
                    <option value="">-- No Specific Crop --</option>
                    {crops.map((c, idx) => (
                      <option key={`${c}-${idx}`} value={c}>{c}</option>
                    ))}
                  </Select>
                  {formData.crop && (
                    <div className="mt-2 p-2 bg-green-100 rounded text-sm text-green-900">
                      🌾 Crop: <span className="font-semibold">{formData.crop}</span> (under {selectedProduct})
                    </div>
                  )}
                  {!formData.crop && (
                    <p className="text-xs text-slate-500 mt-1">Leave empty if this request applies to all crops under {selectedProduct}</p>
                  )}
                </div>
              )}

              {/* MDO Entry Fields — shown when product is selected */}
              {selectedProduct && (
                <div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="font-bold text-xs">MDO Name *</Label>
                      <Input
                        placeholder="Enter MDO name"
                        value={formData.mdoName}
                        onChange={e => setFormData(f => ({ ...f, mdoName: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="font-bold text-xs">Estimated Sales *</Label>
                      <Input
                        type="number"
                        placeholder="Enter estimated sales"
                        value={formData.estimatedSales || ''}
                        onChange={e => setFormData(f => ({ ...f, estimatedSales: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-white rounded border-2 border-blue-200">
                    <Label className="font-bold text-sm text-blue-900 mb-3 block">🧾 Budget by Activity</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {activities.map((activity, idx) => (
                        <div key={`${activity}-${idx}`}>
                          <Label className="text-xs font-semibold text-slate-700">{activity}</Label>
                          <Input
                            type="number"
                            placeholder="₹0"
                            value={formData.activityBudgets[activity] || ''}
                            onChange={e => setFormData(f => ({
                              ...f,
                              activityBudgets: { ...f.activityBudgets, [activity]: Number(e.target.value) }
                            }))}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-900 font-semibold">
                      Total Budget: ₹{Object.values(formData.activityBudgets).reduce((sum, v) => sum + (v || 0), 0).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <Label>Remarks</Label>
                    <Textarea
                      placeholder="Enter any remarks"
                      value={formData.remarks}
                      onChange={e => setFormData(f => ({ ...f, remarks: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <Button
                    onClick={() => {
                      if (!formData.mdoName || !formData.estimatedSales) {
                        alert('Please fill MDO Name and Estimated Sales');
                        return;
                      }
                      const totalBudget = Object.values(formData.activityBudgets).reduce((sum, v) => sum + (v || 0), 0);
                      if (totalBudget === 0) {
                        alert('Please allocate budget to at least one activity');
                        return;
                      }
                      setMdoList(prev => [...prev, { ...formData, product: selectedProduct!, totalBudget }]);
                      setFormData({ mdoName: '', estimatedSales: 0, activityBudgets: {}, remarks: '', crop: '' });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 w-full mt-4"
                  >
                    + Add MDO to {selectedProduct}
                  </Button>
                </div>
              )}

              {!selectedProduct && (
                <div className="p-3 bg-amber-100 rounded border border-amber-300 text-sm text-amber-900">
                  <p className="font-semibold">Please select a product above to start adding MDOs</p>
                </div>
              )}
            </div>

            {/* MDO List Table */}
            {mdoList.length > 0 && (
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-900">📊 Budget Details: {mdoList.length} MDO{mdoList.length !== 1 ? 's' : ''}</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleExportExcel}
                      className="text-green-700 border-green-400 hover:bg-green-50 text-xs"
                    >
                      ⬇ Download Excel
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setMdoList([])}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {Object.entries(
                    mdoList.reduce((groups: Record<string, MdoEntry[]>, mdo) => {
                      if (!groups[mdo.product]) groups[mdo.product] = [];
                      groups[mdo.product].push(mdo);
                      return groups;
                    }, {})
                  ).map(([product, mdos]) => {
                    const productTotalEstimatedSales = mdos.reduce((sum, m) => sum + m.estimatedSales, 0);
                    const productTotalBudget = mdos.reduce((sum, m) => sum + (m.totalBudget || 0), 0);
                    return (
                      <div key={product} className="bg-white rounded border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-white">
                          <h5 className="font-bold text-sm">{product}</h5>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b-2 border-slate-200 bg-blue-50">
                                <th className="px-3 py-2 text-left font-bold text-slate-700 min-w-[120px]">MDO Name</th>
                                <th className="px-3 py-2 text-left font-bold text-slate-700 min-w-[80px]">Crop</th>
                                <th className="px-3 py-2 text-right font-bold text-slate-700 min-w-[100px]">Est Sales</th>
                                {activities.map((activity, idx) => (
                                  <th key={`${activity}-${idx}`} className="px-3 py-2 text-right font-bold text-slate-700 min-w-[100px]">{activity}</th>
                                ))}
                                <th className="px-3 py-2 text-right font-bold text-slate-700 min-w-[100px]">Total</th>
                                <th className="px-3 py-2 text-center font-bold text-slate-700 min-w-[80px]">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mdos.map((mdo, idx) => {
                                const totalBudget = Object.values(mdo.activityBudgets || {}).reduce((sum: number, v: any) => sum + Number(v ?? 0), 0);
                                return (
                                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-3 py-2 font-semibold text-slate-900">{mdo.mdoName}</td>
                                    <td className="px-3 py-2 text-slate-600 text-xs">{mdo.crop || '—'}</td>
                                    <td className="px-3 py-2 text-right text-slate-700">₹{mdo.estimatedSales.toLocaleString()}</td>
                                    {activities.map((activity, actIdx) => (
                                      <td key={`${activity}-${actIdx}`} className="px-3 py-2 text-right text-slate-700">
                                        ₹{(mdo.activityBudgets?.[activity] || 0).toLocaleString()}
                                      </td>
                                    ))}
                                    <td className="px-3 py-2 text-right font-semibold text-blue-600">₹{totalBudget.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-center">
                                      <div className="flex gap-1 justify-center">
                                        <Button
                                          variant="ghost"
                                          onClick={() => {
                                            setFormData({
                                              mdoName: mdo.mdoName,
                                              estimatedSales: mdo.estimatedSales,
                                              activityBudgets: mdo.activityBudgets || {},
                                              remarks: mdo.remarks || '',
                                              crop: mdo.crop || ''
                                            });
                                            setSelectedProduct(mdo.product);
                                            setMdoList(prev => prev.filter((_, i) => i !== prev.indexOf(mdo)));
                                          }}
                                          className="text-blue-500 hover:text-blue-700 text-sm font-semibold"
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          onClick={() => setMdoList(prev => prev.filter((_, i) => i !== prev.indexOf(mdo)))}
                                          className="text-red-500 hover:text-red-700 text-sm font-semibold"
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                              <tr className="bg-blue-100 font-bold border-t-2 border-blue-300">
                                <td className="px-3 py-3 text-slate-900">{product} Total</td>
                                <td></td>
                                <td className="px-3 py-3 text-right text-slate-900">₹{productTotalEstimatedSales.toLocaleString()}</td>
                                {activities.map((activity, actIdx) => {
                                  const activityTotal = mdos.reduce((sum, m) => sum + (m.activityBudgets?.[activity] || 0), 0);
                                  return (
                                    <td key={`total-${activity}-${actIdx}`} className="px-3 py-3 text-right text-slate-900">
                                      ₹{activityTotal.toLocaleString()}
                                    </td>
                                  );
                                })}
                                <td className="px-3 py-3 text-right text-blue-700">₹{productTotalBudget.toLocaleString()}</td>
                                <td></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Grand Summary */}
                <div className="mt-6 p-4 bg-green-50 rounded border border-green-300">
                  <h5 className="font-bold text-green-900 mb-3">📊 Grand Summary</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-green-700">Total Estimated Sales</p>
                      <p className="text-lg font-bold text-green-700">₹{mdoList.reduce((sum, m) => sum + m.estimatedSales, 0).toLocaleString()}</p>
                    </div>
                    {activities.map((activity, idx) => {
                      const actTotal = mdoList.reduce((sum, m) => sum + (m.activityBudgets?.[activity] || 0), 0);
                      return (
                        <div key={`summary-${activity}-${idx}`}>
                          <p className="text-xs text-green-700">Total {activity}</p>
                          <p className="text-lg font-bold text-green-700">₹{actTotal.toLocaleString()}</p>
                        </div>
                      );
                    })}
                    <div>
                      <p className="text-xs text-green-700">Total Budget Allocated</p>
                      <p className="text-lg font-bold text-green-700">
                        ₹{mdoList.reduce((sum, m) => sum + Object.values(m.activityBudgets || {}).reduce((a: number, v: any) => a + (v || 0), 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-green-700">MDO Count</p>
                      <p className="text-lg font-bold text-green-700">{mdoList.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap mt-4">
              {mdoList.length > 0 && (
                <>
                  <Button
                    onClick={handleExportExcel}
                    variant="outline"
                    className="text-green-700 border-green-400 hover:bg-green-50"
                  >
                    ⬇ Download Excel Before Submitting
                  </Button>
                  <Button
                    onClick={onSubmit}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Submit {mdoList.length} MDO Request{mdoList.length !== 1 ? 's' : ''} for Approval
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
