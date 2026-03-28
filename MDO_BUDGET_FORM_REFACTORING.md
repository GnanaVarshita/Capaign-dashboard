# 📋 Budget Request Form Refactoring Summary

**Date**: March 27, 2026  
**Scope**: AM (Area Manager) Budget Request Tab - Step 2B Restructuring

---

## 🎯 Changes Made

### 1. **Removed from Step 2B Form**
❌ **Product field** - Moved to a mandatory selector at the top of Step 2B  
❌ **Activity field** - Removed entirely (no longer needed at submission level)

### 2. **Added to Budget Request Type**
✅ **fieldBudget** (number) - Budget allocated for field activities  
✅ **harvestBudget** (number) - Budget allocated for harvest activities  
*(These replace the single `budgetRequired` which is now calculated as fieldBudget + harvestBudget)*

### 3. **Updated Step 2B Form Structure**

**OLD FORM:**
```
┌─────────────────────────────────────────────────────┐
│ ✍️ Step 2B: Enter Activity Budget Request Details   │
├─────────────────────────────────────────────────────┤
│ [MDO Name]      [Product ▼]    [Activity ▼]        │
│ [Est. Sales]                   [Budget Required]    │
│ [Remarks                                    ]       │
│                              [+ Add to List]        │
└─────────────────────────────────────────────────────┘
```

**NEW FORM:**
```
┌─────────────────────────────────────────────────────┐
│ ✍️ Step 2B: Enter MDO Budget Request Details        │
├─────────────────────────────────────────────────────┤
│ 📦 Select Product *                                 │
│ [-- Select Product to Add MDOs ▼]                   │
│ [📦 Product A - Now adding MDOs for this product]   │
│                                                     │
│ [MDO Name]       [Est. Sales]  [Field Budget]       │
│ [Harvest Budget]                                    │
│ [Remarks                                    ]       │
│                              [+ Add MDO to Product] │
└─────────────────────────────────────────────────────┘
```

---

## 🗂️ Data Structure Changes

### BudgetRequest Type (types.ts)
```javascript
// NEW FIELDS ADDED
fieldBudget: number;       // Budget for field activities
harvestBudget: number;     // Budget for harvest activities
budgetRequired: number;    // CALCULATED = fieldBudget + harvestBudget
```

### Form Data State (BudgetRequestTab.tsx)
```javascript
// OLD
formData = {
  mdoName: '',
  product: '',
  activity: '',
  estimatedSales: 0,
  budgetRequired: 0,
  remarks: ''
}

// NEW
formData = {
  mdoName: '',
  estimatedSales: 0,
  fieldBudget: 0,
  harvestBudget: 0,
  remarks: ''
}
```

---

## 📊 Display Format: Column-Based Table by Product

### How Submissions are Displayed

**BEFORE (Nested List):**
```
📌 Product A
  └─ Activity 1
    • MDO-001 ₹10,000
    • MDO-002 ₹15,000
```

**AFTER (Product-Level Table):**
```
📦 Product A
┌─────────────┬───────────┬──────────┬────────────┬────────┐
│ MDO Name    │ Est Sale  │ Field    │ Harvest    │ Total  │
├─────────────┼───────────┼──────────┼────────────┼────────┤
│ MDO-001     │ ₹50,000   │ ₹7,000   │ ₹3,000     │ ₹10,000│
│ MDO-002     │ ₹75,000   │ ₹10,000  │ ₹5,000     │ ₹15,000│
├─────────────┼───────────┼──────────┼────────────┼────────┤
│ Product A Total  │ ₹125,000 │ ₹17,000 │ ₹8,000   │ ₹25,000│
└─────────────┴───────────┴──────────┴────────────┴────────┘

📦 Product B
┌─────────────┬───────────┬──────────┬────────────┬────────┐
│ MDO Name    │ Est Sale  │ Field    │ Harvest    │ Total  │
├─────────────┼───────────┼──────────┼────────────┼────────┤
│ MDO-003     │ ₹60,000   │ ₹8,000   │ ₹4,000     │ ₹12,000│
├─────────────┼───────────┼──────────┼────────────┼────────┤
│ Product B Total  │ ₹60,000  │ ₹8,000  │ ₹4,000    │ ₹12,000│
└─────────────┴───────────┴──────────┴────────────┴────────┘

Grand Summary:
  Total Estimated Sales: ₹185,000
  Total Field Budget:    ₹25,000
  Total Harvest Budget:  ₹12,000
  Total Budget Allocated: ₹37,000
```

