# 📊 Budget Request Session Workflow Guide

**Last Updated**: March 27, 2026  
**Purpose**: Explain how Budget Request Sessions (created by AIM) flow through the approval hierarchy

---

## 🎯 Overview

The Budget Request system is **session-based**, allowing AIM to create multiple budget request cycles simultaneously, and AM/ZM/RM to organize submissions separately by session.

### Key Concept
- **Budget Request Session** (created by AIM): A container for organizing multiple budget requests
  - Example: "BR-2026-001 - Q1 2026 Regional Budget", "BR-2026-002 - Q2 2026 Regional Budget"
- **Budget Request** (created by AM): A specific budget request submitted by an Area Manager under a particular session
  - Linked to a session via `requestGroupId` and `requestNumber` fields

---

## 📋 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  AIM (All India Manager) - Session Creator                │
├─────────────────────────────────────────────────────────────┤
│  • Creates Budget Request Cycles via "+ Create Request Cycle"│
│  • Each cycle: BR-2026-001, BR-2026-002, BR-2026-003, etc. │
│  • Stored in: budgetRequestGroups[] array                  │
│  • Fields: id, requestNumber, description, targetDate      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Fetched for session selection
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  AM (Area Manager) - Request Submitter                     │
├─────────────────────────────────────────────────────────────┤
│  Step 1: Select a session (BR-2026-001, BR-2026-002, etc) │
│  Step 2: Fill MDO request form (MDO, Product, Activity)   │
│  Step 3: Submit → Budget request linked to selected session│
│  Result: New budgetRequest created with:                   │
│    - requestGroupId: (selected group ID)                   │
│    - requestNumber: (e.g., "BR-2026-001")                 │
│    - status: "submitted"                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  ZM (Zonal Manager) - First Level Approver                 │
├─────────────────────────────────────────────────────────────┤
│  • Sees: Requests with status "submitted"                 │
│  • Can: Filter by session number (BR-2026-001, etc.)      │
│  • Action: Approve → status becomes "zm-approved"         │
│  • Filter Options:                                         │
│    - Session Number (e.g., BR-2026-001)                  │
│    - Product, Activity, Region, Zone, Area               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  RM (Regional Manager) - Second Level Approver             │
├─────────────────────────────────────────────────────────────┤
│  • Sees: Requests with status "zm-approved"               │
│  • Can: Filter by session number (BR-2026-001, etc.)      │
│  • Action: Approve → status becomes "rm-approved"         │
│  • Filter Options:                                         │
│    - Session Number (e.g., BR-2026-001)                  │
│    - Product, Activity, Region, Zone, Area               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  AIM (All India Manager) - Final Approver                  │
├─────────────────────────────────────────────────────────────┤
│  • Sees: Requests with status "rm-approved"               │
│  • Can: Approve all requests in a region at once          │
│  • Can: Filter by session number                          │
│  • Action: Approve → status becomes "aim-approved"        │
│  • Use: For PO creation and budget allocation             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### 1. **Session Creation (AIM)**

```typescript
// In BudgetRequestTab.tsx
const handleCreateSession = () => {
  createBudgetRequestGroup(description, targetDate);
  // Returns: "BR-2026-001", "BR-2026-002", etc.
  // Stored in: budgetRequestGroups[] in AppContext
}
```

**Database Structure** (`budgetRequestGroups`):
```javascript
{
  id: "brg-1711536000000",              // Unique ID
  requestNumber: "BR-2026-001",         // Session number
  aimId: "aim-1",                       // AIM's user ID
  aimName: "All India Manager",         // AIM's name
  description: "Q1 2026 Budget",        // Optional description
  targetDate: "2026-03-31",             // Optional target date
  createdAt: "2026-03-27",              // Creation date
  status: "active" | "closed"           // Lifecycle status
}
```

### 2. **Budget Request Submission (AM)**

```typescript
// In BudgetRequestTab.tsx
const handleSubmitRequest = () => {
  // Step 1: Validate session selection
  if (!selectedRequestGroup) {
    alert('❌ ERROR: You MUST select a Budget Request Session first!');
    return;
  }

  // Step 2: Get request number from selected group
  const selectedGroup = budgetRequestGroups.find(g => g.id === selectedRequestGroup);
  const requestNumber = selectedGroup?.requestNumber;  // e.g., "BR-2026-001"

  // Step 3: Submit with both requestGroupId AND requestNumber
  addBudgetRequest({
    areaManagerId: u.id,
    areaManagerName: u.name,
    area: u.territory.area,
    zone: u.territory.zone,
    region: u.territory.region,
    mdoName: formData.mdoName,
    product: formData.product,
    activity: formData.activity,
    estimatedSales: formData.estimatedSales,
    budgetRequired: formData.budgetRequired,
    requestGroupId: selectedRequestGroup,     // Link to session
    requestNumber: requestNumber,              // Session number (e.g., BR-2026-001)
    remarks: formData.remarks
  });
};
```

