# Ad Campaign Dashboard — Backend API Specification

**Stack:** Cloudflare Workers (Hono) · Neon PostgreSQL  
**Auth:** JWT Bearer tokens (HS256, 24h expiry)  
**Base URL (dev):** `http://localhost:8787`  
**Base URL (prod):** `https://ad-campaign-api.<your-subdomain>.workers.dev`

---

## Authentication

All protected routes require the header:
```
Authorization: Bearer <token>
```

Tokens are obtained via the login endpoint and expire after 24 hours.

---

## Role-Based Access Summary

| Role | Abbr | Can Do |
|------|------|--------|
| Owner | - | Everything, including user management and settings |
| All India Manager | AIM | Approve POs, approve budget requests, view all data |
| Regional Manager | RM | Approve entries in their region, view regional data |
| Zonal Manager | ZM | Approve entries in their zone, view zone data |
| Area Manager | AM | Submit activity entries, view own entries |
| Vendor | V | View assigned POs, generate bills for approved entries |

---

## 1. Auth Endpoints

### POST `/api/auth/login`
Authenticate a user and receive a JWT token.

**Public** — no authentication required.

**Request body:**
```json
{
  "loginId": "abc",
  "password": "Abc@123"
}
```

**Success response `200`:**
```json
{
  "token": "<jwt>",
  "user": {
    "id": "u0",
    "name": "System Owner",
    "loginId": "abc",
    "role": "Owner",
    "status": "active",
    "territory": {},
    "perms": { "view": true, "enter": true, "edit": true, "approve": true, "manage": true, "settings": true }
  }
}
```

**Error response `401`:**
```json
{ "error": "Invalid credentials or account inactive" }
```

---

### GET `/api/me`
Get the currently authenticated user's profile.

**Auth required.** Returns same shape as the `user` object above.

---

## 2. Users

### GET `/api/users`
Get all users visible to the caller.

- **Owner / AIM:** all users
- **RM:** users in their region + linked vendors
- **ZM:** users in their zone
- **AM / Vendor:** only themselves

**Response:** `User[]`

---

### GET `/api/users/:id`
Get a single user by ID.

---

### POST `/api/users`
Create a new user.

**Roles:** Owner only.

**Request body:**
```json
{
  "name": "John Doe",
  "loginId": "john.am",
  "password": "Pass@123",
  "role": "Area Manager",
  "status": "active",
  "territory": {
    "region": "North",
    "zone": "UP Zone",
    "area": "Agra",
    "reportingZMId": "u4",
    "reportingRMId": "u2"
  },
  "perms": { "view": true, "enter": true, "edit": true, "approve": false, "manage": false }
}
```

**Response `201`:** Created user (without password).

---

### PUT `/api/users/:id`
Update a user.

**Roles:** Owner only. Partial updates accepted.

**Response:** Updated user.

---

### DELETE `/api/users/:id`
Delete a user.

**Roles:** Owner only.

**Response:** `{ "success": true }`

---

## 3. Entries (Activity Expenses)

### GET `/api/entries`
Get all entries scoped to the caller's role.

- **Owner / AIM:** all entries
- **RM:** entries from their region
- **ZM:** entries from their zone
- **AM:** their own entries
- **Vendor:** entries where they are the vendor

**Response:** `Entry[]`

---

### GET `/api/entries/pending`
Get pending entries visible to the caller for approval.