---

## 📝 Workflow Changes for AM

### BEFORE
1. Click "+ Add MDO Request"
2. Enter: MDO Name, Product (dropdown), Activity (dropdown), Est. Sales, Budget Required
3. Click "+ Add to List"
4. See nested list: Product > Activity > MDO
5. Submit all

### AFTER
1. Click "+ Add MDO Request"
2. **Step 1: Select Product** (mandatory)
   - Choose Product A, B, C, etc. from dropdown
   - Visual confirmation: "📦 Product A - Now adding MDOs for this product"
3. **Step 2: Enter MDO Details** (for selected product)
   - MDO Name (text input)
   - Estimated Sales (number) - **Sales target for this MDO**
   - Field Budget (number) - **Budget for field activities**
   - Harvest Budget (number) - **Budget for harvest activities**
   - Remarks (optional)
4. Click "+ Add MDO to Product A"
5. **Immediately see table view**:
   - Product A heading
   - Table with columns: MDO Name | Est Sales | Field Budget | Harvest Budget | Subtotal
   - Product A Totals row (auto-calculated)
6. Repeat for other products (select Product B, add MDOs)
7. See Grand Summary with all totals
8. Click "📤 Submit X MDOs"

---

## 🔄 Submission Logic

### What Gets Saved
```javascript
{
  mdoName: "MDO-001",
  product: "Product A",              // From product selector
  activity: "Product A",             // Set to product name
  estimatedSales: 50000,             // From form input
  fieldBudget: 7000,                 // From form input
  harvestBudget: 3000,               // From form input
  budgetRequired: 10000,             // AUTO: fieldBudget + harvestBudget
  requestGroupId: "brg-123",         // Session ID
  requestNumber: "BR-2026-001",      // Session number
  status: "submitted"
}
```

### Why This is Better
- ✅ Clear separation: Who (MDO), What (Product), How Much (Sales vs Budgets)
- ✅ Budget breakdown shows Field vs Harvest allocation
- ✅ Product-level view matches filter organization
- ✅ Activity removed from submission (kept for data compatibility)
- ✅ Table format easier to scan and review

---

## 📦 What's Actually Displayed Now

### In AM View (After Submission)
All MDOs organized **by Product** showing:
- **MDO Name**: Customer/dealer identifier
- **Est. Sales**: ₹ sales target for that MDO
- **Field Budget**: ₹ allocated for field-level activities
- **Harvest Budget**: ₹ allocated for harvest-level activities
- **Total**: Sum of Field + Harvest budget
- **Product Subtotals**: Sum of all MDOs under that product
- **Grand Totals**: Across all products

### In ZM/RM/AIM View (Approval)
Same table format when reviewing requests for approval:
- Can filter by Session Number (via filter)
- Can filter by Product (via filter)
- Table shows all budget details for each MDO
- Product-level summaries
- Easy calculation of total budget per product

---

## 🔧 Files Modified

1. **types.ts**
   - Added `fieldBudget: number` to BudgetRequest
   - Added `harvestBudget: number` to BudgetRequest

2. **BudgetRequestTab.tsx**
   - Updated `formData` state structure
   - Removed Product/Activity input fields from form
   - Added Product selector (mandatory)
   - Added Field Budget and Harvest Budget inputs
   - Updated mdoList display to table format with product grouping
   - Updated submission logic to calculate budgetRequired = fieldBudget + harvestBudget
   - Updated request display section to show new columns in table format
   - Added Product totals and Grand Summary

3. **AppContext.tsx**
   - No changes needed (addBudgetRequest handles new fields automatically)

---

## ✅ Testing Checklist