**Database Structure** (`budgetRequests`):
```javascript
{
  id: "br-1711536000001",              // Unique request ID
  requestGroupId: "brg-1711536000000", // Link to session
  requestNumber: "BR-2026-001",        // Session number (for filtering)
  areaManagerId: "am-1",               // AM's user ID
  areaManagerName: "John Doe",         // AM's name
  mdoName: "MDO-001",                  // MDO/Customer name
  product: "Product A",                // Product category
  activity: "Activity 1",              // Activity type
  area: "South Region",                // Geographic area
  zone: "Zone 1",                      // Zone
  region: "Region South",              // Region
  estimatedSales: 50000,               // Estimated sales target
  budgetRequired: 10000,               // Budget amount needed
  status: "submitted",                 // Approval status
  createdAt: "2026-03-27",             // Submission date
  remarks: "High priority",            // Optional notes
  
  // Approval tracking fields
  zmId?: "zm-1",                       // Zonal Manager's ID
  zmName?: "ZM Name",                  // Zonal Manager's name
  zmApprovedAt?: "2026-03-28",        // ZM approval date
  
  rmId?: "rm-1",                       // Regional Manager's ID
  rmName?: "RM Name",                  // Regional Manager's name
  rmApprovedAt?: "2026-03-29",        // RM approval date
  
  aimId?: "aim-1",                     // AIM's ID
  aimName?: "AIM Name",                // AIM's name
  aimApprovedAt?: "2026-03-30"        // AIM approval date
}
```

### 3. **Data Persistence (localStorage)**

```typescript
// In AppContext.tsx
useEffect(() => {
  // Save to localStorage
  localStorage.setItem('ad_campaign_db', JSON.stringify({
    users,
    entries,
    pos,
    regions,
    products,
    activities,
    bills,
    serviceReceivers,
    vendorProfiles,
    budgetRequests,
    budgetRequestGroups    // ✅ NOW PERSISTED
  }));
}, [users, entries, pos, regions, products, activities, bills, 
    serviceReceivers, vendorProfiles, budgetRequests, budgetRequestGroups]);

// Load from localStorage on app startup
useEffect(() => {
  const data = JSON.parse(localStorage.getItem('ad_campaign_db'));
  if (data.budgetRequestGroups) setBudgetRequestGroups(data.budgetRequestGroups);
  if (data.budgetRequests) setBudgetRequests(data.budgetRequests);
}, []);
```

---

## 🔍 Session Number Filter

### For AM, ZM, RM

All three roles can filter budget requests by session number:

```typescript
// Filter Configuration
const [viewFilters, setViewFilters] = useState({
  requestCycle: '',          // Legacy filter
  sessionNumber: '',         // NEW: Session number filter (BR-2026-001, etc.)
  product: '',
  activity: '',
  region: '',
  zone: '',
  area: ''
});

// Filtering Logic
if (viewFilters.sessionNumber) {
  filtered = filtered.filter(br => 
    br.requestNumber && br.requestNumber.includes(viewFilters.sessionNumber)
  );
}
```

### UI Display

In the "🔍 Filter Budget Requests by Multiple Criteria" section:

```
┌─────────────────────────────────────────────────────────┐
│ Session Number | Product | Activity | Region | Zone ... │
│ ────────────────────────────────────────────────────────  │
│ [All Sessions ▼] [All ▼] [All ▼]    [All ▼] [All ▼]    │
│ - BR-2026-001                                             │
│ - BR-2026-002                                             │
│ - BR-2026-003                                             │
├─────────────────────────────────────────────────────────┤
│ Showing 12 requests • Filters Active: Session# Product   │
└─────────────────────────────────────────────────────────┘
```

---

## 📍 Workflow by Role

### **AIM Workflow**

1. ✅ **Create Session**: Click "+ Create Request Cycle"
   - Fill: Description (e.g., "Q1 2026 Budget"), Target Date
   - Result: Session created with number "BR-2026-001"
   - Can create multiple sessions simultaneously

2. ✅ **View Sessions**: All created sessions listed in purple card
   - Shows: Request Number | Description | Target Date | Status

3. ✅ **Approve Requests**: See requests approved by RM
   - Can filter by session number
   - Can approve all requests in a region at once
   - Final approval status: "aim-approved"

