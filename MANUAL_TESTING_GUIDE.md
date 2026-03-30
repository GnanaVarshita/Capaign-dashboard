# 🧪 Manual Testing Guide - Budget Request Feature

**Last Updated**: March 29, 2026  
**Environment**: http://localhost:5174  
**Feature**: Budget Request Session & MDO Budget Submission

---

## Quick Start - Manual Testing

### Prerequisites
- Frontend running on http://localhost:5174 ✅
- Backend running on http://localhost:3001 ✅

### Test Credentials

#### Role: All India Manager (AIM)
- **Login ID**: `arjun.aim`
- **Password**: `AIM@2026`
- **Capability**: Create budget request cycles/sessions

#### Role: Area Manager (AM)
- **Login ID**: `ravi.lko`
- **Password**: `Area@123`
- **Capability**: Submit budget requests under sessions
- **Alternate**: `priya.knp` / `Area@456`

#### Role: Zonal Manager (ZM)
- **Login ID**: `amit.up`
- **Password**: `Zone@123`
- **Capability**: Approve requests from their zone

#### Role: Regional Manager (RM)
- **Login ID**: `rajesh.north`
- **Password**: `North@123`
- **Capability**: Approve requests from their region
- **Alternate**: `sunita.west` / `West@123`

---

## Test Workflow 1: Complete Budget Request Cycle

### Step 1: Login as AIM
1. Go to http://localhost:5174/
2. Enter Login ID: `arjun.aim`
3. Enter Password: `AIM@2026`
4. Click "Login"

### Step 2: Navigate to Budget Request Tab
1. Once logged in, look for navigation tabs at the top
2. Click on **"Budget Requests"** tab
3. You should see "📊 Budget Request Management" header

### Step 3: Create Budget Request Session (AIM only)
1. Look for blue button: **"+ Create Request Cycle"**
2. Click the button
3. Fill in the form:
   - **Cycle Description**: "Q1 2026 Budget Cycle"
   - **Target Submission Date**: 2026-04-30
   - **Select Regions**: Check "North" and "West"
4. Click **"✓ Create Cycle"**
5. **Expected**: Toast notification "Budget request group created!"
6. Note the generated session number (e.g., BR-2026-001)

### Step 4: Logout and Login as Area Manager
1. Click your profile/account icon
2. Select **"Logout"**
3. Enter Login ID: `ravi.lko`
4. Enter Password: `Area@123`
5. Click "Login"

### Step 5: Navigate to Budget Request Tab (AM view)
1. Click **"Budget Requests"** tab
2. You should see "📊 Budget Request Management" header with different subtitle
3. Look for **"Step 1: Select Request Cycle to Submit Budget"** section

### Step 6: Select Budget Request Cycle
1. In the dropdown "Available Request Cycles *"
2. Select the session you created (e.g., "BR-2026-001 - Q1 2026 Budget Cycle")
3. **Expected**: Green confirmation box appears: "✅ Selected: BR-2026-001"

### Step 7: Scroll to Step 2: Enter MDO Details
1. Look for **"Step 2: Submit Budget Requests for Activities"** section
2. In **"Select Product *"** dropdown, choose **"Product A"**
3. **Expected**: Message shows "📦 Product A - Now adding MDOs for this product"

### Step 8: Enter First MDO
1. **MDO Name**: Type "Sales Officer John"
2. **Estimated Sales**: Type "500000"
3. Scroll to **"Budget by Activity"** section
4. Allocate budget to each activity:
   - Field Campaign: 100000
   - Harvest: 150000
   - Crop Meetings: 100000
   - Jeep Campaign: 50000
5. **Remarks** (optional): "Q1 sales target"
6. Click **"+ Add MDO to Product A"** button
7. **Expected**: Form clears, MDO appears in summary table

### Step 9: Add Second MDO (Same Product)
1. **MDO Name**: "Sales Officer Priya"
2. **Estimated Sales**: "600000"
3. Allocate:
   - Field Campaign: 150000
   - Harvest: 200000
   - Crop Meetings: 150000
   - Jeep Campaign: 100000
4. Click **"+ Add MDO to Product A"**
5. **Expected**: Both MDOs visible in summary table

### Step 10: Verify Summary Table
1. Scroll to **"📋 Budget Details: 2 MDOs"** section
2. **Verify table shows**:
   - Header: "📦 Product A"
   - Two rows: "Sales Officer John" and "Sales Officer Priya"
   - Est Sales column: 500000, 600000
   - Activity columns with budgets
   - Total column: 400000, 600000
   - Product Total row: Shows sums

### Step 11: Submit Budget Requests
1. Look for green button: **"📤 Submit 2 MDOs (₹1,000,000)"**
2. Click the button
3. **Expected**: 
   - Toast: "Budget request added to group!"
   - Form clears
   - Requests appear in table below

