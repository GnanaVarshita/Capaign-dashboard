import { User, Entry, PO, Region } from '../types';

export const INITIAL_PRODUCTS = ['Product A', 'Product B', 'Product C'];
export const INITIAL_CROPS = ['Wheat', 'Rice', 'Cotton', 'Corn'];
export const INITIAL_ACTIVITIES = ['Field Campaign', 'Harvest', 'Crop Meetings', 'Jeep Campaign'];

export const INITIAL_USERS: User[] = [
  {
    id: 'u0', name: 'System Owner', loginId: 'abc', password: 'Abc@123', role: 'Owner', status: 'active', territory: {},
    perms: { view: true, enter: true, edit: true, approve: true, manage: true, settings: true }
  },
  {
    id: 'u1', name: 'Arjun Mehta', loginId: 'arjun.aim', password: 'AIM@2026', role: 'All India Manager', status: 'active', territory: {},
    perms: { view: true, enter: false, edit: false, approve: true, manage: true, settings: false }
  },
  {
    id: 'u2', name: 'Rajesh Kumar', loginId: 'rajesh.north', password: 'North@123', role: 'Regional Manager', status: 'active',
    territory: { region: 'North', reportingAIMId: 'u1', vendors: [{ name: 'North Agro Distributors', code: 'VND-NRT-01' }], linkedVendorIds: ['v1', 'v2'] },
    perms: { view: true, enter: false, edit: false, approve: true, manage: false, settings: false }
  },
  {
    id: 'u3', name: 'Sunita Patel', loginId: 'sunita.west', password: 'West@123', role: 'Regional Manager', status: 'active',
    territory: { region: 'West', reportingAIMId: 'u1', linkedVendorIds: ['v2'] },
    perms: { view: true, enter: false, edit: false, approve: true, manage: false, settings: false }
  },
  {
    id: 'u4', name: 'Amit Verma', loginId: 'amit.up', password: 'Zone@123', role: 'Zonal Manager', status: 'active',
    territory: { region: 'North', zone: 'UP Zone', reportingRMId: 'u2', reportingAIMId: 'u1', linkedVendorIds: ['v1'] },
    perms: { view: true, enter: false, edit: true, approve: true, manage: false, settings: false }
  },
  {
    id: 'u5', name: 'Ravi Singh', loginId: 'ravi.lko', password: 'Area@123', role: 'Area Manager', status: 'active',
    territory: { region: 'North', zone: 'UP Zone', area: 'Lucknow', reportingZMId: 'u4', reportingRMId: 'u2', linkedVendorIds: ['v1', 'v2'] },
    perms: { view: true, enter: true, edit: true, approve: false, manage: false, settings: false }
  },
  {
    id: 'u6', name: 'Priya Sharma', loginId: 'priya.knp', password: 'Area@456', role: 'Area Manager', status: 'active',
    territory: { region: 'North', zone: 'UP Zone', area: 'Kanpur', reportingZMId: 'u4', reportingRMId: 'u2', linkedVendorIds: ['v1'] },
    perms: { view: true, enter: true, edit: true, approve: false, manage: false, settings: false }
  },
  {
    id: 'v1', name: 'Mahesh Agrawal', loginId: 'mahesh.vendor', password: 'Vendor@123', role: 'Vendor', status: 'active',
    phone: '9876543210', email: 'mahesh@agroworks.in',
    territory: { tradeName: 'Agroworks Pvt. Ltd.', vendorCode: 'VND-2026-001', assignedRMIds: ['u2'], assignedZones: [{ region: 'North', zone: 'UP Zone', activities: ['Field Campaign', 'Crop Meetings'] }] },
    perms: { view: true, enter: false, edit: false, approve: false, manage: false, settings: false }
  },
  {
    id: 'v2', name: 'Sundar Krishnan', loginId: 'sundar.vendor', password: 'Vendor@456', role: 'Vendor', status: 'active',
    phone: '9123456780', email: 'sundar@krishnaagro.com',
    territory: { tradeName: 'Krishna Agro Supplies', vendorCode: 'VND-2026-002', assignedRMIds: ['u2', 'u3'], assignedZones: [{ region: 'North', zone: 'UP Zone', activities: ['Harvest'] }, { region: 'West', zone: 'Gujarat Zone', activities: ['Field Campaign', 'Harvest'] }] },
    perms: { view: true, enter: false, edit: false, approve: false, manage: false, settings: false }
  }
];

