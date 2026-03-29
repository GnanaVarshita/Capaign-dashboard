import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardTitle, Button, Modal, Label, Input, Select, Badge, cn, Textarea } from '../../components/ui';
import { formatCurrency } from '../../lib/mock-data';
import { BudgetRequest, BudgetRequestGroup, BudgetRequestSession } from '../../types';

export default function BudgetRequestTab() {
  const { 
    currentUser, budgetRequests, entries, users, 
    updateBudgetRequest, addBudgetRequest, budgetRequestGroups, createBudgetRequestGroup
  } = useAppContext();
  const u = currentUser!;

  // State for creating new session (AIM only)
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [newSession, setNewSession] = useState({
    description: '',
    targetDate: ''
  });

  // State for AM workflow
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [mdoFormData, setMdoFormData] = useState({
    mdoName: '',
    estimatedSales: '',
    budgetRequired: ''
  });
  const [mdoList, setMdoList] = useState<any[]>([]);

  const isAIM = u.role === 'All India Manager';
  const isAM = u.role === 'Area Manager';
  const isZM = u.role === 'Zonal Manager';
  const isRM = u.role === 'Regional Manager';

  // Get active sessions (AIM creates these, time-bound)
  const activeSessions = useMemo(() => {
    return budgetRequestGroups.filter(rg => {
      // Filter to active sessions only
      return rg.status === 'active';
    });
  }, [budgetRequestGroups]);

  // Get products and activities for dropdowns
  const allProducts = useMemo(() => {
    return [...new Set(entries.map(e => e.product))].filter(Boolean);
  }, [entries]);

  const activitiesForProduct = useMemo(() => {
    if (!selectedProduct) return [];
    return [...new Set(entries.filter(e => e.product === selectedProduct).map(e => e.activity))].filter(Boolean);
  }, [entries, selectedProduct]);

  // Handle adding MDO to list
  const handleAddMDO = () => {
    if (!mdoFormData.mdoName.trim() || !mdoFormData.estimatedSales || !mdoFormData.budgetRequired) {
      alert('Please fill all fields: MDO Name, Estimated Sales, and Budget Required');
      return;
    }
    
    setMdoList([...mdoList, {
      id: Date.now().toString(),
      ...mdoFormData,
      sessionId: selectedSessionId,
      product: selectedProduct,
      activity: selectedActivity,
      submittedAt: new Date().toISOString().split('T')[0]
    }]);
    
    setMdoFormData({ mdoName: '', estimatedSales: '', budgetRequired: '' });
  };

  // Handle submitting all MDOs
  const handleSubmitMDOs = () => {
    if (mdoList.length === 0) {
      alert('Please add at least one MDO before submitting');
      return;
    }

    // Create BudgetRequest for each MDO
    mdoList.forEach(mdo => {
      addBudgetRequest({
        areaManagerId: u.id,
        areaManagerName: u.name,
        area: u.territory?.area || 'N/A',
        zone: u.territory?.zone || 'N/A',
        region: u.territory?.region || u.region,
        mdoName: mdo.mdoName,
        product: mdo.product,
        activity: mdo.activity,
        estimatedSales: Number(mdo.estimatedSales),
        budgetRequired: Number(mdo.budgetRequired),
        status: 'submitted',
        requestGroupId: selectedSessionId,
        createdAt: new Date().toISOString().split('T')[0]
      });
    });

    alert(`✅ ${mdoList.length} MDO(s) submitted successfully for Session #${selectedSessionId.slice(0, 8)}`);
    
    // Reset form
    setMdoList([]);
    setSelectedSessionId('');
    setSelectedProduct('');
    setSelectedActivity('');
    setMdoFormData({ mdoName: '', estimatedSales: '', budgetRequired: '' });
  };

  // Handle creating session (AIM only)
  const handleCreateSession = () => {
    if (!newSession.description.trim() || !newSession.targetDate) {
      alert('Please fill in Description and Target Date');
      return;
    }
    
    // Create the session using actual context method
    createBudgetRequestGroup({
      description: newSession.description,
      targetDate: newSession.targetDate
    });
    
    alert(`✅ Budget Request Session created successfully!\nTarget Date: ${newSession.targetDate}`);
    
    setShowCreateSessionModal(false);
    setNewSession({
      description: '',
      targetDate: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">💰 Budget Request Sessions</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAIM 
              ? 'Create budget request sessions and analyze regional budgets before PO issuance.' 
              : isAM
              ? 'Select a session and submit budget requests for your approved activities.'
              : isZM
              ? 'Review and approve budget requests from Activity Managers.'
              : isRM
              ? 'Review and approve regional budget consolidations before AIM analysis.'
              : 'View budget request status and approvals.'}
          </p>
        </div>
        {isAIM && (
          <Button onClick={() => setShowCreateSessionModal(true)} className="bg-green-600 hover:bg-green-700">
            ➕ Create New Session
          </Button>
        )}
      </div>

      {/* Create Session Modal (AIM only) */}
      {showCreateSessionModal && (
        <Modal isOpen={true} onClose={() => setShowCreateSessionModal(false)}>
          <div className="bg-white p-8 rounded-lg max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">🆕 Create Budget Request Session</h2>
            <p className="text-sm text-slate-600 mb-4">Define a time-bound session for collecting budget requests from across all regions. All regional budgets under this session will be analyzed together before PO issuance.</p>
            
            <div className="space-y-4">
              <div>
                <Label>Session Description/Purpose *</Label>
                <Textarea 
                  placeholder="e.g., Q4 2024 Budget Round for Regional Campaigns"
                  value={newSession.description}
                  onChange={e => setNewSession({...newSession, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label>Target Submission Date (Deadline) *</Label>
                <Input 
                  type="date"
                  value={newSession.targetDate}
                  onChange={e => setNewSession({...newSession, targetDate: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCreateSessionModal(false)}>Cancel</Button>
              <Button onClick={handleCreateSession} className="bg-green-600 hover:bg-green-700">✅ Create Session</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* AM Workflow: Session Selection (MANDATORY STEP 1) */}
      {isAM && (
        <Card className={cn("p-6 border-l-4", selectedSessionId ? "border-l-green-600 bg-green-50" : "border-l-red-600 bg-red-50")}>
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl">{selectedSessionId ? '✅' : '⚠️'}</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold">{selectedSessionId ? '✅ Session Selected' : '⚠️ Step 1: Select Budget Request Session (MANDATORY)'}</h3>
              <p className="text-sm text-slate-600 mt-1">
                {selectedSessionId 
                  ? `You have selected a session. You can now proceed to submit budget requests for your approved activities.`
                  : 'You must select an active budget request session before submitting budget requests. All your submissions will be grouped under this session and analyzed at the regional level.'}
              </p>
            </div>
          </div>
          
          <div>
            <Label>Available Budget Request Sessions</Label>
            <Select value={selectedSessionId} onChange={e => setSelectedSessionId(e.target.value)}>
              <option value="">-- Select a Session --</option>
              {activeSessions.map(session => (
                <option key={session.id} value={session.id}>
                  {session.requestNumber}: {session.description} (Deadline: {session.targetDate})
                </option>
              ))}
            </Select>
            {activeSessions.length === 0 && (
              <p className="text-sm text-slate-500 mt-2 italic">No active sessions available. AIM needs to create one.</p>
            )}
          </div>
        </Card>
      )}

      {/* AM Workflow: MDO Entry (STEP 2) */}
      {isAM && selectedSessionId && (
        <Card className="p-6 border-l-4 border-l-blue-600 bg-blue-50">
          <div className="flex items-start gap-3 mb-6">
            <span className="text-2xl">✍️</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold">📝 Step 2: Submit Budget Requests for Activities</h3>
              <p className="text-sm text-slate-600 mt-1">Session: <Badge className="bg-blue-600">{selectedSessionId.slice(0, 8)}</Badge></p>
              <p className="text-sm text-slate-600">Use the 3 filters below to select your activity, then enter the MDO details.</p>
            </div>
          </div>

          {/* EXACTLY 3 FILTERS */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-white rounded border border-slate-200">
            <div>
              <Label>Filter 1: Product *</Label>
              <Select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                <option value="">-- Select Product --</option>
                {allProducts.map(prod => (
                  <option key={prod} value={prod}>{prod}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Filter 2: Activity *</Label>
              <Select value={selectedActivity} onChange={e => setSelectedActivity(e.target.value)} disabled={!selectedProduct}>
                <option value="">-- Select Activity --</option>
                {activitiesForProduct.map(act => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Filter 3: Session #</Label>
              <Input value={selectedSessionId.slice(0, 8)} disabled className="bg-slate-100" />
            </div>
          </div>

          {/* EXACTLY 3 ENTRY FIELDS */}
          <div className="p-4 mb-4 bg-amber-50 border border-amber-200 rounded">
            <p className="text-sm font-semibold mb-3 text-amber-900">✍️ Step 2B: Enter Activity Budget Request Details</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Entry Field 1: MDO Name *</Label>
                <Input 
                  placeholder="e.g., SKU-2024-XYZ"
                  value={mdoFormData.mdoName}
                  onChange={e => setMdoFormData({...mdoFormData, mdoName: e.target.value})}
                />
              </div>
              <div>
                <Label>Entry Field 2: Estimated Sales *</Label>
                <Input 
                  type="number"
                  placeholder="e.g., 50000"
                  value={mdoFormData.estimatedSales}
                  onChange={e => setMdoFormData({...mdoFormData, estimatedSales: e.target.value})}
                />
              </div>
              <div>
                <Label>Entry Field 3: Budget Required *</Label>
                <Input 
                  type="number"
                  placeholder="e.g., 10000"
                  value={mdoFormData.budgetRequired}
                  onChange={e => setMdoFormData({...mdoFormData, budgetRequired: e.target.value})}
                />
              </div>
            </div>
            <Button onClick={handleAddMDO} className="mt-3 w-full bg-amber-600 hover:bg-amber-700">➕ Add MDO to List</Button>
          </div>

          {/* MDO List */}
          {mdoList.length > 0 && (
            <div className="mb-6">
              <p className="font-bold mb-3">📋 Your MDO Submissions: {mdoList.length} item(s)</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {mdoList.map((mdo, idx) => (
                  <div key={mdo.id} className="p-3 bg-white border border-slate-200 rounded flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold">{idx + 1}. {mdo.mdoName}</p>
                      <p className="text-sm text-slate-600">{mdo.product} → {mdo.activity}</p>
                      <p className="text-sm">Est. Sales: {formatCurrency(Number(mdo.estimatedSales))} | Budget: {formatCurrency(Number(mdo.budgetRequired))}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => setMdoList(mdoList.filter(m => m.id !== mdo.id))}
                    >
                      🗑️
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSubmitMDOs} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold">
              📤 Submit {mdoList.length} MDO{mdoList.length !== 1 ? 's' : ''}
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setSelectedSessionId('');
                setSelectedProduct('');
                setSelectedActivity('');
                setMdoFormData({ mdoName: '', estimatedSales: '', budgetRequired: '' });
                setMdoList([]);
              }}
            >
              ✕ Reset
            </Button>
          </div>
        </Card>
      )}

      {/* Regional Budget Analysis View (AIM only) */}
      {isAIM && (
        <Card className="p-6 border-l-4 border-l-purple-600 bg-purple-50">
          <h3 className="text-lg font-bold mb-4">📊 Regional Budget Analysis</h3>
          <p className="text-sm text-purple-800 mb-4">Analyze all regional budget requests under each session. Regional budgets are consolidated here before PO issuance.</p>
          
          <div className="space-y-4">
            {activeSessions.map(session => {
              const requestsForSession = budgetRequests.filter(br => br.requestGroupId === session.id || br.requestSessionId === session.id);
              const byRegion = {} as Record<string, any[]>;
              
              requestsForSession.forEach(br => {
                const region = br.region || 'Unknown';
                if (!byRegion[region]) byRegion[region] = [];
                byRegion[region].push(br);
              });

              return (
                <div key={session.id} className="p-4 bg-white border border-purple-200 rounded">
                  <h4 className="font-bold mb-3">{session.requestNumber} - {session.description}</h4>
                  <p className="text-xs text-slate-500 mb-3">Target Date: {session.targetDate}</p>
                  
                  {Object.keys(byRegion).length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No budget requests for this session yet.</p>
                  ) : Object.entries(byRegion).map(([region, reqs]) => (
                    <div key={region} className="ml-4 mb-3 p-3 bg-slate-50 rounded border-l-2 border-l-purple-400">
                      <p className="font-semibold text-purple-900">{region} Region</p>
                      <p className="text-sm text-slate-600">Requests: {reqs.length} | Total Budget: {formatCurrency(reqs.reduce((s, r) => s + r.budgetRequired, 0))}</p>
                      <div className="text-xs text-slate-500 mt-2">
                        {reqs.map(r => (
                          <p key={r.id}>{r.areaManagerName} - {r.product}/{r.activity}: {formatCurrency(r.budgetRequired)}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Fallback for no active content */}
      {!isAM && !isAIM && (
        <Card className="p-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
          <div className="text-6xl mb-4">💰</div>
          <p className="text-lg font-bold text-slate-600">Budget Requests Not Available</p>
          <p className="text-sm text-slate-500 mt-2">Your role does not have access to create or submit budget requests.</p>
        </Card>
      )}
    </div>
  );
}
