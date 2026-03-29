# 🧪 Hybrid Testing Setup: New Workflow Components (Session-Based & Simplified Billing)

**Status**: ✅ Ready for parallel testing  
**Setup Date**: March 27, 2026  
**Components**: 2 new test tabs + Original 2 existing tabs

---

## 📋 What You Have Now

### ✅ **Original Components** (Current Production)
- `BillingTab.tsx` - Original billing implementation
- `BudgetRequestTab.tsx` - Original cycle-based budget requests

### 🧪 **New Test Components** (Parallel Testing)
- `BillingTab_test.tsx` - New simplified preview→modify→submit workflow
- `BudgetRequestTab_test.tsx` - New session-based architecture with regional analysis

Both versions are **running in parallel** - accessible via separate tabs for side-by-side comparison.

---

## 🎮 How to Access Test Tabs

**Login role**: Owner (or any role with Billing/Budget Request access)

**Navigation:**
1. Go to Dashboard
2. Look for tabs marked with 🧪 emoji:
   - **"Billing 🧪 (Test)"** - New simplified billing
   - **"Budget Requests 🧪 (Test)"** - New session-based budget requests
3. Click to switch between old and new versions

**Tab Availability:**
| Tab | Owner | AM | ZM | RM | AIM | Vendor |
|-----|-------|----|----|----|----|--------|
| Billing (original) | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Billing 🧪 (test) | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Budget Requests (original) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Budget Requests 🧪 (test) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 🆕 What's New in Test Components

### **BillingTab_test.tsx** - Simplified Workflow
**Only: Preview → Edit → Submit (No History)**

**Workflow:**
```
1. Vendor raises bill (from Vendor Tab)
   ↓
2. Auto-navigates to "Billing 🧪 (Test)" tab
   ↓
3. Bill edit form shows (modify invoice #, service charges, GST, remarks)
   ↓
4. Click "👁️ Preview Invoice & Review"
   ↓
5. Full invoice displays with GST calculation
   ↓
6. Options:
   ✅ Submit Bill (finalize)
   ← Back to Edit (modify more)
   ✕ Cancel (discard)
```

**Key Differences from Original:**
- ❌ NO bills history section
- ❌ NO KPI cards showing bill statistics
- ❌ NO full bill list/archive view
- ✅ ONLY preview when bill is raised
- ✅ ONLY modify form visible
- ✅ ONLY submit button in preview
- ✅ Clean, single-purpose interface

**UI Components:**
- Edit form (blue 💙 styling)
- Preview modal (full invoice layout)
- Service Receivers tab (placeholder)
- My Profile tab (placeholder)

---

### **BudgetRequestTab_test.tsx** - Session-Based Architecture
**New: Budget Request Sessions (not cycles) + Regional Analysis**

#### **📊 AIM Capabilities**

**Create Budget Request Session:**
- Session Name (e.g., "Q4 2024 Budget Round")
- Time Window (Start → End Date/Deadline)
- Description
- Optional Total Budget
- ➕ Button: "Create New Session"

**Regional Budget Analysis:**
```
Each Session shows:
├── Session Name & ID
├── Regional Breakdown
│   └── Region A
│       ├── Vendor 1: Product/Activity - ₹X
│       ├── Vendor 2: Product/Activity - ₹Y
│       └── Total: ₹X+Y
│   └── Region B
│       ├── Vendor 3: ...
│       └── Total: ₹Z
```

**Purpose**: AIM analyzes all regional budgets before PO issuance.

---

#### **📝 AM Workflow (Exactly 2 Steps)**

**STEP 1: SELECT BUDGET REQUEST SESSION (MANDATORY)**
```
🔴 Red Warning Card (until selected)
   "⚠️ STEP 1: Select Budget Request Session (MANDATORY)"
   
   Dropdown: "Available Budget Request Sessions"
   - Shows all active sessions
   - Displays deadline
   
✅ After selection: Changes to GREEN confirmation
   "✅ Session Selected"
   Green card confirms you can proceed
```

**STEP 2: SUBMIT BUDGET REQUESTS FOR ACTIVITIES**
```
Only available AFTER Step 1 selection

3 FILTERS (exactly):
┌─────────────────────────────────────┐
│ Filter 1: PRODUCT (dropdown)         │
│ Filter 2: ACTIVITY (dropdown)        │
│ Filter 3: SESSION # (read-only)      │
└─────────────────────────────────────┘

3 ENTRY FIELDS (exactly):
┌─────────────────────────────────────┐
│ Entry 1: MDO NAME (text)             │
│ Entry 2: ESTIMATED SALES (number)    │
│ Entry 3: BUDGET REQUIRED (number)    │
└─────────────────────────────────────┘

➕ "Add MDO to List" button

📋 Your MDO Submissions (list view)
   - Shows all added MDOs
   - Remove button per item
   
📤 "Submit X MDOs" button (green)
   - Batch submits all MDOs at once
   - Resets form after success
```

**Important Changes from Original:**
- ❌ NO longer "Request Cycle" - now "Budget Request Session"
- ❌ NO complex multi-step form
- ✅ EXACTLY 3 filters (not variable)
- ✅ EXACTLY 3 entry fields (not variable)
- ✅ ONLY appear after session selection
- ✅ Real-time MDO list view
- ✅ Batch submit model

---

#### **🧪 Additional Test Features**

**For Owner/AIM Testing:**
- Test session creation without affecting production
- View regional consolidation logic
- Verify session-level analysis display

**For Owner/AM Testing:**
- Mandatory session selection flow
- Two-step submission process
- Confirm filter/entry field counts

---

## 🔄 Data & Context Sync