export const INITIAL_ENTRIES: Entry[] = [
  {
    id: 'e1', userId: 'u5', userName: 'Ravi Singh', userRole: 'Area Manager',
    po: 'PO-2026-001', product: 'Product A', activity: 'Field Campaign', amount: 15000,
    area: 'Lucknow', pin: '226001', zmId: 'u4', zmName: 'Amit Verma', rmId: 'u2', rmName: 'Rajesh Kumar',
    vendorId: 'v1', vendorName: 'Agroworks Pvt. Ltd.', vendorCode: 'VND-2026-001',
    description: 'Village campaign at Mohanlalganj Gram Panchayat. 45 farmers attended demo session.',
    date: '2026-02-10', remarks: '', status: 'approved', decidedBy: 'Amit Verma', decidedAt: '2026-02-11'
  },
  {
    id: 'e2', userId: 'u5', userName: 'Ravi Singh', userRole: 'Area Manager',
    po: 'PO-2026-001', product: 'Product B', activity: 'Harvest', amount: 22000,
    area: 'Lucknow', pin: '226010', zmId: 'u4', zmName: 'Amit Verma', rmId: 'u2', rmName: 'Rajesh Kumar',
    vendorId: 'v2', vendorName: 'Krishna Agro Supplies', vendorCode: 'VND-2026-002',
    description: 'Post-harvest meeting at Bakshi Ka Talab. 30 farmers briefed on Product B benefits.',
    date: '2026-02-14', remarks: '', status: 'pending', decidedBy: '', decidedAt: ''
  },
  {
    id: 'e3', userId: 'u6', userName: 'Priya Sharma', userRole: 'Area Manager',
    po: 'PO-2026-001', product: 'Product A', activity: 'Crop Meetings', amount: 8000,
    area: 'Kanpur', pin: '208001', zmId: 'u4', zmName: 'Amit Verma', rmId: 'u2', rmName: 'Rajesh Kumar',
    vendorId: 'v1', vendorName: 'Agroworks Pvt. Ltd.', vendorCode: 'VND-2026-001',
    description: 'Farmer group meeting at Kanpur Rural Block office. Covered new product formulations.',
    date: '2026-02-12', remarks: '', status: 'pending', decidedBy: '', decidedAt: ''
  },
  {
    id: 'e4', userId: 'u5', userName: 'Ravi Singh', userRole: 'Area Manager',
    po: 'PO-2026-001', product: 'Product A', activity: 'Field Campaign', amount: 18500,
    area: 'Lucknow', pin: '226020', zmId: 'u4', zmName: 'Amit Verma', rmId: 'u2', rmName: 'Rajesh Kumar',
    vendorId: 'v1', vendorName: 'Agroworks Pvt. Ltd.', vendorCode: 'VND-2026-001',
    description: 'Demo at Malihabad orchards. 60 farmers attended. Product samples distributed.',
    date: '2026-02-20', remarks: '', status: 'approved', decidedBy: 'Rajesh Kumar', decidedAt: '2026-02-21'
  }
];

export const INITIAL_POS: PO[] = [
  {
    id: 'po-2026-001', poNumber: 'PO-2026-001', budget: 1000000,
    from: '2026-01-01', to: '2026-03-31', status: 'Active', remarks: 'Q1 2026 National Push',
    createdBy: 'System Owner', createdAt: '2025-12-15', approvalStatus: 'approved',
    approvedBy: 'Arjun Mehta', approvedAt: '2025-12-16', rejectionReason: '',
    regionBudgets: { 'North': 400000, 'West': 350000, 'South': 150000, 'East': 100000 },
    allocations: {
      'North': {
        'Product A': { 'Field Campaign': 120000, 'Harvest': 80000, 'Crop Meetings': 50000 },
        'Product B': { 'Field Campaign': 100000, 'Harvest': 50000 }
      },
      'West': {
        'Product B': { 'Field Campaign': 80000, 'Harvest': 50000 },
        'Product C': { 'Crop Meetings': 40000, 'Harvest': 30000 }
      },
      'South': { 'Product A': { 'Field Campaign': 80000, 'Harvest': 70000 } },
      'East': { 'Product A': { 'Field Campaign': 60000 }, 'Product B': { 'Harvest': 40000 } }
    },
    zoneAllocations: {
      'North': {
        'UP Zone': { 'Product A': { 'Field Campaign': 70000, 'Crop Meetings': 30000 }, 'Product B': { 'Field Campaign': 60000 } },
        'Delhi Zone': { 'Product A': { 'Harvest': 50000 }, 'Product B': { 'Harvest': 40000 } }
      }
    }
  },
  {
    id: 'po-2026-002', poNumber: 'PO-2026-002', budget: 750000,
    from: '2026-01-01', to: '2026-02-28', status: 'Expiring Soon', remarks: 'Jan-Feb 2026 Regional Push',
    createdBy: 'System Owner', createdAt: '2025-12-20', approvalStatus: 'approved',
    approvedBy: 'Arjun Mehta', approvedAt: '2025-12-21', rejectionReason: '',
    regionBudgets: { 'North': 270000, 'West': 210000, 'South': 160000, 'East': 110000 },
    allocations: {
      'North': { 'Product A': { 'Field Campaign': 60000, 'Harvest': 50000, 'Crop Meetings': 40000 }, 'Product B': { 'Field Campaign': 70000, 'Jeep Campaign': 50000 } },
      'West': { 'Product B': { 'Field Campaign': 80000, 'Harvest': 60000 }, 'Product C': { 'Crop Meetings': 40000, 'Harvest': 30000 } },
      'South': { 'Product A': { 'Field Campaign': 50000, 'Harvest': 40000 }, 'Product C': { 'Crop Meetings': 30000 } },
      'East': { 'Product A': { 'Field Campaign': 40000 }, 'Product B': { 'Harvest': 30000 } }
    },
    zoneAllocations: {}
  },
  {
    id: 'po-2025-012', poNumber: 'PO-2025-012', budget: 500000,
    from: '2025-10-01', to: '2025-12-31', status: 'Lapsed', remarks: 'Q4 2025 - Completed',
    createdBy: 'System Owner', createdAt: '2025-09-25', approvalStatus: 'approved',
    approvedBy: 'Arjun Mehta', approvedAt: '2025-09-26', rejectionReason: '',
    regionBudgets: { 'North': 190000, 'West': 110000, 'South': 70000, 'East': 80000 },
    allocations: {
      'North': { 'Product A': { 'Field Campaign': 80000, 'Jeep Campaign': 70000 }, 'Product B': { 'Harvest': 50000, 'Crop Meetings': 40000 } },
      'West': { 'Product A': { 'Field Campaign': 60000 }, 'Product C': { 'Field Campaign': 50000 } },
      'South': { 'Product B': { 'Field Campaign': 40000 }, 'Product C': { 'Harvest': 30000 } },
      'East': { 'Product A': { 'Field Campaign': 40000 }, 'Product B': { 'Crop Meetings': 20000, 'Jeep Campaign': 20000 } }
    },
    zoneAllocations: {}
  },
  {
    id: 'po-draft-001', poNumber: 'PO-DRAFT-001', budget: 300000,
    from: '2026-04-01', to: '2026-06-30', status: 'Draft', remarks: 'Q2 2026 Pending Approval',
    createdBy: 'System Owner', createdAt: '2026-02-15', approvalStatus: 'pending',
    approvedBy: '', approvedAt: '', rejectionReason: '',
    regionBudgets: {}, allocations: {}, zoneAllocations: {}
  }
];

