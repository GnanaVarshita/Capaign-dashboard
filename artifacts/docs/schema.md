# Database Schema

Here is the database schema used in the application.

```typescript
import {
  pgTable,
  text,
  integer,
  doublePrecision,
  timestamp,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  loginId: text('login_id').unique().notNull(),
  password: text('password').notNull(),
  role: text('role').notNull(),
  status: text('status').default('active').notNull(),
  phone: text('phone'),
  email: text('email'),
  aadhaar: text('aadhaar'),
  pan: text('pan'),
  territory: jsonb('territory').$type<any>().default({}).notNull(),
  perms: jsonb('perms').$type<any>().default({}).notNull(),
  tabPerms: jsonb('tab_perms').$type<any>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const entries = pgTable('entries', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  userName: text('user_name').notNull(),
  userRole: text('user_role').notNull(),
  po: text('po').notNull(),
  product: text('product').notNull(),
  activity: text('activity').notNull(),
  crop: text('crop'),
  amount: doublePrecision('amount').notNull(),
  area: text('area').notNull(),
  pin: text('pin').default('').notNull(),
  zmId: text('zm_id').default('').notNull(),
  zmName: text('zm_name').default('').notNull(),
  rmId: text('rm_id').default('').notNull(),
  rmName: text('rm_name').default('').notNull(),
  vendorId: text('vendor_id').default('').notNull(),
  vendorName: text('vendor_name').default('').notNull(),
  vendorCode: text('vendor_code').default('').notNull(),
  description: text('description'),
  date: text('date').notNull(),
  remarks: text('remarks'),
  status: text('status').default('pending').notNull(),
  decidedBy: text('decided_by'),
  decidedByDesignation: text('decided_by_designation'),
  decidedAt: text('decided_at'),
  editedBy: text('edited_by'),
  region: text('region'),
  zone: text('zone'),
  campaignPhoto: text('campaign_photo'),
  expensePhoto: text('expense_photo'),
  otherPhoto: text('other_photo'),
  photoUploadedBy: text('photo_uploaded_by'),
  photoUploadedAt: text('photo_uploaded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pos = pgTable('pos', {
  id: text('id').primaryKey(),
  poNumber: text('po_number').unique().notNull(),
  budget: doublePrecision('budget').notNull(),
  fromDate: text('from_date').notNull(),
  toDate: text('to_date').notNull(),
  status: text('status').default('Draft').notNull(),
  remarks: text('remarks'),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull(),
  approvalStatus: text('approval_status').default('pending').notNull(),
  approvedBy: text('approved_by'),
  approvedAt: text('approved_at'),
  rejectionReason: text('rejection_reason'),
  regionBudgets: jsonb('region_budgets').$type<Record<string, number>>().default({}).notNull(),
  allocations: jsonb('allocations').$type<any>().default({}).notNull(),
  zoneAllocations: jsonb('zone_allocations').$type<any>().default({}).notNull(),
});

export const regions = pgTable('regions', {
  name: text('name').primaryKey(),
  manager: text('manager').notNull(),
  color: text('color').notNull(),
  states: jsonb('states').$type<string[]>().default([]).notNull(),
  zones: jsonb('zones').$type<any[]>().default([]).notNull(),
});

export const products = pgTable('products', {
  name: text('name').primaryKey(),
});

export const crops = pgTable('crops', {
  name: text('name').primaryKey(),
});

export const activities = pgTable('activities', {
  name: text('name').primaryKey(),
});

export const bills = pgTable('bills', {
  id: text('id').primaryKey(),
  vendorId: text('vendor_id').notNull(),
  vendorName: text('vendor_name').notNull(),
  vendorCode: text('vendor_code'),
  entryIds: jsonb('entry_ids').$type<string[]>().default([]).notNull(),
  totalAmount: doublePrecision('total_amount').notNull(),
  activityAmount: doublePrecision('activity_amount').notNull(),
  serviceChargeAmt: doublePrecision('service_charge_amt').default(0).notNull(),
  serviceChargePct: doublePrecision('service_charge_pct'),
  gstRate: doublePrecision('gst_rate').default(0).notNull(),
  status: text('status').default('draft').notNull(),
  createdAt: text('created_at').notNull(),
  date: text('date'),
  submittedAt: text('submitted_at'),
  paidAt: text('paid_at'),
  paymentMode: text('payment_mode'),
  paymentRef: text('payment_ref'),
  paymentRemarks: text('payment_remarks'),
  invoiceNumber: text('invoice_number'),
  remarks: text('remarks'),
  serviceReceiverId: text('service_receiver_id'),
  receiverDetails: jsonb('receiver_details').$type<any>(),
  spTradeName: text('sp_trade_name'),
  spVendorCode: text('sp_vendor_code'),
  spGST: text('sp_gst'),
  spPAN: text('sp_pan'),
  spAddress: text('sp_address'),
  spPhone: text('sp_phone'),
  spEmail: text('sp_email'),
  bankDetails: jsonb('bank_details').$type<any>(),
  entryDetails: jsonb('entry_details').$type<any>(),
  signatoryName: text('signatory_name'),
  signatoryDesignation: text('signatory_designation'),
  paymentId: text('payment_id'),
  paymentDate: text('payment_date'),
  modificationRequested: boolean('modification_requested').default(false),
  modificationRequestedAt: text('modification_requested_at'),
  modificationApprovedBy: text('modification_approved_by'),
  modificationApprovedAt: text('modification_approved_at'),
});

export const serviceReceivers = pgTable('service_receivers', {
  id: text('id').primaryKey(),
  vendorId: text('vendor_id').references(() => users.id).notNull(),
  companyName: text('company_name').notNull(),
  gst: text('gst').notNull(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  contactPerson: text('contact_person').notNull(),
  createdAt: text('created_at').notNull(),
});

export const budgetRequestGroups = pgTable('budget_request_groups', {
  id: text('id').primaryKey(),
  requestNumber: text('request_number').unique().notNull(),
  aimId: text('aim_id').notNull(),
  aimName: text('aim_name').notNull(),
  createdAt: text('created_at').notNull(),
  status: text('status').default('active').notNull(),
  description: text('description'),
  targetDate: text('target_date'),
  selectedRegions: jsonb('selected_regions').$type<string[]>(),
});

export const budgetRequests = pgTable('budget_requests', {
  id: text('id').primaryKey(),
  requestGroupId: text('request_group_id').references(() => budgetRequestGroups.id),
  requestNumber: text('request_number'),
  areaManagerId: text('area_manager_id').notNull(),
  areaManagerName: text('area_manager_name').notNull(),
  area: text('area').notNull(),
  zone: text('zone').notNull(),
  region: text('region').notNull(),
  mdoName: text('mdo_name').notNull(),
  crop: text('crop'),
  product: text('product').notNull(),
  activity: text('activity').notNull(),
  estimatedSales: doublePrecision('estimated_sales').notNull(),
  activityBudgets: jsonb('activity_budgets').$type<any>().default({}).notNull(),
  budgetRequired: doublePrecision('budget_required').notNull(),
  status: text('status').default('submitted').notNull(),
  createdAt: text('created_at').notNull(),
  submissionCount: integer('submission_count').default(0),
  zmId: text('zm_id'),
  zmName: text('zm_name'),
  zmApprovedAt: text('zm_approved_at'),
  rmId: text('rm_id'),
  rmName: text('rm_name'),
  rmApprovedAt: text('rm_approved_at'),
  aimId: text('aim_id'),
  aimName: text('aim_name'),
  aimApprovedAt: text('aim_approved_at'),
  remarks: text('remarks'),
});

export const vendorProfiles = pgTable('vendor_profiles', {
  vendorId: text('vendor_id').primaryKey(),
  tradeName: text('trade_name').notNull(),
  vendorCode: text('vendor_code').notNull(),
  gst: text('gst').default('').notNull(),
  address: text('address').default('').notNull(),
  phone: text('phone').default('').notNull(),
  email: text('email').default('').notNull(),
  bankName: text('bank_name'),
  accountNo: text('account_no'),
  ifsc: text('ifsc'),
  pan: text('pan'),
});

export const vendorQuotations = pgTable('vendor_quotations', {
  id: text('id').primaryKey(),
  poId: text('po_id').notNull(),
  poNumber: text('po_number').notNull(),
  vendorId: text('vendor_id').notNull(),
  vendorName: text('vendor_name').notNull(),
  vendorCode: text('vendor_code'),
  region: text('region').notNull(),
  items: jsonb('items').$type<any>().default([]).notNull(),
  status: text('status').default('draft').notNull(),
  submittedAt: text('submitted_at'),
  createdAt: text('created_at').notNull(),
});
```
