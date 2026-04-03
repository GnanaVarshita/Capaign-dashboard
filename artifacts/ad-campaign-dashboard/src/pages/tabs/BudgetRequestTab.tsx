import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Button, Table, Th, Td, Badge, Modal, Label, Input, Textarea, cn, Select } from '../../components/ui';
import { BudgetRequest } from '../../types';

export default function BudgetRequestTab() {
  const { currentUser, budgetRequests, budgetRequestGroups, createBudgetRequestGroup, addBudgetRequest, addBudgetRequestToGroup, approveBudgetRequest, users, products, activities, regions, entries } = useAppContext();
  const u = currentUser!;

  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [showCreateRequestGroup, setShowCreateRequestGroup] = useState(false);
  const [requestGroupForm, setRequestGroupForm] = useState({ description: '', targetDate: '', selectedRegions: [] as string[] });
  const [selectedRequestGroup, setSelectedRequestGroup] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [mdoList, setMdoList] = useState<any[]>([]); // For adding multiple MDOs
  const [formData, setFormData] = useState({
    mdoName: '',
    estimatedSales: 0,
    activityBudgets: {} as Record<string, number>,  // Budget by activity
    remarks: ''
  });

  // Filters for AIM (All India Manager)
  const [aimFilters, setAimFilters] = useState({
    filterType: 'all', // all, region, zone, area
    selectedValue: ''
  });

  // Advanced filters for viewing requests
  const [viewFilters, setViewFilters] = useState({
    requestCycle: '', // Filter by request cycle/group
    sessionNumber: '', // Filter by session number (Request Number)
    product: '',      // Filter by product
    activity: '',     // Filter by activity
    region: '',       // Filter by region (for viewing requests)
    zone: '',         // Filter by zone
    area: ''          // Filter by area
  });

  const isAreaManager = u.role === 'Area Manager';
  const isZonalManager = u.role === 'Zonal Manager';
  const isRegionalManager = u.role === 'Regional Manager';
  const isAIM = u.role === 'All India Manager';
  const isOwner = u.role === 'Owner';
  const isFinanceAdmin = u.role === 'Finance Administrator';
  const canManageAll = isOwner || isFinanceAdmin;

  // Filter budget requests based on role and apply view filters
  const visibleRequests = useMemo(() => {
    let filtered = budgetRequests;

    if (isAreaManager) {
      // Area Manager sees only their own requests
      filtered = filtered.filter(br => br.areaManagerId === u.id);
    } else if (isZonalManager) {
      // Zonal Manager sees ONLY their zone - must have same zone AND region
      filtered = filtered.filter(br => 
        br.zone === u.territory.zone && 
        br.region === u.territory.region &&
        br.status === 'submitted'
      );
    } else if (isRegionalManager) {
      // Regional Manager sees ALL requests in their region with 'zm-approved' status
      filtered = filtered.filter(br => 
        br.region === u.territory.region &&
        br.status === 'zm-approved'
      );
    } else if (isAIM || canManageAll) {
      // All India Manager, Owner, and Finance Admin see all 'rm-approved' requests
      filtered = filtered.filter(br => br.status === 'rm-approved');
      
      if (aimFilters.filterType === 'region' && aimFilters.selectedValue) {
        filtered = filtered.filter(br => br.region === aimFilters.selectedValue);
      } else if (aimFilters.filterType === 'zone' && aimFilters.selectedValue) {
        filtered = filtered.filter(br => br.zone === aimFilters.selectedValue);
      } else if (aimFilters.filterType === 'area' && aimFilters.selectedValue) {
        filtered = filtered.filter(br => br.area === aimFilters.selectedValue);
      } else if (aimFilters.filterType === 'product' && aimFilters.selectedValue) {
        filtered = filtered.filter(br => br.product === aimFilters.selectedValue);
      } else if (aimFilters.filterType === 'activity' && aimFilters.selectedValue) {
        filtered = filtered.filter(br => br.activity === aimFilters.selectedValue);
      }
    }

    // Apply view filters for all roles
    if (viewFilters.requestCycle) {
      filtered = filtered.filter(br => br.requestGroupId === viewFilters.requestCycle);
    }
    if (viewFilters.sessionNumber) {
      filtered = filtered.filter(br => br.requestNumber && br.requestNumber.includes(viewFilters.sessionNumber));
    }
    if (viewFilters.product) {
      filtered = filtered.filter(br => br.product === viewFilters.product);
    }
    if (viewFilters.activity) {
      filtered = filtered.filter(br => br.activity === viewFilters.activity);
    }
    if (viewFilters.region && !isAreaManager) {
      filtered = filtered.filter(br => br.region === viewFilters.region);
    }
    if (viewFilters.zone && (isZonalManager || isRegionalManager || isAIM || canManageAll)) {
      filtered = filtered.filter(br => br.zone === viewFilters.zone);
    }
    if (viewFilters.area && (isZonalManager || isRegionalManager)) {
      filtered = filtered.filter(br => br.area === viewFilters.area);
    }

    return filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [budgetRequests, u.id, u.territory, u.role, aimFilters, viewFilters]);

  // For AIM: Aggregate requests by region
  const aggregatedRequests = useMemo(() => {
    if (!isAIM) return [];

    const regionGroups: Record<string, { 
      region: string; 
      totalEstimatedSales: number; 
      totalBudgetRequired: number; 
      requestCount: number; 
      latestDate: string;
      rmName: string;
      rmApprovedAt: string;
      totalRequests: number;
      approvedRequests: number;
    }> = {};

    visibleRequests.forEach((request: BudgetRequest) => {
      if (!regionGroups[request.region]) {
        regionGroups[request.region] = {
          region: request.region,
          totalEstimatedSales: 0,
          totalBudgetRequired: 0,
          requestCount: 0,
          latestDate: request.rmApprovedAt || request.createdAt,
          rmName: request.rmName || '',
          rmApprovedAt: request.rmApprovedAt || '',
          totalRequests: 0,
          approvedRequests: 0
        };
      }
      
      regionGroups[request.region].totalEstimatedSales += request.estimatedSales;
      regionGroups[request.region].totalBudgetRequired += request.budgetRequired;
      regionGroups[request.region].totalRequests += 1;
      
      if (request.status === 'aim-approved') {
        regionGroups[request.region].approvedRequests += 1;
      }
      
      // Keep the latest approval date
      if (request.rmApprovedAt && request.rmApprovedAt > regionGroups[request.region].latestDate) {
        regionGroups[request.region].latestDate = request.rmApprovedAt;
        regionGroups[request.region].rmName = request.rmName || '';
        regionGroups[request.region].rmApprovedAt = request.rmApprovedAt;
      }
    });

    return Object.values(regionGroups).map(group => ({
      id: `region-${group.region}`,
      region: group.region,
      totalEstimatedSales: group.totalEstimatedSales,
      totalBudgetRequired: group.totalBudgetRequired,
      requestCount: group.totalRequests,
      latestDate: group.latestDate,
      rmName: group.rmName,
      rmApprovedAt: group.rmApprovedAt,
      status: group.approvedRequests === group.totalRequests ? 'aim-approved' : 'rm-approved' as const
    }));
  }, [visibleRequests, isAIM]);

  const handleSubmitRequest = () => {
    // This function is deprecated - submission now handled through mdoList in UI
  };


  const handleApprove = (request: BudgetRequest | any) => {
    if (isAIM && request.id.startsWith('region-')) {
      // Approve all requests in this region
      const regionRequests = budgetRequests.filter(br => 
        br.region === request.region && br.status === 'rm-approved'
      );
      regionRequests.forEach(regionRequest => {
        approveBudgetRequest(regionRequest.id, 'aim', u.name, u.id);
      });
    } else {
      if (isZonalManager) {
        approveBudgetRequest(request.id, 'zonal', u.name, u.id);
      } else if (isRegionalManager) {
        approveBudgetRequest(request.id, 'regional', u.name, u.id);
      } else if (isAIM || canManageAll) {
        approveBudgetRequest(request.id, 'aim', u.name, u.id);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'submitted': { color: 'bg-yellow-100 text-yellow-800', label: 'Submitted' },
      'zm-approved': { color: 'bg-blue-100 text-blue-800', label: 'ZM Approved' },
      'rm-approved': { color: 'bg-purple-100 text-purple-800', label: 'RM Approved' },
      'aim-approved': { color: 'bg-green-100 text-green-800', label: 'AIM Approved' }
    };
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getUniqueValues = (field: keyof BudgetRequest) => {
    return [...new Set(budgetRequests.map(br => br[field] as string))].filter(Boolean);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">📊 Budget Request Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAreaManager && 'Submit budget requests for your MDOs through the hierarchy. Select a request number or wait for AIM to create one.'}
            {isZonalManager && 'Approve budget requests from your zone.'}
            {isRegionalManager && 'Review and approve budget requests for your region.'}
            {(isAIM || canManageAll) && 'Manage budget request cycles and approve requests from all regions.'}
          </p>
        </div>
        {isAreaManager && (
          <Button onClick={() => setShowNewRequestForm(true)} className="bg-green-600 hover:bg-green-700">
            + Add MDO Request
          </Button>
        )}
        {(isAIM || canManageAll) && (
          <Button onClick={() => setShowCreateRequestGroup(true)} className="bg-blue-600 hover:bg-blue-700">
            + Create Request Cycle
          </Button>
        )}
      </div>

      {/* Create Request Group Modal (AIM Only) */}
      {(isAIM || canManageAll) && showCreateRequestGroup && (
        <Card className="p-6 mb-6 border-l-4 border-l-blue-600 bg-blue-50">
          <h3 className="text-lg font-bold mb-4">📋 Create New Budget Request Cycle</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label>Cycle Description</Label>
                <Input
                  placeholder="e.g., Q1 2026 Regional Budget Request"
                  value={requestGroupForm.description}
                  onChange={e => setRequestGroupForm({...requestGroupForm, description: e.target.value})}
                />
              </div>
              <div>
                <Label>Target Submission Date</Label>
                <Input
                  type="date"
                  value={requestGroupForm.targetDate}
                  onChange={e => setRequestGroupForm({...requestGroupForm, targetDate: e.target.value})}
                />
              </div>
            </div>

            {/* Region Selection */}
            <div className="border-t pt-4">
              <Label className="text-sm font-bold mb-3 block">📍 Select Regions for this Request Cycle</Label>
              <p className="text-xs text-slate-600 mb-3">Choose which regions this budget request cycle applies to. Leave empty for all regions.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {regions && regions.map(region => (
                  <label key={region.name} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white transition">
                    <input
                      type="checkbox"
                      checked={requestGroupForm.selectedRegions?.includes(region.name) || false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRequestGroupForm({
                            ...requestGroupForm,
                            selectedRegions: [...(requestGroupForm.selectedRegions || []), region.name]
                          });
                        } else {
                          setRequestGroupForm({
                            ...requestGroupForm,
                            selectedRegions: (requestGroupForm.selectedRegions || []).filter(r => r !== region.name)
                          });
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-700">{region.name}</span>
                  </label>
                ))}
              </div>
              {requestGroupForm.selectedRegions && requestGroupForm.selectedRegions.length > 0 && (
                <p className="text-xs text-blue-600 mt-3">
                  ✓ Selected {requestGroupForm.selectedRegions.length} region(s): {requestGroupForm.selectedRegions.join(', ')}
                </p>
              )}
              {(!requestGroupForm.selectedRegions || requestGroupForm.selectedRegions.length === 0) && (
                <p className="text-xs text-slate-500 mt-3">ℹ️ No specific regions selected - this cycle will apply to all regions</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => {
                const requestNumber = createBudgetRequestGroup(
                  requestGroupForm.description, 
                  requestGroupForm.targetDate,
                  requestGroupForm.selectedRegions && requestGroupForm.selectedRegions.length > 0 ? requestGroupForm.selectedRegions : undefined
                );
                setRequestGroupForm({ description: '', targetDate: '', selectedRegions: [] });
                setShowCreateRequestGroup(false);
              }} className="bg-blue-600 hover:bg-blue-700">
                ✓ Create Cycle
              </Button>
              <Button variant="outline" onClick={() => {
                setRequestGroupForm({ description: '', targetDate: '', selectedRegions: [] });
                setShowCreateRequestGroup(false);
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Active Request Groups for All Managers */}
      {(isAreaManager || isZonalManager || isRegionalManager)  && (
        <Card className="p-4 mb-6 border-l-4 border-l-green-600 bg-green-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-green-700 uppercase">Available Budget Request Cycles</h3>
            {isAreaManager && (
              <Button onClick={() => setShowNewRequestForm(true)} className="bg-green-600 hover:bg-green-700">
                + Add MDO Request
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {budgetRequestGroups
              .filter(g => g.status === 'active')
              .filter(g => {
                // For Area Managers: Filter groups by region
                if (isAreaManager) {
                  // If group has no region restrictions, show it
                  if (!g.selectedRegions || g.selectedRegions.length === 0) return true;
                  // If group has region restrictions, check if AM's region matches
                  return g.selectedRegions.includes(u.territory.region || '');
                }
                // For other managers, show all
                return true;
              })
              .map(group => (
              <button
                key={group.id}
                onClick={() => {
                  setSelectedRequestGroup(group.id);
                  if (isAreaManager) setShowNewRequestForm(true);
                }}
                className={cn(
                  "px-4 py-2 rounded-lg font-semibold text-sm transition-all border-2",
                  selectedRequestGroup === group.id && isAreaManager
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-green-700 border-green-300 hover:border-green-600"
                )}
                title={group.selectedRegions && group.selectedRegions.length > 0 ? `Regions: ${group.selectedRegions.join(', ')}` : 'All Regions'}
              >
                {group.requestNumber}
                {group.targetDate && <span className="ml-1 text-xs opacity-75">(Target: {group.targetDate})</span>}
                {group.description && <span className="ml-1 text-xs opacity-75">{group.description}</span>}
                {group.selectedRegions && group.selectedRegions.length > 0 && (
                  <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">{group.selectedRegions.length} region{group.selectedRegions.length !== 1 ? 's' : ''}</span>
                )}
              </button>
            ))}
          </div>
          {budgetRequestGroups
            .filter(g => g.status === 'active')
            .filter(g => {
              if (isAreaManager) {
                if (!g.selectedRegions || g.selectedRegions.length === 0) return true;
                return g.selectedRegions.includes(u.territory.region || '');
              }
              return true;
            }).length === 0 && (
            <p className="text-sm text-green-600 italic">
              {isAreaManager 
                ? 'No budget request cycles available for your region. Please contact AIM.' 
                : 'Waiting for AIM to create a budget request cycle...'}
            </p>
          )}
        </Card>
      )}

      {/* Request Cycle Selector - Show for all managers to select cycles for viewing/submitting */}
      {(isZonalManager || isRegionalManager || isAreaManager) && budgetRequestGroups.length > 0 && (
        <Card className="p-6 mb-6 border-l-4 border-l-cyan-600 bg-cyan-50">
          <h3 className="text-lg font-bold text-cyan-900 mb-4">📋 Available Budget Request Cycles</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-bold">Select a Request Cycle to View or Submit Budget Requests</Label>
              <Select value={viewFilters.requestCycle} onChange={e => setViewFilters({...viewFilters, requestCycle: e.target.value})}>
                <option value="">-- Select Request Cycle --</option>
                {budgetRequestGroups.filter(g => g.status === 'active').map(g => (
                  <option key={g.id} value={g.id}>
                    {g.requestNumber} - {g.description ? g.description : '(No description)'} {g.targetDate ? `(Target: ${g.targetDate})` : ''}
                  </option>
                ))}
              </Select>
            </div>
            {budgetRequestGroups.filter(g => g.status === 'active').length === 0 && (
              <p className="text-sm text-slate-600 italic">No active request cycles available. AIM will create them soon.</p>
            )}
          </div>
        </Card>
      )}

      {/* Session Filter for AIM & RM */}
      {(isAIM || isRegionalManager || canManageAll) && budgetRequestGroups.length > 0 && !isAreaManager && (
        <Card className="p-6 mb-6 border-l-4 border-l-purple-600 bg-purple-50">
          <h3 className="text-lg font-bold text-purple-900 mb-4">📋 Filter by Budget Request Session</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-bold">Select a Budget Request Session to View Requests</Label>
              <Select value={viewFilters.requestCycle} onChange={e => setViewFilters({...viewFilters, requestCycle: e.target.value})}>
                <option value="">-- All Sessions --</option>
                {budgetRequestGroups.filter(g => g.status === 'active').map(g => (
                  <option key={g.id} value={g.id}>
                    {g.requestNumber} - {g.description ? g.description : '(No description)'} {g.targetDate ? `(Target: ${g.targetDate})` : ''}
                  </option>
                ))}
              </Select>
            </div>
            {budgetRequestGroups.filter(g => g.status === 'active').length === 0 && (
              <p className="text-sm text-slate-600 italic">No active budget request sessions available.</p>
            )}
          </div>
        </Card>
      )}

      {/* Advanced Filters for Requests (when requests exist) */}
      {(isZonalManager || isRegionalManager || isAreaManager) && visibleRequests.length > 0 && (
        <Card className="p-6 mb-6 border-l-4 border-l-indigo-600 bg-indigo-50">
          <h3 className="text-lg font-bold text-indigo-900 mb-4">🔍 Filter Budget Requests by Multiple Criteria</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
            {/* Session Number Filter */}
            <div>
              <Label className="text-xs font-bold">Session Number</Label>
              <Select value={viewFilters.sessionNumber} onChange={e => setViewFilters({...viewFilters, sessionNumber: e.target.value})}>
                <option value="">All Sessions</option>
                {[...new Set(visibleRequests.map(r => r.requestNumber).filter(Boolean))].sort().map(sn => (
                  <option key={sn} value={sn}>{sn}</option>
                ))}
              </Select>
            </div>

            {/* Product Filter */}
            <div>
              <Label className="text-xs font-bold">Product</Label>
              <Select value={viewFilters.product} onChange={e => setViewFilters({...viewFilters, product: e.target.value})}>
                <option value="">All Products</option>
                {[...new Set(visibleRequests.map(r => r.product))].sort().map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </div>

            {/* Activity Filter */}
            <div>
              <Label className="text-xs font-bold">Activity</Label>
              <Select value={viewFilters.activity} onChange={e => setViewFilters({...viewFilters, activity: e.target.value})}>
                <option value="">All Activities</option>
                {[...new Set(visibleRequests.map(r => r.activity))].sort().map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </Select>
            </div>

            {/* Region Filter (for ZM, RM) */}
            {!isAreaManager && (
              <div>
                <Label className="text-xs font-bold">Region</Label>
                <Select value={viewFilters.region} onChange={e => setViewFilters({...viewFilters, region: e.target.value})}>
                  <option value="">All Regions</option>
                  {[...new Set(visibleRequests.map(r => r.region))].sort().map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Select>
              </div>
            )}

            {/* Zone Filter (for ZM, RM) */}
            {(isZonalManager || isRegionalManager) && (
              <div>
                <Label className="text-xs font-bold">Zone</Label>
                <Select value={viewFilters.zone} onChange={e => setViewFilters({...viewFilters, zone: e.target.value})}>
                  <option value="">All Zones</option>
                  {[...new Set(visibleRequests.map(r => r.zone))].sort().map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </Select>
              </div>
            )}

            {/* Area Filter (for ZM, RM) */}
            {(isZonalManager || isRegionalManager) && (
              <div>
                <Label className="text-xs font-bold">Area</Label>
                <Select value={viewFilters.area} onChange={e => setViewFilters({...viewFilters, area: e.target.value})}>
                  <option value="">All Areas</option>
                  {[...new Set(visibleRequests.map(r => r.area).filter(Boolean))].sort().map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </Select>
              </div>
            )}

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <Button 
                onClick={() => setViewFilters({ requestCycle: '', sessionNumber: '', product: '', activity: '', region: '', zone: '', area: '' })}
                variant="outline"
                className="w-full"
              >
                Clear All Filters
              </Button>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="mt-3 text-sm text-indigo-800">
            <span className="font-semibold">Showing {visibleRequests.length} request{visibleRequests.length !== 1 ? 's' : ''}</span>
            {Object.entries(viewFilters).some(([k, v]) => v && k !== 'zone' && k !== 'area') && (
              <span className="ml-2 font-semibold">
                • Filters Active: 
                {viewFilters.requestCycle && ' Cycle'}
                {viewFilters.sessionNumber && ' Session#'}
                {viewFilters.product && ' Product'}
                {viewFilters.activity && ' Activity'}
                {viewFilters.region && ' Region'}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Request Cycle Selector for AM - REQUIRED STEP */}
      {isAreaManager && budgetRequestGroups.length > 0 && (
        <Card className="p-6 mb-6 border-l-4 border-l-red-600 bg-red-50">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="text-lg font-bold text-red-900">Step 1: Select Request Cycle to Submit Budget</h3>
              <p className="text-sm text-red-700 mt-1">Choose which AIM-created request cycle you want to submit budget requests under. This organizes your submissions and helps in PO creation.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-bold">Available Request Cycles *</Label>
              <Select 
                value={selectedRequestGroup || ''} 
                onChange={e => {
                  setSelectedRequestGroup(e.target.value);
                  if (e.target.value) setShowNewRequestForm(true);
                }}
              >
                <option value="">-- SELECT A REQUEST CYCLE --</option>
                {budgetRequestGroups.filter(g => g.status === 'active').map(g => (
                  <option key={g.id} value={g.id}>
                    📌 {g.requestNumber} - {g.description || '(No description)'} {g.targetDate ? `| Target: ${g.targetDate}` : ''}
                  </option>
                ))}
              </Select>
            </div>
            
            {selectedRequestGroup && (
              <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <p className="font-bold text-green-800">
                  ✅ Selected: {budgetRequestGroups.find(g => g.id === selectedRequestGroup)?.requestNumber}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Now proceed to Step 2 to submit budget requests for activities under this cycle
                </p>
              </div>
            )}
            
            {!selectedRequestGroup && budgetRequestGroups.filter(g => g.status === 'active').length === 0 && (
              <p className="text-sm text-red-600 italic font-semibold">No active request cycles available. Please contact AIM to create one.</p>
            )}
          </div>
        </Card>
      )}

      {/* New Request Form (Area Manager) - STEP 2 */}
      {isAreaManager && showNewRequestForm && selectedRequestGroup && (
        <Card className="p-6 border-l-4 border-l-green-600 bg-green-50">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-green-200">
            <div>
              <h3 className="text-lg font-bold text-green-900">
                📝 Step 2: Submit Budget Requests for Activities
              </h3>
              <p className="text-sm text-green-700 mt-1">
                For Request Cycle: <span className="font-bold">{budgetRequestGroups.find(g => g.id === selectedRequestGroup)?.requestNumber}</span>
              </p>
            </div>
            <Badge variant="success" className="uppercase text-sm px-3 py-1">
              {budgetRequestGroups.find(g => g.id === selectedRequestGroup)?.requestNumber}
            </Badge>
          </div>
          
          <div className="space-y-4">
            {/* MDO Entry Form */}
            <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
              <h4 className="text-sm font-bold text-amber-800 mb-3 uppercase flex items-center gap-2">
                ✍️ Step 2B: Enter MDO Budget Request Details
              </h4>
              <p className="text-xs text-amber-700 mb-4">Select a product and add MDOs with estimated sales and budget allocations</p>
              
              {/* Product Selector */}
              <div className="mb-6 p-3 bg-white rounded border-2 border-amber-300">
                <Label className="font-bold text-sm text-amber-900">Select Product *</Label>
                <Select value={selectedProduct || ''} onChange={e => setSelectedProduct(e.target.value || null)}>
                  <option value="">-- Select Product to Add MDOs --</option>
                  {products && products.length > 0 ? (
                    products.map((p, idx) => (
                      <option key={`${p}-${idx}`} value={p}>{p}</option>
                    ))
                  ) : (
                    <option disabled>No products available</option>
                  )}
                </Select>
                {selectedProduct && (
                  <div className="mt-2 p-2 bg-amber-100 rounded text-sm text-amber-900">
                    📦 <span className="font-semibold">{selectedProduct}</span> - Now adding MDOs for this product
                  </div>
                )}
              </div>

              {/* MDO Entry Fields */}
              {selectedProduct && (
                <div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="font-bold text-xs">MDO Name *</Label>
                      <Input
                        placeholder="Enter MDO name"
                        value={formData.mdoName}
                        onChange={e => setFormData({...formData, mdoName: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="font-bold text-xs">Estimated Sales *</Label>
                      <Input
                        type="number"
                        placeholder="Enter estimated sales"
                        value={formData.estimatedSales}
                        onChange={e => setFormData({...formData, estimatedSales: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  {/* Activity Budget Fields */}
                  <div className="mb-4 p-3 bg-white rounded border-2 border-blue-200">
                    <Label className="font-bold text-sm text-blue-900 mb-3 block">🎯 Budget by Activity</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {activities && activities.map((activity, idx) => (
                        <div key={`${activity}-${idx}`}>
                          <Label className="text-xs font-semibold text-slate-700">{activity}</Label>
                          <Input
                            type="number"
                            placeholder="₹0"
                            value={formData.activityBudgets[activity] || 0}
                            onChange={e => setFormData({
                              ...formData,
                              activityBudgets: {
                                ...formData.activityBudgets,
                                [activity]: Number(e.target.value)
                              }
                            })}
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
                      onChange={e => setFormData({...formData, remarks: e.target.value})}
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
                      setMdoList([...mdoList, {
                        ...formData,
                        product: selectedProduct,
                        totalBudget
                      }]);
                      setFormData({ mdoName: '', estimatedSales: 0, activityBudgets: {}, remarks: '' });
                    }} 
                    className="bg-blue-600 hover:bg-blue-700 w-full mt-4"
                  >
                    + Add MDO to {selectedProduct}
                  </Button>
                </div>
              )}

              {!selectedProduct && (
                <div className="p-3 bg-amber-100 rounded border border-amber-300 text-sm text-amber-900">
                  <p className="font-semibold">👆 Select a product above to start adding MDOs</p>
                </div>
              )}
            </div>

            {/* Added MDO List - Table Format by Product */}
            {mdoList.length > 0 && (
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-900">📋 Budget Details: {mdoList.length} MDO{mdoList.length !== 1 ? 's' : ''}</h4>
                  <Button 
                    variant="outline"
                    onClick={() => setMdoList([])}
                    className="text-red-600 hover:text-red-700 text-xs"
                  >
                    Clear All
                  </Button>
                </div>

                {/* Group by Product */}
                <div className="space-y-6">
                  {Object.entries(
                    mdoList.reduce((groups: Record<string, any[]>, mdo) => {
                      if (!groups[mdo.product]) groups[mdo.product] = [];
                      groups[mdo.product].push(mdo);
                      return groups;
                    }, {})
                  ).map(([product, mdos]: [string, any[]]) => {
                    const productTotalEstimatedSales = mdos.reduce((sum, m) => sum + m.estimatedSales, 0);
                    const productTotalBudget = mdos.reduce((sum, m) => sum + (m.totalBudget || 0), 0);

                    return (
                      <div key={product} className="bg-white rounded border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-white">
                          <h5 className="font-bold text-sm">📦 {product}</h5>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b-2 border-slate-200 bg-blue-50">
                                <th className="px-3 py-2 text-left font-bold text-slate-700 min-w-[120px]">MDO Name</th>
                                <th className="px-3 py-2 text-right font-bold text-slate-700 min-w-[100px]">Est Sales</th>
                                {activities && activities.map((activity, idx) => (
                                  <th key={`${activity}-${idx}`} className="px-3 py-2 text-right font-bold text-slate-700 min-w-[100px]">{activity}</th>
                                ))}
                                <th className="px-3 py-2 text-right font-bold text-slate-700 min-w-[100px]">Total</th>
                                <th className="px-3 py-2 text-center font-bold text-slate-700 min-w-[60px]">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mdos.map((mdo: any, idx: number) => {
                                const totalBudget = (Object.values(mdo.activityBudgets || {}) as any[]).reduce((sum: number, v: any) => sum + Number(v ?? 0), 0);
                                return (
                                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-3 py-2 font-semibold text-slate-900">{mdo.mdoName}</td>
                                    <td className="px-3 py-2 text-right text-slate-700">₹{mdo.estimatedSales.toLocaleString()}</td>
                                    {activities && activities.map((activity, actIdx) => (
                                      <td key={`${activity}-${actIdx}`} className="px-3 py-2 text-right text-slate-700">
                                        ₹{(mdo.activityBudgets?.[activity] || 0).toLocaleString()}
                                      </td>
                                    ))}
                                    <td className="px-3 py-2 text-right font-semibold text-blue-600">₹{totalBudget.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-center">
                                      <Button 
                                        variant="ghost" 
                                        onClick={() => setMdoList(mdoList.filter((_, i) => i !== mdoList.indexOf(mdo)))}
                                        className="text-red-500 hover:text-red-700 text-lg"
                                      >
                                        🗑️
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                              {/* Product Totals Row */}
                              <tr className="bg-blue-100 font-bold border-t-2 border-blue-300">
                                <td className="px-3 py-3 text-slate-900">{product} Total</td>
                                <td className="px-3 py-3 text-right text-slate-900">₹{productTotalEstimatedSales.toLocaleString()}</td>
                                {activities && activities.map((activity, actIdx) => {
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
                    {activities && activities.map((activity, idx) => {
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
                      <p className="text-lg font-bold text-green-700">₹{(mdoList.reduce((sum, m) => sum + (Object.values(m.activityBudgets || {}).reduce((aSum: number, v: any) => aSum + (v || 0), 0)), 0)).toLocaleString()}</p>
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
            <div className="flex gap-2 flex-wrap">
              {mdoList.length > 0 && (
                <Button 
                  onClick={() => {
                    if (selectedRequestGroup) {
                      mdoList.forEach(mdo => {
                        const totalBudget = (Object.values(mdo.activityBudgets || {}) as any[]).reduce((sum: number, v: any) => sum + Number(v ?? 0), 0);
                        addBudgetRequestToGroup(selectedRequestGroup, {
                          areaManagerId: u.id,
                          areaManagerName: u.name,
                          area: u.territory.area || '',
                          zone: u.territory.zone || '',
                          region: u.territory.region || '',
                          mdoName: mdo.mdoName,
                          product: mdo.product,
                          activity: mdo.product,
                          estimatedSales: mdo.estimatedSales,
                          activityBudgets: mdo.activityBudgets || {},
                          budgetRequired: totalBudget,
                          remarks: mdo.remarks
                        });
                      });
                    } else {
                      mdoList.forEach(mdo => {
                        const totalBudget = (Object.values(mdo.activityBudgets || {}) as any[]).reduce((sum: number, v: any) => sum + Number(v ?? 0), 0);
                        addBudgetRequest({
                          areaManagerId: u.id,
                          areaManagerName: u.name,
                          area: u.territory.area || '',
                          zone: u.territory.zone || '',
                          region: u.territory.region || '',
                          mdoName: mdo.mdoName,
                          product: mdo.product,
                          activity: mdo.product,
                          estimatedSales: mdo.estimatedSales,
                          activityBudgets: mdo.activityBudgets || {},
                          budgetRequired: totalBudget,
                          remarks: mdo.remarks
                        });
                      });
                    }
                    const totalSubmittedBudget = mdoList.reduce((sum, m) => sum + (Object.values(m.activityBudgets || {}).reduce((aSum: number, v: any) => aSum + (v || 0), 0)), 0);
                    setMdoList([]);
                    setFormData({ mdoName: '', estimatedSales: 0, activityBudgets: {}, remarks: '' });
                    setShowNewRequestForm(false);
                    setSelectedRequestGroup(null);
                    setSelectedProduct(null);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  📤 Submit {mdoList.length} MDO{mdoList.length > 1 ? 's' : ''} (₹{(mdoList.reduce((sum, m) => sum + (Object.values(m.activityBudgets || {}).reduce((aSum: number, v: any) => aSum + (v || 0), 0)), 0)).toLocaleString()})
                </Button>
              )}
              <Button variant="outline" onClick={() => {
                setShowNewRequestForm(false);
                setMdoList([]);
                setSelectedRequestGroup(null);
                setSelectedProduct(null);
                setFormData({ mdoName: '', estimatedSales: 0, activityBudgets: {}, remarks: '' });
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filtered Requests Display for RM, ZM, AM */}
      {(isZonalManager || isRegionalManager || isAreaManager) && visibleRequests.length > 0 && (
        <Card className="p-6 mb-6 border-l-4 border-l-cyan-600">
          <h3 className="text-lg font-bold mb-4">
            📊 Budget Requests {viewFilters.requestCycle && '- ' + budgetRequestGroups.find(g => g.id === viewFilters.requestCycle)?.requestNumber}
          </h3>
          
          {visibleRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p className="text-sm font-semibold">No requests match the selected filters</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group by Request Cycle first */}
              {Object.entries(
                visibleRequests.reduce((cycles: Record<string, typeof visibleRequests>, req) => {
                  const cycleId = req.requestGroupId || 'standalone';
                  if (!cycles[cycleId]) cycles[cycleId] = [];
                  cycles[cycleId].push(req);
                  return cycles;
                }, {})
              ).map(([cycleId, cycleRequests]) => {
                const cycleName = cycleId === 'standalone' 
                  ? 'Standalone Requests' 
                  : budgetRequestGroups.find(g => g.id === cycleId)?.requestNumber || cycleId.slice(-8);
                
                return (
                  <div key={cycleId} className="border rounded-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 text-white">
                      <h4 className="font-bold">{cycleName}</h4>
                      <p className="text-sm opacity-90">{cycleRequests.length} request{cycleRequests.length !== 1 ? 's' : ''} • Total: ₹{cycleRequests.reduce((s, r) => s + r.budgetRequired, 0).toLocaleString()}</p>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      {/* Group by Product */}
                      {Object.entries(
                        cycleRequests.reduce((products: Record<string, typeof cycleRequests>, req) => {
                          if (!products[req.product]) products[req.product] = [];
                          products[req.product].push(req);
                          return products;
                        }, {})
                      ).map(([product, productReqs]) => {
                        const productTotal = productReqs.reduce((s, r) => s + r.budgetRequired, 0);
                        return (
                          <div key={product} className="bg-blue-50 rounded p-3 border border-blue-200">
                            <h5 className="font-bold text-blue-700 mb-2 flex items-center gap-2 text-sm">
                              📦 {product}
                              <span className="text-xs bg-blue-100 px-2 py-1 rounded">₹{productTotal.toLocaleString()}</span>
                            </h5>
                            
                            <div className="space-y-2 ml-2">
                              {/* Group by Activity */}
                              {Object.entries(
                                productReqs.reduce((activities: Record<string, typeof productReqs>, req) => {
                                  if (!activities[req.activity]) activities[req.activity] = [];
                                  activities[req.activity].push(req);
                                  return activities;
                                }, {})
                              ).map(([activity, activityReqs]) => {
                                const activityTotal = activityReqs.reduce((s, r) => s + r.budgetRequired, 0);
                                return (
                                  <div key={activity} className="bg-yellow-50 rounded p-2 border-l-4 border-yellow-400">
                                    <div className="flex justify-between items-center font-semibold text-xs text-yellow-700 mb-1">
                                      <span>└─ {activity}</span>
                                      <span>₹{activityTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="space-y-1 ml-2">
                                      {activityReqs.map((req, idx) => (
                                        <div key={idx} className="flex justify-between items-start p-2 bg-white rounded text-xs border border-yellow-100">
                                          <div className="flex-1">
                                            <p className="font-semibold text-slate-900">{req.mdoName}</p>
                                            <p className="text-slate-600 text-xs">by {req.areaManagerName}</p>
                                            {req.remarks && <p className="text-slate-500 text-xs italic">{req.remarks}</p>}
                                          </div>
                                          <div className="text-right ml-2 flex-shrink-0">
                                            <p className="font-bold text-green-600">₹{req.budgetRequired.toLocaleString()}</p>
                                            <p className="text-xs text-slate-500">{getStatusBadge(req.status)}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Request Cycle Details View for RM, ZM, AM (Legacy - when specific cycle selected) */}
      {(isRegionalManager || isZonalManager || isAreaManager) && selectedRequestGroup && (
        <Card className="p-6 mb-6 border-l-4 border-l-blue-600">
          <h3 className="text-lg font-bold mb-4">
            📋 Budget Details for {budgetRequestGroups.find(g => g.id === selectedRequestGroup)?.requestNumber}
          </h3>
          <div className="space-y-4">
            {Object.entries(
              budgetRequests
                .filter(br => br.requestGroupId === selectedRequestGroup)
                .reduce((groups: Record<string, typeof budgetRequests>, req) => {
                  const key = isAreaManager ? 'all' : (isZonalManager ? req.zone : req.region);
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(req);
                  return groups;
                }, {})
            ).map(([region, reqs]) => {
              const regionTotal = reqs.reduce((sum, r) => sum + r.budgetRequired, 0);
              return (
                <div key={region} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-slate-800">{isAreaManager ? 'My Submissions' : region}</h4>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">{reqs.length} submissions</p>
                      <p className="font-bold text-lg text-green-600">₹{regionTotal.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {/* Group by Product */}
                    {Object.entries(
                      reqs.reduce((products: Record<string, typeof reqs>, req) => {
                        if (!products[req.product]) products[req.product] = [];
                        products[req.product].push(req);
                        return products;
                      }, {})
                    ).map(([product, productReqs]) => (
                      <div key={product} className="p-3 bg-white rounded border border-slate-100">
                        <h5 className="font-bold text-slate-800 text-sm mb-2">📌 {product}</h5>
                        <div className="space-y-2 ml-2">
                          {/* Group by Activity */}
                          {Object.entries(
                            productReqs.reduce((activities: Record<string, typeof productReqs>, req) => {
                              if (!activities[req.activity]) activities[req.activity] = [];
                              activities[req.activity].push(req);
                              return activities;
                            }, {})
                          ).map(([activity, activityReqs]) => {
                            const activityTotal = activityReqs.reduce((sum, r) => sum + r.budgetRequired, 0);
                            const totalEstimatedSales = activityReqs.reduce((sum, r) => sum + r.estimatedSales, 0);
                            return (
                              <div key={activity} className="bg-slate-50 rounded p-2 border border-slate-100">
                                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-2">
                                  <span>└─ {activity}</span>
                                  <span className="text-green-600">Total: ₹{activityTotal.toLocaleString()}</span>
                                </div>
                                <div className="ml-2 overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-slate-200 bg-slate-100">
                                        <th className="px-2 py-1 text-left">MDO Name</th>
                                        <th className="px-2 py-1 text-right">Est. Sales</th>
                                        {activities && activities.map((act, idx) => (
                                          <th key={`${act}-${idx}`} className="px-2 py-1 text-right">{act}</th>
                                        ))}
                                        <th className="px-2 py-1 text-right">Total</th>
                                        <th className="px-2 py-1 text-left">AM</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {activityReqs.map((req, idx) => {
                                        const reqTotal = (Object.values(req.activityBudgets || {}) as any[]).reduce((sum: number, v: any) => sum + Number(v ?? 0), 0);
                                        return (
                                          <tr key={idx} className="border-b border-slate-200 hover:bg-white">
                                            <td className="px-2 py-1 font-semibold text-slate-900">{req.mdoName}</td>
                                            <td className="px-2 py-1 text-right text-slate-700">₹{req.estimatedSales.toLocaleString()}</td>
                                            {activities && activities.map((act, actIdx) => (
                                              <td key={`${act}-${actIdx}`} className="px-2 py-1 text-right text-slate-700">
                                                ₹{(req.activityBudgets?.[act] || 0).toLocaleString()}
                                              </td>
                                            ))}
                                            <td className="px-2 py-1 text-right font-bold text-green-600">₹{reqTotal.toLocaleString()}</td>
                                            <td className="px-2 py-1 text-xs text-slate-600">{req.areaManagerName}</td>
                                          </tr>
                                        );
                                      })}
                                      {/* Row Totals */}
                                      <tr className="bg-slate-200 font-bold text-slate-800">
                                        <td className="px-2 py-1">Subtotal</td>
                                        <td className="px-2 py-1 text-right">₹{activityReqs.reduce((sum, r) => sum + r.estimatedSales, 0).toLocaleString()}</td>
                                        {activities && activities.map((act, idx) => {
                                          const activityTotal = activityReqs.reduce((sum, r) => sum + (r.activityBudgets?.[act] || 0), 0);
                                          return <td key={`total-${act}-${idx}`} className="px-2 py-1 text-right">₹{activityTotal.toLocaleString()}</td>;
                                        })}
                                        <td className="px-2 py-1 text-right text-green-700">₹{activityTotal.toLocaleString()}</td>
                                        <td></td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* AIM View: Request Cycles Table */}
      {(isAIM || canManageAll) && budgetRequestGroups.length > 0 && (
        <Card className="p-6 mb-6">
          <CardTitle>📋 Active Budget Request Cycles</CardTitle>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Request Number</Th>
                  <Th>Description</Th>
                  <Th>Created By</Th>
                  <Th>Target Date</Th>
                  <Th>Status</Th>
                  <Th>Submissions</Th>
                  <Th>Estimated Sales</Th>
                  <Th>Total Budget</Th>
                </tr>
              </thead>
              <tbody>
                {budgetRequestGroups.map((group) => {
                  const groupRequests = budgetRequests.filter(br => br.requestGroupId === group.id);
                  const totalBudget = groupRequests.reduce((sum, req) => sum + req.budgetRequired, 0);
                  const totalEstimatedSales = groupRequests.reduce((sum, req) => sum + req.estimatedSales, 0);
                  return (
                    <tr key={group.id}>
                      <Td className="font-bold text-[#1B4F72]">{group.requestNumber}</Td>
                      <Td>{group.description || '—'}</Td>
                      <Td>{group.aimName}</Td>
                      <Td>{group.targetDate || '—'}</Td>
                      <Td><Badge variant={group.status === 'active' ? 'success' : 'warning'}>{group.status}</Badge></Td>
                      <Td className="text-center font-semibold">{groupRequests.length}</Td>
                      <Td className="font-semibold text-blue-600">₹{totalEstimatedSales.toLocaleString()}</Td>
                      <Td className="font-semibold text-green-600">₹{totalBudget.toLocaleString()}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {/* AIM View: Budgets by Request Number - Product & Activity Organization */}
      {(isAIM || canManageAll) && budgetRequestGroups.length > 0 && !selectedRequestGroup && (
        <Card className="p-6 mb-6 border-l-4 border-l-purple-600 bg-purple-50">
          <h3 className="text-lg font-bold text-purple-900 mb-4">📊 Select Budget Request Session for Detailed Analysis</h3>
          <p className="text-sm text-purple-700 mb-4">Choose a session to view all MDO submissions with estimated sales and budget details, grouped by region and product.</p>
          <Select value={selectedRequestGroup || ''} onChange={e => setSelectedRequestGroup(e.target.value)}>
            <option value="">-- Select a Session for Analysis --</option>
            {budgetRequestGroups.map(g => {
              const sessionRequests = budgetRequests.filter(br => br.requestGroupId === g.id);
              return (
                <option key={g.id} value={g.id}>
                  {g.requestNumber}: {g.description} | {sessionRequests.length} submissions | ₹{sessionRequests.reduce((s, r) => s + r.budgetRequired, 0).toLocaleString()}
                </option>
              );
            })}
          </Select>
        </Card>
      )}

      {/* AIM View: Budgets by Request Number - Product & Activity Organization */}
      {(isAIM || canManageAll) && selectedRequestGroup && (
        <Card className="p-6 mb-6 border-l-4 border-l-purple-600">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">
                📊 Detailed Budget Analysis: {budgetRequestGroups.find(g => g.id === selectedRequestGroup)?.requestNumber}
              </h3>
              <p className="text-sm text-slate-600 mt-1">MDO Name | Estimated Sales | Budget Required</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedRequestGroup(null)}>← Select Different Session</Button>
          </div>
          <div className="space-y-6">
            {Object.entries(
              budgetRequests
                .filter(br => br.requestGroupId === selectedRequestGroup)
                .reduce((groups: Record<string, typeof budgetRequests>, req) => {
                  const region = req.region;
                  if (!groups[region]) groups[region] = [];
                  groups[region].push(req);
                  return groups;
                }, {})
            ).map(([region, reqs]) => {
              const regionTotal = reqs.reduce((sum, r) => sum + r.budgetRequired, 0);
              return (
                <div key={region} className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border-2 border-slate-300">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-800 text-lg">{region}</h4>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">{reqs.length} MDO submissions</p>
                      <p className="font-black text-xl text-green-600">₹{regionTotal.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* Products in Region */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {Object.entries(
                      reqs.reduce((products: Record<string, typeof reqs>, req) => {
                        if (!products[req.product]) products[req.product] = [];
                        products[req.product].push(req);
                        return products;
                      }, {})
                    ).map(([product, productReqs]) => {
                      const productTotal = productReqs.reduce((sum, r) => sum + r.budgetRequired, 0);
                      return (
                        <div key={product} className="p-3 bg-white rounded-lg border-2 border-blue-200">
                          <h5 className="font-bold text-blue-700 text-sm mb-3 uppercase flex items-center gap-2">
                            📦 {product}
                            <span className="text-xs bg-blue-100 px-2 py-1 rounded">₹{productTotal.toLocaleString()}</span>
                          </h5>
                          <div className="space-y-2">
                            {/* Activities in Product */}
                            {Object.entries(
                              productReqs.reduce((activities: Record<string, typeof productReqs>, req) => {
                                if (!activities[req.activity]) activities[req.activity] = [];
                                activities[req.activity].push(req);
                                return activities;
                              }, {})
                            ).map(([activity, activityReqs]) => {
                              const activityTotal = activityReqs.reduce((sum, r) => sum + r.budgetRequired, 0);
                              return (
                                <div key={activity} className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded p-2 border-l-4 border-orange-400">
                                  <div className="flex justify-between items-center font-semibold text-xs mb-1">
                                    <span className="text-orange-700">└─ {activity}</span>
                                    <span className="text-green-700">₹{activityTotal.toLocaleString()}</span>
                                  </div>
                                  <div className="space-y-1 ml-2">
                                    {activityReqs.map((req, idx) => (
                                      <div key={idx} className="flex justify-between items-start p-1.5 bg-white rounded text-xs border border-orange-100">
                                        <div className="flex-1">
                                          <p className="font-semibold text-slate-900">{req.mdoName}</p>
                                          <p className="text-slate-500 text-xs">{req.areaManagerName}</p>
                                          <div className="mt-1 flex gap-2 text-slate-600 text-xs">
                                            <span>📊 Est. Sales: ₹{req.estimatedSales?.toLocaleString() || '0'}</span>
                                            <span>💰 Budget: ₹{req.budgetRequired.toLocaleString()}</span>
                                          </div>
                                        </div>
                                        <span className="font-bold text-green-600 whitespace-nowrap ml-2">₹{req.budgetRequired.toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* AIM Filters */}
      {(isAIM || canManageAll) && (
        <Card className="p-4 border-l-4 border-l-blue-600">
          <div className="grid grid-cols-5 gap-4">
            <div>
              <Label>Filter By</Label>
              <Select value={aimFilters.filterType} onChange={e => setAimFilters({...aimFilters, filterType: e.target.value, selectedValue: ''})}>
                <option value="all">All Requests</option>
                <option value="region">Region Wise</option>
                <option value="zone">Zone Wise</option>
                <option value="area">Area Wise</option>
                <option value="product">Product Wise</option>
                <option value="activity">Activity Wise</option>
              </Select>
            </div>
            {aimFilters.filterType === 'region' && (
              <div>
                <Label>Select Region</Label>
                <Select value={aimFilters.selectedValue} onChange={e => setAimFilters({...aimFilters, selectedValue: e.target.value})}>
                  <option value="">All Regions</option>
                  {getUniqueValues('region').map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Select>
              </div>
            )}
            {aimFilters.filterType === 'zone' && (
              <div>
                <Label>Select Zone</Label>
                <Select value={aimFilters.selectedValue} onChange={e => setAimFilters({...aimFilters, selectedValue: e.target.value})}>
                  <option value="">All Zones</option>
                  {getUniqueValues('zone').map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </Select>
              </div>
            )}
            {aimFilters.filterType === 'area' && (
              <div>
                <Label>Select Area</Label>
                <Select value={aimFilters.selectedValue} onChange={e => setAimFilters({...aimFilters, selectedValue: e.target.value})}>
                  <option value="">All Areas</option>
                  {getUniqueValues('area').map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </Select>
              </div>
            )}
            {aimFilters.filterType === 'product' && (
              <div>
                <Label>Select Product</Label>
                <Select value={aimFilters.selectedValue} onChange={e => setAimFilters({...aimFilters, selectedValue: e.target.value})}>
                  <option value="">All Products</option>
                  {getUniqueValues('product').map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </Select>
              </div>
            )}
            {aimFilters.filterType === 'activity' && (
              <div>
                <Label>Select Activity</Label>
                <Select value={aimFilters.selectedValue} onChange={e => setAimFilters({...aimFilters, selectedValue: e.target.value})}>
                  <option value="">All Activities</option>
                  {getUniqueValues('activity').map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Requests Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-yellow-600">
          <div className="text-sm text-slate-600">Submitted</div>
          <div className="text-2xl font-bold">
            {isAIM ? 
              aggregatedRequests.filter(r => r.status === 'rm-approved').length : 
              visibleRequests.filter((r: BudgetRequest) => r.status === 'submitted').length
            }
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-600">
          <div className="text-sm text-slate-600">ZM Approved</div>
          <div className="text-2xl font-bold">
            {isAIM ? 
              0 : // AIM doesn't see individual ZM approvals in aggregated view
              visibleRequests.filter((r: BudgetRequest) => r.status === 'zm-approved').length
            }
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-purple-600">
          <div className="text-sm text-slate-600">RM Approved</div>
          <div className="text-2xl font-bold">
            {isAIM ? 
              aggregatedRequests.filter(r => r.status === 'rm-approved').length : 
              visibleRequests.filter((r: BudgetRequest) => r.status === 'rm-approved').length
            }
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-600">
          <div className="text-sm text-slate-600">AIM Approved</div>
          <div className="text-2xl font-bold">
            {isAIM ? 
              aggregatedRequests.filter(r => r.status === 'aim-approved').length : 
              visibleRequests.filter((r: BudgetRequest) => r.status === 'aim-approved').length
            }
          </div>
        </Card>
      </div>

      {/* Requests Table */}
      <Card className="p-6">
        <CardTitle>{isAIM ? 'Regional Budget Summary' : 'Budget Requests'}</CardTitle>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>SI No</Th>
                {isAIM ? (
                  <>
                    <Th>Region</Th>
                    <Th>RM Approved Date</Th>
                    <Th>Regional Manager</Th>
                    <Th>Total Requests</Th>
                    <Th>Total Estimated Sales</Th>
                    <Th>Total Budget Required</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </>
                ) : (
                  <>
                    <Th>Date</Th>
                    <Th>Area Manager</Th>
                    <Th>MDO Name</Th>
                    <Th>Product</Th>
                    <Th>Activity</Th>
                    <Th>Estimated Sales</Th>
                    <Th>Budget Required</Th>
                    <Th>Status</Th>
                    {(isZonalManager || isRegionalManager || isAIM || canManageAll) && <Th>Actions</Th>}
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {(isAIM ? aggregatedRequests : visibleRequests).length === 0 ? (
                <tr>
                  <Td colSpan={isAIM ? 9 : (isZonalManager || isRegionalManager || isAIM || canManageAll ? 10 : 9)} className="text-center py-8 text-slate-400">
                    No budget requests to display.
                  </Td>
                </tr>
              ) : (
                (isAIM ? aggregatedRequests : visibleRequests).map((request: any, index: number) => (
                  <tr key={request.id}>
                    <Td>{index + 1}</Td>
                    {isAIM ? (
                      <>
                        <Td className="font-semibold">{request.region}</Td>
                        <Td>{request.rmApprovedAt || request.latestDate}</Td>
                        <Td>{request.rmName}</Td>
                        <Td className="text-center font-semibold">{request.requestCount}</Td>
                        <Td className="font-semibold">₹{request.totalEstimatedSales.toLocaleString()}</Td>
                        <Td className="font-semibold text-green-600">₹{request.totalBudgetRequired.toLocaleString()}</Td>
                        <Td>{getStatusBadge(request.status)}</Td>
                        <Td>
                          <Button
                            onClick={() => handleApprove(request)}
                            disabled={request.status !== 'rm-approved'}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                          >
                            ✓ Final Approve
                          </Button>
                        </Td>
                      </>
                    ) : (
                      <>
                        <Td>{(request as BudgetRequest).createdAt}</Td>
                        <Td>{(request as BudgetRequest).areaManagerName}</Td>
                        <Td>{(request as BudgetRequest).mdoName}</Td>
                        <Td>{(request as BudgetRequest).product}</Td>
                        <Td>{(request as BudgetRequest).activity}</Td>
                        <Td>₹{(request as BudgetRequest).estimatedSales.toLocaleString()}</Td>
                        <Td className="font-semibold">₹{(request as BudgetRequest).budgetRequired.toLocaleString()}</Td>
                        <Td>{getStatusBadge((request as BudgetRequest).status)}</Td>
                        {(isZonalManager || isRegionalManager || isAIM || canManageAll) && (
                          <Td>
                            <Button
                              onClick={() => handleApprove(request)}
                              disabled={
                                (isZonalManager && (request as BudgetRequest).status !== 'submitted') ||
                                (isRegionalManager && (request as BudgetRequest).status !== 'zm-approved') ||
                                ((isAIM || canManageAll) && (request as BudgetRequest).status !== 'rm-approved')
                              }
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                            >
                              ✓ Approve
                            </Button>
                          </Td>
                        )}
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Request Details */}
      {visibleRequests.length > 0 && (
        <Card className="p-6">
          <CardTitle>Approval Hierarchy & Activity Evidence</CardTitle>
          <div className="space-y-4">
            {visibleRequests.map(request => {
              // Find related entries for this budget request to display photos
              const relatedEntries = entries?.filter(e => 
                e.po === request.id || 
                (e.date && request.createdAt && e.date.includes(request.createdAt?.split('T')[0]))
              ) || [];
              
              return (
                <div key={request.id} className="border rounded p-4 bg-gradient-to-br from-slate-50 to-slate-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-lg">{request.mdoName}</p>
                      <p className="text-sm text-slate-600">{request.areaManagerName} • {request.area}</p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-slate-600">Product:</span> {request.product}
                    </div>
                    <div>
                      <span className="text-slate-600">Estimated Sales:</span> ₹{request.estimatedSales.toLocaleString()}
                    </div>
                    <div>
                      <span className="text-slate-600">Budget Req:</span> ₹{request.budgetRequired.toLocaleString()}
                    </div>
                    <div>
                      <span className="text-slate-600">Submitted:</span> {request.createdAt}
                    </div>
                  </div>

                  {/* Approval Workflow Status */}
                  <div className="flex gap-4 text-xs mb-4 p-3 bg-white rounded border-2 border-slate-200">
                    <div className={cn("flex items-center gap-1 px-2 py-1 rounded", request.zmApprovedAt ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
                      <span>1️⃣ ZM: {request.zmName || 'Pending'}</span>
                      {request.zmApprovedAt && <span className="text-green-600 font-bold">✓ {request.zmApprovedAt}</span>}
                    </div>
                    <div className={cn("flex items-center gap-1 px-2 py-1 rounded", request.rmApprovedAt ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
                      <span>2️⃣ RM: {request.rmName || 'Pending'}</span>
                      {request.rmApprovedAt && <span className="text-green-600 font-bold">✓ {request.rmApprovedAt}</span>}
                    </div>
                    <div className={cn("flex items-center gap-1 px-2 py-1 rounded", request.status === 'aim-approved' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
                      <span>3️⃣ AIM: {request.aimName || 'Pending'}</span>
                      {request.aimApprovedAt && <span className="text-green-600 font-bold">✓ {request.aimApprovedAt}</span>}
                    </div>
                  </div>

                  {/* Activity Evidence Photos */}
                  {relatedEntries.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded border-2 border-blue-200">
                      <h5 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                        📸 Activity Evidence & Supporting Photos
                      </h5>
                      <div className="space-y-3">
                        {relatedEntries.map((entry, idx) => (
                          <div key={idx} className="bg-white p-3 rounded border border-blue-100">
                            <p className="text-xs font-semibold text-slate-600 mb-2">
                              Activity: {entry.activity} | Date: {entry.date}
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                              {/* Campaign Photo */}
                              {entry.campaignPhoto && (
                                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                                  <p className="text-xs font-bold text-blue-900 mb-2">📷 Campaign Photo</p>
                                  <img 
                                    src={entry.campaignPhoto} 
                                    alt="Campaign" 
                                    className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition"
                                    onClick={() => {
                                      const modal = document.createElement('div');
                                      modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                                      modal.innerHTML = `<img src="${entry.campaignPhoto}" class="max-w-4xl max-h-screen"/>`;
                                      modal.onclick = () => modal.remove();
                                      document.body.appendChild(modal);
                                    }}
                                  />
                                  <p className="text-xs text-green-600 mt-1">✓ Uploaded</p>
                                </div>
                              )}

                              {/* Expense Photo */}
                              {entry.expensePhoto && (
                                <div className="p-2 bg-amber-50 rounded border border-amber-200">
                                  <p className="text-xs font-bold text-amber-900 mb-2">💰 Expense Photo</p>
                                  <img 
                                    src={entry.expensePhoto} 
                                    alt="Expense" 
                                    className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition"
                                    onClick={() => {
                                      const modal = document.createElement('div');
                                      modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                                      modal.innerHTML = `<img src="${entry.expensePhoto}" class="max-w-4xl max-h-screen"/>`;
                                      modal.onclick = () => modal.remove();
                                      document.body.appendChild(modal);
                                    }}
                                  />
                                  <p className="text-xs text-green-600 mt-1">✓ Uploaded</p>
                                </div>
                              )}

                              {/* Other Photo */}
                              {entry.otherPhoto && (
                                <div className="p-2 bg-purple-50 rounded border border-purple-200">
                                  <p className="text-xs font-bold text-purple-900 mb-2">📹 Other Photo</p>
                                  <img 
                                    src={entry.otherPhoto} 
                                    alt="Other" 
                                    className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition"
                                    onClick={() => {
                                      const modal = document.createElement('div');
                                      modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                                      modal.innerHTML = `<img src="${entry.otherPhoto}" class="max-w-4xl max-h-screen"/>`;
                                      modal.onclick = () => modal.remove();
                                      document.body.appendChild(modal);
                                    }}
                                  />
                                  <p className="text-xs text-green-600 mt-1">✓ Uploaded</p>
                                </div>
                              )}

                              {!entry.campaignPhoto && !entry.expensePhoto && !entry.otherPhoto && (
                                <p className="text-xs text-slate-400 col-span-3">No photos uploaded for this entry</p>
                              )}
                            </div>
                            {entry.description && (
                              <p className="text-xs text-slate-600 mt-2 p-2 bg-slate-50 rounded">
                                <span className="font-semibold">Description:</span> {entry.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {request.remarks && (
                    <div className="mt-3 p-2 bg-amber-50 rounded text-sm border border-amber-200">
                      <span className="font-semibold">Remarks:</span> {request.remarks}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