export const INITIAL_REGIONS: Region[] = [
  {
    name: 'North', manager: 'Rajesh Kumar', color: '#1B4F72', states: ['Uttar Pradesh', 'Delhi', 'Haryana', 'Punjab'],
    zones: [
      { name: 'UP Zone', manager: 'Amit Verma', budget: 200000, areas: [{ name: 'Lucknow', manager: 'Ravi Singh', budget: 100000 }, { name: 'Kanpur', manager: 'Priya Sharma', budget: 100000 }] },
      { name: 'Delhi Zone', manager: 'Suresh Yadav', budget: 200000, areas: [{ name: 'South Delhi', manager: 'Neha Gupta', budget: 100000 }, { name: 'North Delhi', manager: 'Arun Tiwari', budget: 100000 }] }
    ]
  },
  {
    name: 'West', manager: 'Sunita Patel', color: '#B45309', states: ['Gujarat', 'Maharashtra', 'Rajasthan'],
    zones: [
      { name: 'Gujarat Zone', manager: 'Hemant Shah', budget: 180000, areas: [{ name: 'Ahmedabad', manager: 'Kiran Mehta', budget: 90000 }, { name: 'Surat', manager: 'Deepak Patel', budget: 90000 }] },
      { name: 'Maharashtra Zone', manager: 'Vikram Joshi', budget: 170000, areas: [{ name: 'Pune', manager: 'Anita Desai', budget: 85000 }, { name: 'Nashik', manager: 'Sanjay More', budget: 85000 }] }
    ]
  },
  {
    name: 'South', manager: 'Mohammed Imran', color: '#2E7D32', states: ['Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Karnataka'],
    zones: [
      { name: 'AP Zone', manager: 'Venkat Rao', budget: 190000, areas: [{ name: 'Hyderabad', manager: 'Ravi Shankar', budget: 95000 }, { name: 'Vijayawada', manager: 'Kiran Kumar', budget: 95000 }] },
      { name: 'Tamil Zone', manager: 'Selvan Kumar', budget: 190000, areas: [{ name: 'Chennai', manager: 'Priya Raj', budget: 95000 }, { name: 'Coimbatore', manager: 'Anbu Selvan', budget: 95000 }] }
    ]
  },
  {
    name: 'East', manager: 'Ananya Das', color: '#6D28D9', states: ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand'],
    zones: [
      { name: 'Bengal Zone', manager: 'Partha Ghosh', budget: 140000, areas: [{ name: 'Kolkata', manager: 'Ratan Bose', budget: 70000 }, { name: 'Howrah', manager: 'Suman Das', budget: 70000 }] },
      { name: 'Odisha Zone', manager: 'Bijay Nayak', budget: 130000, areas: [{ name: 'Bhubaneswar', manager: 'Tapas Mohanty', budget: 65000 }, { name: 'Cuttack', manager: 'Ashok Patra', budget: 65000 }] }
    ]
  }
];

export const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
export const formatLakhs = (amount: number) => `₹${(amount / 100000).toFixed(1)}L`;
export const formatK = (amount: number) => amount >= 100000 ? formatLakhs(amount) : `₹${(amount / 1000).toFixed(1)}K`;
export const pct = (used: number, total: number) => total > 0 ? Math.round((used / total) * 100) : 0;
