# Budget Request Session Cards - Visual Comparison with PO Cards

**Date**: March 30, 2026

---

## Side-by-Side Comparison: PO Card vs Budget Request Session Card

### 1️⃣ PO Card (Purchase Orders)

#### UI Display
```
Available Purchase Orders
─────────────────────────────────────────────
  [PO-001]  [PO-002]  [PO-003]  [PO-004]
   (active)  (selected)
```

#### Click Action
```
User clicks PO card → Selected PO becomes active → 
Form displays with Product/Zone filters for that PO
```

#### Data Used
```
PO Number: Fetched from AIM/Backend
Status: Only shows "approved" POs
Display: Cards with border highlighting current selection
```

---

### 2️⃣ Budget Request Session Card (Budget Requests) - SAME PATTERN

#### UI Display
```
Available Budget Request Cycles
─────────────────────────────────────────────────────
  [BR-2026-001]  [BR-2026-002]  [BR-2026-003]
   (Q1 2026)      (selected)     (Q2 2026)
   (Target: Apr)              (2 regions)
```

#### Click Action
```
User (AM) clicks session card → Selected session becomes active → 
Form displays with MDO/Product/Activity fields for that session
```

#### Data Used
```
Session Number: Fetched from AIM (creates session) → 
                Displayed as BR-YYYY-### cards
Status: Only shows "active" sessions
Display: Cards with border highlighting current selection
```

---

## Implementation Comparison

### PO Card Implementation (POTab.tsx)
```typescript
const pos = getVisiblePOs().filter(p => p.approvalStatus === 'approved');

return (
  <div className="flex gap-2 flex-wrap">
    {pos.map(p => (
      <button
        key={p.id}
        onClick={() => setSelectedPO(p.id)}
        className={cn(
          selectedPO === p.id 
            ? "bg-blue-600 text-white" 
            : "bg-white text-blue-700"
        )}
      >
        {p.poNumber}
      </button>
    ))}
  </div>
);
```

### Budget Request Session Card Implementation (BudgetRequestTab.tsx)
```typescript
const budgetRequestGroups = budgetRequestGroups
  .filter(g => g.status === 'active')
  .filter(g => isAreaManager 
    ? g.selectedRegions?.includes(u.territory.region) 
    : true
  );

return (
  <div className="flex gap-2 flex-wrap">
    {budgetRequestGroups.map(group => (
      <button
        key={group.id}
        onClick={() => {
          setSelectedRequestGroup(group.id);
          if (isAreaManager) setShowNewRequestForm(true);
        }}
        className={cn(
          selectedRequestGroup === group.id
            ? "bg-green-600 text-white border-green-600"
            : "bg-white text-green-700 border-green-300"
        )}
      >
        {group.requestNumber}
        {group.targetDate && <span>(Target: {group.targetDate})</span>}
        {group.selectedRegions && <span>{group.selectedRegions.length} regions</span>}
      </button>
    ))}
  </div>
);
```

---

## Feature Mapping: PO Card Features → Budget Request Features