### **What's Shared Between Old & New:**
✅ `AppContext.tsx` - Single source of truth for all data
✅ Mock data - Both use same mock entries, users, bills
✅ ApprovalContext - State management shared
✅ User roles & permissions - Consistent across tabs

### **What's Different:**
| Aspect | Original Tab | Test Tab |
|--------|--------------|----------|
| Billing architecture | Full history + preview | Preview only |
| Budget terminology | "Request Cycle" | "Budget Request Session" |
| Storage | `bills`, `budgetRequests` | Same (AppContext) |
| UX Flow | Multiple options | Streamlined steps |

### **Adding/Editing Data:**
Any changes in test tab automatically sync to original tab (same data source).

---

## 🚀 Starting the Dev Server

```bash
cd "d:\Campaign Final\Capaign-dashboard"

# Terminal 1: Start Backend
pnpm -F @workspace/api-server run dev

# Terminal 2: Start Frontend
pnpm -F @workspace/ad-campaign-dashboard run dev

# Open browser
# http://localhost:5173
```

---

## 🧪 Testing Checklist

### **Billing Test (⏱️ ~15 minutes)**

- [ ] Login as Vendor
- [ ] Go to Vendor Tab → Raise a bill
- [ ] Auto-navigates to "Billing 🧪 (Test)"
- [ ] Bill edit form displays with all fields
- [ ] Modify invoice number / service charges / GST rate
- [ ] Click "👁️ Preview Invoice & Review"
- [ ] Invoice preview shows full layout with GST calculation
- [ ] Click "✅ SUBMIT BILL"
- [ ] Bill is saved
- [ ] No history section visible (simplified)
- [ ] Compare with original "Billing" tab

### **Budget Request Session Test (⏱️ ~20 minutes)**

#### **As AIM:**
- [ ] Go to "Budget Requests 🧪 (Test)"
- [ ] Click "➕ Create New Session"
- [ ] Fill in session details (name, dates, etc.)
- [ ] Click "✅ Create Session"
- [ ] Verify session created
- [ ] View Regional Budget Analysis section
- [ ] See sessions grouped by region

#### **As AM:**
- [ ] Go to "Budget Requests 🧪 (Test)"
- [ ] See red warning: "Step 1: Select Budget Request Session (MANDATORY)"
- [ ] Dropdown shows available sessions
- [ ] Select one session
- [ ] Card changes to GREEN (✅ Session Selected)
- [ ] Step 2 form appears below
- [ ] Confirm exactly 3 filters: Product, Activity, Session#
- [ ] Fill in Product dropdown
- [ ] Activity dropdown populates
- [ ] Confirm exactly 3 entry fields: MDO Name, Est. Sales, Budget Required
- [ ] Add 2-3 MDOs
- [ ] See list of added MDOs
- [ ] Click "📤 Submit X MDOs"
- [ ] Success message shows
- [ ] Form resets
- [ ] Compare workflow with original "Budget Requests" tab

---

## 🔧 File Locations

**All new components in:**
```
src/pages/tabs/
├── BillingTab_test.tsx          (new test version)
├── BillingTab.tsx               (original production)
├── BudgetRequestTab_test.tsx    (new test version)
└── BudgetRequestTab.tsx         (original production)
```

**Dashboard integration:**
```
src/pages/Dashboard.tsx
- Imports both old & new components
- Renders based on active tab
- Test tabs show 🧪 emoji
```

---

## 📊 Migration Plan (When Ready)

**To promote test versions to production:**

1. **Review & Approval**
   - Test thoroughly in parallel
   - Gather feedback

2. **Cutover**
   - Backup existing code
   - Replace BillingTab.tsx with BillingTab_test.tsx
   - Replace BudgetRequestTab.tsx with BudgetRequestTab_test.tsx
   - Remove test imports from Dashboard

3. **Validation**
   - Run type checks: `pnpm run typecheck`
   - Run tests: `pnpm run test` (if configured)
   - Manual QA testing

4. **Cleanup**
   - Remove old _test.tsx files
   - Update Dashboard imports
   - Commit to version control

---

## 🐛 Troubleshooting

### **Test tabs not showing?**
- ❌ Not logged in as Owner
- ✅ Try logging out → log back in as Owner
- ✅ Check browser DevTools console for errors

### **Bill not submitting from test tab?**
- Check AppContext `addBill()` is being called
- Verify `pendingBillData` is set correctly from Vendor Tab
- Check browser console for errors

### **Budget requests not appearing in list?**
- Ensure session is selected first (Step 1)
- Check Product/Activity filters are set
- Verify AppContext `addBudgetRequest()` has correct fields
- Check regional analysis groups budgets correctly

### **Type errors on reload?**
- Run: `pnpm run typecheck`
- If failures, check file imports
- Restart dev server: `Ctrl+C` then `pnpm run dev`

---

## 📝 Notes

- **No production data affected** - All changes isolated to test tabs
- **Same mock data** - Both tabs use identical data sources
- **Easy rollback** - If issues found, test tabs can be disabled anytime
- **Progressive enhancement** - Test features before full deployment

---

## ✅ Status Summary

| Component | Status | Location |
|-----------|--------|----------|
| Billing Test Tab | ✅ Ready | `BillingTab_test.tsx` |
| Budget Requests Test Tab | ✅ Ready | `BudgetRequestTab_test.tsx` |
| Dashboard Integration | ✅ Ready | `Dashboard.tsx` |
| Type Checking | ✅ Passing | No errors |
| Compilation | ✅ Passing | No errors |

**Ready to test!** 🚀

---

**Next Steps:**
1. Run `pnpm -F @workspace/ad-campaign-dashboard run dev`
2. Login as Owner
3. Navigate to new test tabs (look for 🧪 emoji)
4. Follow testing checklist
5. Provide feedback for iterations

Good luck with the hybrid testing! 🧪