### Step 12: Test Filters as Area Manager
1. Scroll to **"🔍 Filter Budget Requests by Multiple Criteria"**
2. **Session Number**: Select "BR-2026-001"
3. **Expected**: Only requests from this session shown
4. **Product**: Select "Product A"
5. **Expected**: Only Product A requests shown
6. Click **"Clear All Filters"**
7. **Expected**: All filters reset

### Step 13: Logout and Login as Zonal Manager
1. Logout (Account menu)
2. Login as: `amit.up` / `Zone@123`
3. Go to **"Budget Requests"** tab

### Step 14: Zonal Manager Reviews & Approves
1. Look for **"📊 Budget Requests"** section
2. **Expected**: Table shows:
   - Your submitted MDOs grouped by product
   - Status showing as "Submitted" (yellow badge)
3. Find the "Approve" button or action row
4. Click **Approve** for a request
5. **Expected**: 
   - Status changes to "ZM Approved" (blue badge)
   - Toast: "Budget request approved by Amit Verma!"

### Step 15: Logout and Login as Regional Manager
1. Logout
2. Login as: `rajesh.north` / `North@123`
3. Go to **"Budget Requests"** tab

### Step 16: Regional Manager Reviews & Approves
1. Look for approved requests from ZM (status: "ZM Approved")
2. Find an "Approve" button
3. Click **Approve**
4. **Expected**:
   - Status changes to "RM Approved" (purple badge)
   - Toast: "Budget request approved by Rajesh Kumar!"

### Step 17: Logout and Login as AIM Again
1. Logout
2. Login as: `arjun.aim` / `AIM@2026`
3. Go to **"Budget Requests"** tab

### Step 18: AIM Views Aggregated Requests
1. **Expected**: You see aggregated view by region
2. Each region card shows:
   - Region name (e.g., "North", "West")
   - Total Estimated Sales
   - Total Budget Required
   - Number of requests
   - Status

### Step 19: AIM Approves
1. Find a regional view with RM-approved requests
2. Click **"Approve"** on the region
3. **Expected**:
   - All requests in that region status change to "AIM Approved" (green badge)
   - Toast: "Budget request approved by Arjun Mehta!"

---

## Test Workflow 2: Just Filters (Quick Test)

If you just want to test filters:

1. Login as AIM
2. Go to Budget Requests
3. Create a test session with some region
4. Login as AM
5. Select session, add a few MDOs with different products/activities
6. Submit them
7. In **"🔍 Filter Budget Requests"** section:
   - Try Session Number filter
   - Try Product filter
   - Try Activity filter
   - Click "Clear All Filters"

---

## Expected Test Data in Dropdowns

### Products Available
- Product A
- Product B
- Product C

### Activities Available
- Field Campaign
- Harvest
- Crop Meetings
- Jeep Campaign

### Regions (if configured)
- North
- West
- East
- South
- Central

---

## Common Issues & Troubleshooting

### Issue: "No Budget Request Cycles Available"
**Solution**: Login as AIM and create a cycle first

### Issue: "Session Dropdown Empty"
**Solution**: 
- Make sure you logged in as AIM and created cycles
- Make sure the cycles status is "active"
- Check if your region matches the cycle's selected regions

### Issue: "Product Dropdown Empty"
**Solution**: 
- Products are stored in AppContext from initial data
- They should show: Product A, Product B, Product C
- If not, check browser console for errors

### Issue: "Can't see Budget Requests Tab"
**Solution**: 
- You need to be one of these roles: AM, ZM, RM, AIM, Owner, Finance Admin
- Check your selected role in the test credentials

### Issue: "Submitted Requests Disappear"
**Solution**: 
- They don't disappear, they're grouped below in the "Budget Requests" section
- Scroll down to see submitted requests
- Use filters to find them

---

## Success Indicators ✅

You'll know the feature is working when you see:

1. ✅ AIM can create session with BR-YYYY-### format
2. ✅ AM can see active sessions in dropdown
3. ✅ AM can select product and activities from masters
4. ✅ MDO summary table shows with calculations
5. ✅ Submitted requests have "Submitted" status (yellow)
6. ✅ ZM can approve (status → "ZM Approved", blue)
7. ✅ RM can approve (status → "RM Approved", purple)
8. ✅ AIM sees aggregated view by region
9. ✅ AIM can approve (status → "AIM Approved", green)
10. ✅ Filters work: Session, Product, Activity

---

## Test Duration
- **Quick Test** (Filters only): 10-15 minutes
- **Full Workflow Test**: 30-45 minutes
- **Complete Multi-User Test**: 1-2 hours

---

## Notes

- Data is stored in React Context (in-memory)
- Refreshing page will reset all data
- All users see the same accounts/data
- Approval workflow is enforced by role
- Filters are case-sensitive
- Budget totals are calculated in real-time

---

**Happy Testing! 🎯**