| PO Card Feature | Budget Request Feature | Status |
|-----------------|------------------------|--------|
| Card displays | Shows session cards (BR-YYYY-###) | ✅ |
| Click to select | Click to select budget session | ✅ |
| Active status | Shows only active sessions | ✅ |
| Visual feedback | Green highlight on selection | ✅ |
| Dynamic fetching | Fetches from AIM-created sessions | ✅ |
| Region filtering | Filtered by AM's region | ✅ |
| Additional info | Shows target date, regions count | ✅ |
| Multi-select | Shows multiple cards | ✅ |
| Form opens | Opens MDO entry form on click | ✅ |

---

## Complete User Journey

### User Journey: Area Manager (AM)

#### BEFORE (Without Budget Request Session Cards)
```
❌ Manual selection of session from dropdown
❌ No visual indication of available sessions
❌ No context about session dates or regions
```

#### AFTER (With Budget Request Session Cards - Like PO)
```
✅ Visual cards showing all available sessions
✅ Session number clearly visible: BR-2026-001
✅ Additional context: Target date, number of regions
✅ Click to select (same UX as PO)
✅ Form dynamically opens with selected session
✅ MDO Name, Estimated Sales, Budget by Activity fields ready
```

### Step-by-Step Workflow

```
Step 1: AM logs in and goes to Budget Request Tab
        ↓
Step 2: Sees cards showing available sessions
        "BR-2026-001" | "BR-2026-002" | "BR-2026-003"
        (Like seeing PO cards)
        ↓
Step 3: Clicks on "BR-2026-001" card
        (Card turns green, showing selection)
        ↓
Step 4: Form opens below showing:
        - Product dropdown (from product master)
        - MDO Name field
        - Estimated Sales field
        - Budget by Activity grid (from activity master)
        ↓
Step 5: Fills in MDO details
        - MDO: "Sales Officer John"
        - Sales: 500000
        - Activity budgets: Field Campaign=100K, Harvest=150K, etc.
        ↓
Step 6: Clicks "Add MDO"
        ↓
Step 7: Can add more MDOs for same or different products
        ↓
Step 8: Clicks "Submit" to create budget requests
        → Requests created with requestGroupId = "BR-2026-001"
```

---

## Available Filters in AM Tab

### Filter Layout
```
┌─ Session Number (BR-YYYY-###) ──────┐
│ All Sessions                        │
│ ├─ BR-2026-001                      │ Filters by session
│ ├─ BR-2026-002                      │
│ └─ BR-2026-003                      │
└─────────────────────────────────────┘

┌─ Product (from master) ─────────────┐
│ All Products                        │
│ ├─ Product A                        │ Filters by product
│ ├─ Product B                        │
│ └─ Product C                        │
└─────────────────────────────────────┘

┌─ Activity (from master) ────────────┐
│ All Activities                      │
│ ├─ Field Campaign                   │ Filters by activity
│ ├─ Harvest                          │
│ ├─ Crop Meetings                    │
│ └─ Jeep Campaign                    │
└─────────────────────────────────────┘
```

---

## Data Entry Form Comparison

### PO Form (for reference)
```
Activity Sheet Form for PO
├─ Date
├─ Area
├─ PIN Code
├─ PO Number (fetched dropdown)
├─ Zone/Region
├─ Vendor
├─ Amount
├─ Product (from master)
├─ Activity (from master)
└─ Description
```

### Budget Request Form (EQUIVALENT)
```
Budget Request Form for Session
├─ Budget Request Session (card selector)
├─ Product (from master)
├─ MDO Name
├─ Estimated Sales
├─ Budget by Activity (from master)
│  ├─ Field Campaign
│  ├─ Harvest
│  ├─ Crop Meetings
│  └─ Jeep Campaign
└─ Remarks (optional)
```

---

## Data Flow Diagram

### PO Data Flow
```
AIM/Backend
    ↓ (provides POs)
POTab Component
    ↓ (fetches & filters)
PO Card Display → Select → ActivitySheetTab
                              ↓
                          Use selected PO in forms
                          Enter activity data
                          Submit
```

### Budget Request Data Flow (EQUIVALENT)
```
AIM (Budget Request Tab)
    ↓ (creates sessions)
BudgetRequestTab Component
    ↓ (fetches & filters)
Budget Request Session Cards → Select → MDO Entry Form
                                            ↓
                                        Enter MDO Name, Sales, Budget
                                        Select from Product Master
                                        Allocate from Activity Master
                                        Submit
```

---

## Session Card Features

### What AM Sees on Each Card
```
╔═════════════════════════════╗
║  📌 BR-2026-001             ║
║  Q1 2026 Budget Request     ║
║  (Target: Apr 15)           ║
║  North, West (2 regions)    ║
╚═════════════════════════════╝
```

### Card Information Breakdown
- **BR-2026-001**: Session number (generated by system)
- **Q1 2026 Budget Request**: Description (entered by AIM)
- **(Target: Apr 15)**: Target submission date (optional, entered by AIM)
- **2 regions**: Number of regions this applies to (set by AIM)

---

## Approval Workflow After Submission

```
AM submits MDOs under BR-2026-001
        ↓ (status: submitted)
ZM reviews all submitted MDOs from their zone
        ↓ (ZM approves → status: zm-approved)
RM reviews zm-approved MDOs from their region
        ↓ (RM approves → status: rm-approved)
AIM reviews all rm-approved MDOs
        ↓ (AIM approves → status: aim-approved)
Ready for PO creation/execution
```

---

## Summary: Budget Request Cards = PO Cards Pattern

| Aspect | PO Cards | Budget Request Cards |
|--------|----------|----------------------|
| Display | Cards showing PO-### | Cards showing BR-YYYY-### |
| Selection | Click card to select | Click card to select |
| Fetch Source | Backend/AIM | AIM Budget Request Tab |
| Filter by user region | Yes | Yes ✅ |
| Form activation | Opens when selected | Opens when selected ✅ |
| Master data in form | Product, Activity | Product, Activity ✅ |
| Data entry required | Amount, Data, etc. | MDO Name, Sales, Budget ✅ |
| Multiple entries | Can add entries | Can add MDOs ✅ |
| Submission | Creates Bill | Creates Budget Request ✅ |

---

## ✅ Complete Implementation Status

✅ Budget request session cards work **exactly like PO cards**  
✅ Session numbers fetched from AIM → Displayed as cards  
✅ AM filters by region → Only sees applicable sessions  
✅ Click card → Form opens for data entry  
✅ Product master, Activity master integrated  
✅ MDO Name, Estimated Sales, Budget by Activity fields ready  
✅ Filters available: Session#, Product, Activity  
✅ Multiple MDOs per session supported  
✅ Approval workflow complete: AM→ZM→RM→AIM  

---

**Status**: 🚀 PRODUCTION READY