- [ ] AM can see Product selector in Step 2B
- [ ] Product selector is mandatory (shows error if not selected)
- [ ] MDO Name, Est Sales, Field Budget, Harvest Budget all required
- [ ] "+ Add MDO to Product" button works and adds row to table
- [ ] Table groups MDOs by product correctly
- [ ] Product totals calculate correctly (Sum of all MDOs under product)
- [ ] Grand Summary totals are correct
- [ ] "Clear All" button clears the entire mdoList
- [ ] Can add multiple products sequentially
- [ ] Submit button shows total MDOs and total budget
- [ ] Submitted data includes fieldBudget and harvestBudget
- [ ] View for ZM/RM shows new table format with budget columns
- [ ] budgetRequired = fieldBudget + harvestBudget (verify in submitted data)
- [ ] Product column appears in AM own requests view
- [ ] Filter by Session Number still works
- [ ] No console errors

---

## 🚀 Usage Example

### Scenario: AM submitting budget for 2 products

**STEP 1: Select Product A**
```
📦 Select Product
[-- Select Product ▼]
    ✓ Select Product A
    
✅ "📦 Product A - Now adding MDOs for this product"
```

**STEP 2: Add 2 MDOs under Product A**
```
[MDO-001]  [50,000]  [7,000]  [3,000]  [+ Add]
[MDO-002]  [75,000]  [10,000] [5,000]  [+ Add]

TABLE VIEW:
📦 Product A
┌──────────┬─────────┬──────────┬───────────┬─────────┐
│ MDO Name │ Sales   │ Field    │ Harvest   │ Total   │
├──────────┴─────────┴──────────┴───────────┴─────────┤
│ MDO-001  │ 50,000  │ 7,000    │ 3,000     │ 10,000  │
│ MDO-002  │ 75,000  │ 10,000   │ 5,000     │ 15,000  │
├──────────┬─────────┬──────────┬───────────┬─────────┤
│ Subtotal │125,000  │ 17,000   │ 8,000     │ 25,000  │
└──────────┴─────────┴──────────┴───────────┴─────────┘
```

**STEP 3: Select Product B (add different MDOs)**
```
📦 Select Product
[Product A ▼]  → Change to Product B
    ✓ Select Product B
    
✅ "📦 Product B - Now adding MDOs for this product"

[MDO-003]  [60,000]  [8,000]   [4,000]   [+ Add]

TABLE VIEW (Updated):
📦 Product A
┌──────────┬─────────┬──────────┬───────────┬─────────┐
│ MDO Name │ Sales   │ Field    │ Harvest   │ Total   │
├──────────┴─────────┴──────────┴───────────┴─────────┤
│ MDO-001  │ 50,000  │ 7,000    │ 3,000     │ 10,000  │
│ MDO-002  │ 75,000  │ 10,000   │ 5,000     │ 15,000  │
├──────────┬─────────┬──────────┬───────────┬─────────┤
│ Subtotal │125,000  │ 17,000   │ 8,000     │ 25,000  │
└──────────┴─────────┴──────────┴───────────┴─────────┘

📦 Product B
┌──────────┬─────────┬──────────┬───────────┬─────────┐
│ MDO-003  │ 60,000  │ 8,000    │ 4,000     │ 12,000  │
├──────────┬─────────┬──────────┬───────────┬─────────┤
│ Subtotal │ 60,000  │ 8,000    │ 4,000     │ 12,000  │
└──────────┴─────────┴──────────┴───────────┴──────────┘

GRAND SUMMARY
  Total Est Sales: ₹185,000
  Total Field:     ₹25,000
  Total Harvest:   ₹12,000
  Total Budget:    ₹37,000
  MDO Count:       3
```

**STEP 4: Submit**
```
[📤 Submit 3 MDOs (₹37,000)]
```

Result: 3 budget requests created:
- MDO-001 under Product A, Field: 7000, Harvest: 3000, Total: 10000
- MDO-002 under Product A, Field: 10000, Harvest: 5000, Total: 15000
- MDO-003 under Product B, Field: 8000, Harvest: 4000, Total: 12000

---

## 📖 Notes

- Product selector must be changed explicitly to add MDOs for a different product
- Activity field is set to product name automatically (for backward compatibility)
- All calculations (subtotals, grand totals) are real-time
- Form validation requires: MDO Name, Est Sales, Field Budget, Harvest Budget
- budgetRequired is always calculated and never editable
- Estimated Sales is informational (for reference/tracking), not a budget