- **Owner / AIM:** all pending
- **RM:** pending from subordinates in their region (ZM, AM, Vendor)
- **ZM:** pending from subordinates in their zone (AM, Vendor)
- **AM / Vendor:** empty (they don't approve)

**Response:** `Entry[]`

---

### GET `/api/entries/mine`
Get entries submitted by the currently logged-in user.

**Response:** `Entry[]`

---

### POST `/api/entries`
Submit a new activity entry.

**Roles:** Area Manager, Vendor, Owner, AIM.

**Request body:**
```json
{
  "po": "PO-2026-001",
  "product": "Product A",
  "activity": "Field Campaign",
  "amount": 15000,
  "area": "Lucknow",
  "pin": "226001",
  "date": "2026-04-10",
  "description": "Village campaign at Mohanlalganj.",
  "zmId": "u4",
  "zmName": "Amit Verma",
  "rmId": "u2",
  "rmName": "Rajesh Kumar",
  "vendorId": "v1",
  "vendorName": "Agroworks Pvt. Ltd.",
  "vendorCode": "VND-2026-001",
  "remarks": "",
  "region": "North",
  "zone": "UP Zone",
  "crop": "Wheat"
}
```

**Response `201`:** Created entry with `status: "pending"`.

---

### PUT `/api/entries/:id`
Update an entry.

**Auth rules:**
- Owner / AIM: can update any entry
- AM: can only update their own pending entries

**Response:** Updated entry.

---

### PUT `/api/entries/:id/status`
Approve or reject an entry.

**Roles:** Owner, AIM, RM, ZM.

**Request body:**
```json
{
  "status": "approved",
  "remarks": "Looks good"
}
```

`status` must be `"approved"` or `"rejected"`.

**Response:** Updated entry with `decidedBy`, `decidedAt` filled.

---

### DELETE `/api/entries/:id`
Delete an entry.

**Auth rules:**
- Owner: any entry
- AM: only their own pending entries

---

## 4. Purchase Orders (POs)

### GET `/api/pos`
Get POs scoped to caller's role.

- **Owner / AIM:** all POs
- **RM:** POs that include their region
- **ZM:** POs allocated to their zone in their region
- **Vendor:** POs for their assigned regions + any PO they have entries in

**Response:** `PO[]`

---

### GET `/api/pos/:id`
Get a PO by ID or PO number.

---

### POST `/api/pos`
Create a new PO.

**Roles:** Owner, AIM.

**Request body:**
```json
{
  "poNumber": "PO-2026-003",
  "budget": 500000,
  "from": "2026-04-01",
  "to": "2026-06-30",
  "status": "Draft",
  "remarks": "Q2 Push",
  "regionBudgets": { "North": 200000, "West": 150000 },
  "allocations": {},
  "zoneAllocations": {}
}
```

**Response `201`:** Created PO with `approvalStatus: "pending"`.

---

### PUT `/api/pos/:id`
Update a PO (budgets, allocations, etc.)

**Roles:** Owner, AIM.

---

### PUT `/api/pos/:id/approve`
Approve a pending PO.

**Roles:** Owner, AIM.

**Response:** Updated PO with `approvalStatus: "approved"`, `status: "Active"`.

---

### PUT `/api/pos/:id/reject`
Reject a PO with an optional reason.

**Roles:** Owner, AIM.

**Request body:** `{ "reason": "Budget exceeded limits" }`

---

### PUT `/api/pos/:id/lapse`
Mark a PO as lapsed.

**Roles:** Owner.

---

## 5. Bills (Vendor Invoices)

### GET `/api/bills`
Get bills scoped to caller.

- **Vendor:** only their own bills
- **Others:** all bills

**Response:** `Bill[]`

---

### GET `/api/bills/:id`
Get a single bill.

---

### POST `/api/bills`
Create a new bill (invoice).

**Roles:** Vendor, Owner, AIM.

Invoice number is auto-generated: `INV/<year>/<sequence>`.

**Request body:**
```json
{
  "vendorId": "v1",
  "vendorName": "Agroworks Pvt. Ltd.",
  "entryIds": ["e1", "e4"],
  "activityAmount": 33500,
  "serviceChargeAmt": 1675,
  "serviceChargePct": 5,
  "gstRate": 18,
  "totalAmount": 41767,
  "remarks": "February 2026 activities"
}
```

**Response `201`:** Bill with `status: "draft"` and auto-generated `invoiceNumber`.

---

### PUT `/api/bills/:id`
Update a bill (vendor details, bank info, etc.)

**Auth rules:** Vendor — only their own draft bills. Owner — any bill.

---

### PUT `/api/bills/:id/submit`
Vendor submits a bill for payment.

**Roles:** Vendor (own bills), Owner.

**Response:** Bill with `status: "submitted"`.

---

### PUT `/api/bills/:id/pay`
Mark a bill as paid.

**Roles:** Owner, Finance Administrator.

**Request body:** `{ "paymentId": "UTR-12345", "paymentDate": "2026-04-10" }`

---

## 6. Budget Requests

### GET `/api/budget-request-groups`
Get budget request groups (cycles).

- **AM / Vendor:** active groups only
- **Others:** all groups

---

### POST `/api/budget-request-groups`
Create a new budget request cycle.

**Roles:** Owner, AIM.

**Request body:**
```json
{
  "description": "Q2 2026 Budget Planning",
  "targetDate": "2026-04-20",
  "selectedRegions": ["North", "West"]
}
```

**Response `201`:** Group with auto-generated `requestNumber` (e.g. `BR-2026-001`).

---

### PUT `/api/budget-request-groups/:id/close`
Close a budget request cycle.

**Roles:** Owner, AIM.

---

### GET `/api/budget-requests`
Get budget requests scoped to caller.

- **Owner / AIM:** all
- **RM:** their region
- **ZM:** their zone
- **AM:** their own

---

### POST `/api/budget-requests`
Submit a budget request (AM fills in for an MDO/area).

**Roles:** Area Manager, Owner.

**Request body:**
```json
{
  "requestGroupId": "brg-...",
  "requestNumber": "BR-2026-001",
  "areaManagerId": "u5",
  "areaManagerName": "Ravi Singh",
  "area": "Lucknow",
  "zone": "UP Zone",
  "region": "North",
  "mdoName": "MDO Sharma",
  "crop": "Wheat",
  "product": "Product A",
  "activity": "Field Campaign",
  "estimatedSales": 200000,
  "activityBudgets": { "Field Campaign": 5000, "Harvest": 3000 },
  "budgetRequired": 8000
}
```

---

### PUT `/api/budget-requests/:id/approve`
Sequential approval by ZM → RM → AIM.

Each approver can only approve when the request is in the correct status:
- **ZM:** `submitted` → `zm-approved`
- **RM:** `zm-approved` → `rm-approved`
- **AIM / Owner:** `rm-approved` → `aim-approved`

**Response:** Updated request with approver details and timestamp.

---

## 7. Config (Master Data)

### GET `/api/config`
Get all master lists.

**Response:**
```json
{
  "products":   ["Product A", "Product B", "Product C"],
  "activities": ["Field Campaign", "Harvest", "Crop Meetings", "Jeep Campaign"],
  "crops":      ["Wheat", "Rice", "Cotton", "Corn"]
}
```

---

### POST `/api/config/products`
Add a product. **Roles:** Owner. Body: `{ "name": "Product D" }`

### PUT `/api/config/products/:name`
Rename a product. **Roles:** Owner. Body: `{ "name": "New Name" }`

### DELETE `/api/config/products/:name`
Delete a product. **Roles:** Owner.

_(Same pattern for `/api/config/activities` and `/api/config/crops`)_

---

## 8. Regions

### GET `/api/regions`
Get all regions with zones and areas.

### POST `/api/regions`
Create a region. **Roles:** Owner.

### PUT `/api/regions/:name`
Update a region. **Roles:** Owner.

---

## 9. Vendor Profiles

### GET `/api/vendor-profiles`
Get all vendor profiles. Vendors only see their own.

### GET `/api/vendor-profiles/:vendorId`
Get a specific vendor's profile. Vendors can only read their own.

### PUT `/api/vendor-profiles/:vendorId`
Update a vendor profile. Vendors can only update their own.

**Request body (partial):**
```json
{
  "tradeName": "Agroworks Pvt. Ltd.",
  "vendorCode": "VND-2026-001",
  "gst": "09AABCA1234A1Z5",
  "pan": "AABCA1234A",
  "address": "12 Indranagar, Lucknow, UP",
  "phone": "9876543210",
  "email": "mahesh@agroworks.in",
  "bankName": "SBI",
  "accountNo": "123456789012",
  "ifsc": "SBIN0012345"
}
```

---

## 10. Service Receivers

### GET `/api/service-receivers`
Get service receivers. Vendors see only their own.

### POST `/api/service-receivers`
Create a service receiver. **Roles:** Vendor, Owner.

**Request body:**
```json
{
  "companyName": "AgriCo Pvt Ltd",
  "gst": "09ABCDE1234F1Z5",
  "address": "Lucknow, UP",
  "phone": "9876543210",
  "email": "contact@agrico.in",
  "contactPerson": "Ramesh Kumar",
  "createdAt": "2026-04-10"
}
```

### PUT `/api/service-receivers/:id`
Update. Vendors can only update their own.

### DELETE `/api/service-receivers/:id`
Delete. Vendors can only delete their own.

---

## Data Types Reference

### User
```typescript
{
  id: string;
  name: string;
  loginId: string;
  role: 'Owner' | 'Finance Administrator' | 'All India Manager' | 'Regional Manager' | 'Zonal Manager' | 'Area Manager' | 'Vendor';
  status: 'active' | 'inactive';
  territory: {
    region?: string; zone?: string; area?: string;
    reportingAIMId?: string; reportingRMId?: string; reportingZMId?: string;
    tradeName?: string; vendorCode?: string;
    assignedRMIds?: string[];
    assignedZones?: { region: string; zone: string; activities: string[] }[];
  };
  perms: { view: boolean; enter: boolean; edit: boolean; approve: boolean; manage: boolean; settings?: boolean };
  phone?: string; email?: string; aadhaar?: string; pan?: string;
}
```

### Entry
```typescript
{
  id: string; userId: string; userName: string; userRole: string;
  po: string; product: string; activity: string; crop?: string;
  amount: number; area: string; pin: string;
  zmId: string; zmName: string; rmId: string; rmName: string;
  vendorId: string; vendorName: string; vendorCode: string;
  description: string; date: string; remarks: string;
  status: 'pending' | 'approved' | 'rejected';
  decidedBy: string; decidedByDesignation?: string; decidedAt: string;
  editedBy?: string; region?: string; zone?: string;
  campaignPhoto?: string; expensePhoto?: string; otherPhoto?: string;
}
```

### PO
```typescript
{
  id: string; poNumber: string; budget: number;
  from: string; to: string;
  status: 'Draft' | 'Active' | 'Expiring Soon' | 'Lapsed';
  remarks: string; createdBy: string; createdAt: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string; approvedAt?: string; rejectionReason?: string;
  regionBudgets: Record<string, number>;
  allocations: Record<string, Record<string, Record<string, number>>>;
  zoneAllocations: Record<string, Record<string, Record<string, Record<string, number>>>>;
}
```

---

## Deployment Notes

### Cloudflare Worker (api-worker)
```bash
cd artifacts/api-worker
npx wrangler deploy
```

### Neon PostgreSQL (future)
When ready to connect Neon:
1. Add `DATABASE_URL` to Cloudflare Worker secrets:
   ```bash
   npx wrangler secret put DATABASE_URL
   ```
2. Replace the in-memory `store` in `src/index.ts` with Drizzle ORM queries against Neon.
3. Enable Hyperdrive in `wrangler.toml` for connection pooling.

### Frontend
Set `VITE_API_URL` in `.env.local` to point at the deployed worker:
```
VITE_API_URL=https://ad-campaign-api.<your-subdomain>.workers.dev
```
When this variable is set, all hooks will use the live API instead of local mock data.
