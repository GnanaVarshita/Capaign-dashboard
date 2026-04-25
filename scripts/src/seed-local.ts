import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import {
  pgTable,
  text,
  integer,
  doublePrecision,
  timestamp,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://gnana:postgres@localhost:5432/api_worker';

// Inline schema (mirrors api-worker/src/db/schema.ts)
const users = pgTable('users', {
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

const entries = pgTable('entries', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
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

const pos = pgTable('pos', {
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
  regionBudgets: jsonb('region_budgets').$type<any>().default({}).notNull(),
  allocations: jsonb('allocations').$type<any>().default({}).notNull(),
  zoneAllocations: jsonb('zone_allocations').$type<any>().default({}).notNull(),
});

const regions = pgTable('regions', {
  name: text('name').primaryKey(),
  manager: text('manager').notNull(),
  color: text('color').notNull(),
  states: jsonb('states').$type<string[]>().default([]).notNull(),
  zones: jsonb('zones').$type<any[]>().default([]).notNull(),
});

const products = pgTable('products', { name: text('name').primaryKey() });
const crops = pgTable('crops', { name: text('name').primaryKey() });
const activities = pgTable('activities', { name: text('name').primaryKey() });

const schema = { users, entries, pos, regions, products, crops, activities };

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool, { schema });

// Password hashing
function toHex(buf: Uint8Array): string {
  return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string): Promise<string> {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'],
  );
  const hashBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256,
  );
  return `pbkdf2:${toHex(saltBytes)}:${toHex(new Uint8Array(hashBits))}`;
}

// Seed data (copied from seed-db.ts)
const SEED_USERS = [
  { id: 'u0', name: 'System Owner', loginId: 'abc', password: 'Abc@123', role: 'Owner', status: 'active', territory: {}, perms: { view: true, enter: true, edit: true, approve: true, manage: true, settings: true }, phone: null, email: null, aadhaar: null, pan: null, tabPerms: null },
  { id: 'u1', name: 'Arjun Mehta', loginId: 'arjun.aim', password: 'AIM@2026', role: 'All India Manager', status: 'active', territory: {}, perms: { view: true, enter: false, edit: false, approve: true, manage: true, settings: false }, phone: null, email: null, aadhaar: null, pan: null, tabPerms: null },
  { id: 'u2', name: 'Rajesh Kumar', loginId: 'rajesh.north', password: 'North@123', role: 'Regional Manager', status: 'active', territory: { region: 'North', reportingAIMId: 'u1', linkedVendorIds: ['v1', 'v2'] }, perms: { view: true, enter: false, edit: false, approve: true, manage: false, settings: false }, phone: null, email: null, aadhaar: null, pan: null, tabPerms: null },
  { id: 'u3', name: 'Sunita Patel', loginId: 'sunita.west', password: 'West@123', role: 'Regional Manager', status: 'active', territory: { region: 'West', reportingAIMId: 'u1', linkedVendorIds: ['v2'] }, perms: { view: true, enter: false, edit: false, approve: true, manage: false, settings: false }, phone: null, email: null, aadhaar: null, pan: null, tabPerms: null },
  { id: 'u4', name: 'Amit Verma', loginId: 'amit.up', password: 'Zone@123', role: 'Zonal Manager', status: 'active', territory: { region: 'North', zone: 'UP Zone', reportingRMId: 'u2', reportingAIMId: 'u1', linkedVendorIds: ['v1'] }, perms: { view: true, enter: false, edit: true, approve: true, manage: false, settings: false }, phone: null, email: null, aadhaar: null, pan: null, tabPerms: null },
  { id: 'u5', name: 'Ravi Singh', loginId: 'ravi.lko', password: 'Area@123', role: 'Area Manager', status: 'active', territory: { region: 'North', zone: 'UP Zone', area: 'Lucknow', reportingZMId: 'u4', reportingRMId: 'u2', linkedVendorIds: ['v1', 'v2'] }, perms: { view: true, enter: true, edit: true, approve: false, manage: false, settings: false }, phone: null, email: null, aadhaar: null, pan: null, tabPerms: null },
  { id: 'u6', name: 'Priya Sharma', loginId: 'priya.knp', password: 'Area@456', role: 'Area Manager', status: 'active', territory: { region: 'North', zone: 'UP Zone', area: 'Kanpur', reportingZMId: 'u4', reportingRMId: 'u2', linkedVendorIds: ['v1'] }, perms: { view: true, enter: true, edit: true, approve: false, manage: false, settings: false }, phone: null, email: null, aadhaar: null, pan: null, tabPerms: null },
  { id: 'v1', name: 'Mahesh Agrawal', loginId: 'mahesh.vendor', password: 'Vendor@123', role: 'Vendor', status: 'active', territory: { tradeName: 'Agroworks Pvt. Ltd.', vendorCode: 'VND-2026-001', assignedRMIds: ['u2'], assignedZones: [{ region: 'North', zone: 'UP Zone', activities: ['Field Campaign', 'Crop Meetings'] }] }, perms: { view: true, enter: false, edit: false, approve: false, manage: false, settings: false }, phone: '9876543210', email: 'mahesh@agroworks.in', aadhaar: null, pan: null, tabPerms: null },
  { id: 'v2', name: 'Sundar Krishnan', loginId: 'sundar.vendor', password: 'Vendor@456', role: 'Vendor', status: 'active', territory: { tradeName: 'Krishna Agro Supplies', vendorCode: 'VND-2026-002', assignedRMIds: ['u2', 'u3'], assignedZones: [{ region: 'North', zone: 'UP Zone', activities: ['Harvest'] }, { region: 'West', zone: 'Gujarat Zone', activities: ['Field Campaign', 'Harvest'] }] }, perms: { view: true, enter: false, edit: false, approve: false, manage: false, settings: false }, phone: '9123456780', email: 'sundar@krishnaagro.com', aadhaar: null, pan: null, tabPerms: null },
];

const SEED_ENTRIES = [
  { id: 'e1', userId: 'u5', userName: 'Ravi Singh', userRole: 'Area Manager', po: 'PO-2026-001', product: 'Product A', activity: 'Field Campaign', crop: null, amount: 15000, area: 'Lucknow', pin: '226001', zmId: 'u4', zmName: 'Amit Verma', rmId: 'u2', rmName: 'Rajesh Kumar', vendorId: 'v1', vendorName: 'Agroworks Pvt. Ltd.', vendorCode: 'VND-2026-001', description: 'Village campaign at Mohanlalganj Gram Panchayat. 45 farmers attended demo session.', date: '2026-02-10', remarks: '', status: 'approved', decidedBy: 'Amit Verma', decidedByDesignation: 'Zonal Manager', decidedAt: '2026-02-11', editedBy: null, region: 'North', zone: 'UP Zone', campaignPhoto: null, expensePhoto: null, otherPhoto: null, photoUploadedBy: null, photoUploadedAt: null },
  { id: 'e2', userId: 'u5', userName: 'Ravi Singh', userRole: 'Area Manager', po: 'PO-2026-001', product: 'Product B', activity: 'Harvest', crop: null, amount: 22000, area: 'Lucknow', pin: '226010', zmId: 'u4', zmName: 'Amit Verma', rmId: 'u2', rmName: 'Rajesh Kumar', vendorId: 'v2', vendorName: 'Krishna Agro Supplies', vendorCode: 'VND-2026-002', description: 'Post-harvest meeting at Bakshi Ka Talab. 30 farmers briefed.', date: '2026-02-14', remarks: '', status: 'pending', decidedBy: null, decidedByDesignation: null, decidedAt: null, editedBy: null, region: 'North', zone: 'UP Zone', campaignPhoto: null, expensePhoto: null, otherPhoto: null, photoUploadedBy: null, photoUploadedAt: null },
  { id: 'e3', userId: 'u6', userName: 'Priya Sharma', userRole: 'Area Manager', po: 'PO-2026-001', product: 'Product A', activity: 'Crop Meetings', crop: null, amount: 8000, area: 'Kanpur', pin: '208001', zmId: 'u4', zmName: 'Amit Verma', rmId: 'u2', rmName: 'Rajesh Kumar', vendorId: 'v1', vendorName: 'Agroworks Pvt. Ltd.', vendorCode: 'VND-2026-001', description: 'Farmer group meeting at Kanpur Rural Block office.', date: '2026-02-12', remarks: '', status: 'pending', decidedBy: null, decidedByDesignation: null, decidedAt: null, editedBy: null, region: 'North', zone: 'UP Zone', campaignPhoto: null, expensePhoto: null, otherPhoto: null, photoUploadedBy: null, photoUploadedAt: null },
  { id: 'e4', userId: 'u5', userName: 'Ravi Singh', userRole: 'Area Manager', po: 'PO-2026-001', product: 'Product A', activity: 'Field Campaign', crop: null, amount: 18500, area: 'Lucknow', pin: '226020', zmId: 'u4', zmName: 'Amit Verma', rmId: 'u2', rmName: 'Rajesh Kumar', vendorId: 'v1', vendorName: 'Agroworks Pvt. Ltd.', vendorCode: 'VND-2026-001', description: 'Demo at Malihabad orchards. 60 farmers attended.', date: '2026-02-20', remarks: '', status: 'approved', decidedBy: 'Rajesh Kumar', decidedByDesignation: 'Regional Manager', decidedAt: '2026-02-21', editedBy: null, region: 'North', zone: 'UP Zone', campaignPhoto: null, expensePhoto: null, otherPhoto: null, photoUploadedBy: null, photoUploadedAt: null },
];

const SEED_POS = [
  { id: 'po-2026-001', poNumber: 'PO-2026-001', budget: 1000000, fromDate: '2026-01-01', toDate: '2026-03-31', status: 'Active', remarks: 'Q1 2026 National Push', createdBy: 'System Owner', createdAt: '2025-12-15', approvalStatus: 'approved', approvedBy: 'Arjun Mehta', approvedAt: '2025-12-16', rejectionReason: null, regionBudgets: { North: 400000, West: 350000, South: 150000, East: 100000 }, allocations: { North: { 'Product A': { 'Field Campaign': 120000, Harvest: 80000, 'Crop Meetings': 50000 }, 'Product B': { 'Field Campaign': 100000, Harvest: 50000 } }, West: { 'Product B': { 'Field Campaign': 80000, Harvest: 50000 }, 'Product C': { 'Crop Meetings': 40000, Harvest: 30000 } } }, zoneAllocations: { North: { 'UP Zone': { 'Product A': { 'Field Campaign': 70000, 'Crop Meetings': 30000 }, 'Product B': { 'Field Campaign': 60000 } } } } },
  { id: 'po-2026-002', poNumber: 'PO-2026-002', budget: 750000, fromDate: '2026-01-01', toDate: '2026-02-28', status: 'Expiring Soon', remarks: 'Jan-Feb 2026 Regional Push', createdBy: 'System Owner', createdAt: '2025-12-20', approvalStatus: 'approved', approvedBy: 'Arjun Mehta', approvedAt: '2025-12-21', rejectionReason: null, regionBudgets: { North: 270000, West: 210000, South: 160000, East: 110000 }, allocations: { North: { 'Product A': { 'Field Campaign': 60000, Harvest: 50000, 'Crop Meetings': 40000 }, 'Product B': { 'Field Campaign': 70000, 'Jeep Campaign': 50000 } } }, zoneAllocations: {} },
  { id: 'po-draft-001', poNumber: 'PO-DRAFT-001', budget: 300000, fromDate: '2026-04-01', toDate: '2026-06-30', status: 'Draft', remarks: 'Q2 2026 Pending Approval', createdBy: 'System Owner', createdAt: '2026-02-15', approvalStatus: 'pending', approvedBy: null, approvedAt: null, rejectionReason: null, regionBudgets: {}, allocations: {}, zoneAllocations: {} },
];

const SEED_REGIONS = [
  { name: 'North', manager: 'Rajesh Kumar', color: '#1B4F72', states: ['Uttar Pradesh', 'Delhi', 'Haryana', 'Punjab'], zones: [{ name: 'UP Zone', manager: 'Amit Verma', budget: 200000, areas: [{ name: 'Lucknow', manager: 'Ravi Singh', budget: 100000 }, { name: 'Kanpur', manager: 'Priya Sharma', budget: 100000 }] }, { name: 'Delhi Zone', manager: 'Suresh Yadav', budget: 200000, areas: [{ name: 'South Delhi', manager: 'Neha Gupta', budget: 100000 }, { name: 'North Delhi', manager: 'Arun Tiwari', budget: 100000 }] }] },
  { name: 'West', manager: 'Sunita Patel', color: '#B45309', states: ['Gujarat', 'Maharashtra', 'Rajasthan'], zones: [{ name: 'Gujarat Zone', manager: 'Hemant Shah', budget: 180000, areas: [{ name: 'Ahmedabad', manager: 'Kiran Mehta', budget: 90000 }, { name: 'Surat', manager: 'Deepak Patel', budget: 90000 }] }] },
  { name: 'South', manager: 'Mohammed Imran', color: '#2E7D32', states: ['Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Karnataka'], zones: [{ name: 'AP Zone', manager: 'Venkat Rao', budget: 190000, areas: [{ name: 'Hyderabad', manager: 'Ravi Shankar', budget: 95000 }] }] },
  { name: 'East', manager: 'Ananya Das', color: '#6D28D9', states: ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand'], zones: [{ name: 'Bengal Zone', manager: 'Partha Ghosh', budget: 140000, areas: [{ name: 'Kolkata', manager: 'Ratan Bose', budget: 70000 }] }] },
];

async function seed() {
  console.log('🌱 Starting local database seed...');

  const existing = await db.select().from(schema.users).limit(1);
  if (existing.length > 0) {
    console.log('✅ Database already seeded. Skipping.');
    return;
  }

  console.log('Hashing passwords...');
  const usersWithHashed = await Promise.all(
    SEED_USERS.map(async (u) => ({ ...u, password: await hashPassword(u.password) })),
  );

  console.log('Inserting users...');
  await db.insert(schema.users).values(usersWithHashed);

  console.log('Inserting regions...');
  await db.insert(schema.regions).values(SEED_REGIONS);

  console.log('Inserting purchase orders...');
  await db.insert(schema.pos).values(SEED_POS);

  console.log('Inserting entries...');
  await db.insert(schema.entries).values(SEED_ENTRIES);

  console.log('Inserting config data...');
  await db.insert(schema.products).values(['Product A', 'Product B', 'Product C'].map((name) => ({ name })));
  await db.insert(schema.crops).values(['Wheat', 'Rice', 'Cotton', 'Corn'].map((name) => ({ name })));
  await db.insert(schema.activities).values(['Field Campaign', 'Harvest', 'Crop Meetings', 'Jeep Campaign'].map((name) => ({ name })));

  console.log('✅ Local database seeded successfully!');
  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