### **AM Workflow**

1. 📋 **Select Session** (MANDATORY):
   - Red card: "Step 1: Select Request Cycle to Submit Budget"
   - Must select from active sessions created by AIM
   - Example: Select "BR-2026-001 - Q1 2026 Budget"

2. 📝 **Submit Request**:
   - Click "+ Add MDO Request"
   - Fill form: MDO Name, Product, Activity, Budget Required, etc.
   - Submit → Request linked to selected session
   - Request number automatically set to session's requestNumber

3. 🔍 **View Own Requests**:
   - Filter by: Session Number, Product, Activity
   - See status progression: submitted → zm-approved → rm-approved → aim-approved

### **ZM Workflow**

1. 👁️ **View Requests**: See submitted requests from their zone
   - Filter by: Session Number, Product, Activity, Region, Zone
   - Can see requests across multiple sessions

2. ✅ **Approve/Reject**:
   - Approve → status becomes "zm-approved"
   - Can organize approvals by session using session number filter

3. 📊 **Analyze by Session**:
   - Filter by specific session to see total budget for that session
   - Helps manage workload per session appropriately

### **RM Workflow**

1. 👁️ **View Requests**: See ZM-approved requests from their region
   - Filter by: Session Number, Product, Activity, Region, Zone, Area
   - Can see requests across multiple sessions

2. ✅ **Approve/Reject**:
   - Approve → status becomes "rm-approved"
   - Can organize approvals by session using session number filter

3. 📊 **Analyze by Session**:
   - Filter by specific session to see regional budget for that session
   - Helps allocate resources per session

---

## ✨ Key Features

### 1. **Multiple Simultaneous Sessions**
- AIM can create BR-2026-001, BR-2026-002, BR-2026-003 at same time
- Each session independent with separate budget requests
- Simple way to manage Q1, Q2, Q3, Q4 budgets separately

### 2. **Mandatory Session Selection for AM**
- AM cannot submit requests without selecting a session
- Enforced via validation:
  ```javascript
  if (isAreaManager && !selectedRequestGroup) {
    alert('❌ ERROR: You MUST select a Budget Request Session first!');
    return;
  }
  ```

### 3. **Session-Based Filtering**
- All roles can filter by session number (BR-2026-001, etc.)
- Dropdown auto-populated with available sessions
- Easy to view all requests for a specific session

### 4. **Data Persistence**
- ✅ Sessions persisted to localStorage
- ✅ Requests persisted to localStorage
- ✅ All data survives page refresh

### 5. **Clear Session Linking**
- Each budget request stores:
  - `requestGroupId`: Technical link to session
  - `requestNumber`: Human-readable session number (e.g., "BR-2026-001")
- Both fields populated for easy filtering and cross-referencing

---

## 🧪 Testing Checklist

- [ ] **AIM creates multiple sessions**: BR-2026-001, BR-2026-002, BR-2026-003
- [ ] **AM cannot submit without selecting session**: Red error alert appears
- [ ] **AM selects session**: Red card turns green, can submit
- [ ] **submitted request has requestNumber**: Check browser console: `request.requestNumber === "BR-2026-001"`
- [ ] **ZM sees session filter dropdown**: "Session Number" appears as first filter option
- [ ] **ZM filters by session**: Dropdown shows "BR-2026-001", "BR-2026-002", etc.
- [ ] **RM can filter by session**: Same session number dropdown available
- [ ] **Filter shows relevant requests**: When filter applied, only requests from that session show
- [ ] **Data persists on refresh**: Create session → Refresh page → Session still there
- [ ] **Multiple requests per session**: Submit 3 requests under BR-2026-001 → All linked correctly
- [ ] **Requests visible to all approvers**: ZM → RM → AIM can see and approve same requests

---

## 🚀 Deployment Checklist

Before going to production:

- [ ] All roles tested
- [ ] Session filter working for AM, ZM, RM
- [ ] Data persistence verified (refresh page)
- [ ] Session numbers properly generated
- [ ] No console errors
- [ ] Requests properly linked to sessions
- [ ] Multiple sessions can coexist
- [ ] Sorting and filtering work together
- [ ] Toast notifications appear correctly

---

## 📝 Notes

- Session numbers format: `BR-{YEAR}-{COUNTER}` (e.g., BR-2026-001, BR-2026-002)
- Each budget request has both `requestGroupId` (technical) and `requestNumber` (for filtering)
- Sessions can be closed by AIM to prevent new submissions
- Each role sees only appropriate statuses (AM: submitted, ZM: submitted, RM: zm-approved, AIM: rm-approved)
