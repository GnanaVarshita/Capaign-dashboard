# 🎯 QUICK REFERENCE - Budget Request Like PO Card

## Your Exact Requirements ✅

| Need | Implementation | Where |
|------|-----------------|-------|
| **Fetch session from AIM** | Budget sessions displayed as **CARDS** like PO | Line 331-370 |
| **Session filters in AM** | Session# filter dropdown | Line 555-562 |
| **Product filters in AM** | Product dropdown from master | Line 573-580 |
| **MDO Name field** | Text input for MDO name | Line 666 |
| **Estimated Sales field** | Number input for sales | Line 673 |
| **Budget by Activity field** | Grid with activity inputs | Line 680 |
| **Activity from master** | All activities displayed | Field Campaign, Harvest, etc. |
| **Product from master** | All products in dropdown | Product A, B, C |

---

## 🎨 What Users See

### AIM View
```
+ Create Request Cycle
```
→ Creates session like: **BR-2026-001**

### AM View - Budget Request Session CARDS (Like PO)
```
Available Budget Request Cycles
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  BR-2026-001    │  │  BR-2026-002    │  │  BR-2026-003    │
│  Q1 2026        │  │  Q2 2026        │  │  Q3 2026        │
│  (Target: Apr)  │  │  (Target: Jul)  │  │ (2 regions)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Click Card → Data Entry Form Opens
```
Product:          [Dropdown: Product A ▼]  ← From product master
MDO Name:         [________________]       ← User enters
Estimated Sales:  [________________]       ← User enters

Budget by Activity:
┌──────────────────┬──────────┐
│ Field Campaign   │ 100000   │ ← From activity master
│ Harvest          │ 150000   │
│ Crop Meetings    │ 100000   │
│ Jeep Campaign    │  50000   │
└──────────────────┴──────────┘

[+ Add MDO] [Cancel]
```

---

## 📋 Available Filters (In AM Tab)

```
Session Number:  [All Sessions ▼]  ← Filter by BR-YYYY-###
Product:         [All Products ▼]   ← Filter by product
Activity:        [All Activities ▼] ← Filter by activity
```

---

## 🔄 Complete Flow

```
1. AIM creates sessions
   ↓ (Generates BR-2026-001, BR-2026-002, etc.)
   
2. AM sees session CARDS
   ↓ (Like PO cards interface)
   
3. AM clicks card to select
   ↓ (Card highlights in green)
   
4. Data entry form opens
   ↓ (With product and activity masters)
   
5. AM enters MDO details
   ↓ (Name, Sales, Budget by Activity)
   
6. AM submits
   ↓ (Status: submitted)
   
7. Approval hierarchy
   ↓ AM → ZM → RM → AIM
   
8. Budget request approved
   ↓ (Ready for PO/execution)
```

---

## 📊 Data Structures

### Budget Request Session (Card)
```typescript
{
  requestNumber: "BR-2026-001",      // Display on card
  description: "Q1 2026 Budget",     // Show on card
  targetDate: "2026-04-15",          // Show on card
  selectedRegions: ["North", "West"] // Show region count
}
```

### Budget Request (Submitted)
```typescript
{
  requestGroupId: "BR-2026-001",        // Links to session card
  mdoName: "Sales Officer John",       // User entered
  product: "Product A",                // From product master
  activity: "Field Campaign",          // From activity master
  estimatedSales: 500000,              // User entered
  activityBudgets: {
    "Field Campaign": 100000,          // User entered
    "Harvest": 150000,
    "Crop Meetings": 100000,
    "Jeep Campaign": 50000
  },
  budgetRequired: 400000,              // Auto-calculated
  status: "submitted"                  // Auto-set on submit
}
```

---

## ✨ Key Features

✅ **Session Cards**: Display budget request sessions like PO cards  
✅ **Click to Select**: Interactive card selection (visual feedback)  
✅ **Region Filtering**: AM only sees sessions for their region  
✅ **Product Master**: All products available in dropdown  
✅ **Activity Master**: All activities shown for budget allocation  
✅ **Multiple MDOs**: Can add unlimited MDOs per session  
✅ **Filters**: Session number, Product, Activity filters  
✅ **Auto Totals**: Budget automatically summed  
✅ **Approval Workflow**: Full hierarchy with status tracking  

---

## 🧪 Test It Right Now

### Start app (on Windows):
```powershell
# Terminal 1: Start backend
pnpm -F @workspace/api-server run dev

# Terminal 2: Start frontend
pnpm -F @workspace/ad-campaign-dashboard run dev

# Open browser
http://localhost:5174
```

### Test Credentials

| Role | Login | Password |
|------|-------|----------|
| AIM | arjun.aim | AIM@2026 |
| AM | ravi.lko | Area@123 |
| ZM | amit.up | Zone@123 |
| RM | rajesh.north | North@123 |

### Quick Test (10 minutes)
1. Login as AIM
2. Go to Budget Requests tab
3. Click "+ Create Request Cycle"
4. Create a session (e.g., "Q1 Budget")
5. Logout
6. Login as AM (ravi.lko)
7. Go to Budget Requests tab
8. **See budget request SESSION CARDS** (like PO cards)
9. Click a card
10. Fill in MDO details
11. Submit

---

## 📌 Files

- **Main Tab**: [BudgetRequestTab.tsx](artifacts/ad-campaign-dashboard/src/pages/tabs/BudgetRequestTab.tsx)
- **State**: [AppContext.tsx](artifacts/ad-campaign-dashboard/src/context/AppContext.tsx)
- **Types**: [types.ts](artifacts/ad-campaign-dashboard/src/types.ts)
- **Data**: [mock-data.ts](artifacts/ad-campaign-dashboard/src/lib/mock-data.ts)

---

## ✅ VERIFIED

```
✅ Works exactly like PO Card
✅ Session numbers fetched from AIM
✅ Filters: Session Number & Product
✅ Fields: MDO Name, Estimated Sales, Budget by Activity
✅ Masters: Activities & Products
✅ Production ready
```

---

**That's it! Everything you asked for is implemented and ready to use.** 🚀
