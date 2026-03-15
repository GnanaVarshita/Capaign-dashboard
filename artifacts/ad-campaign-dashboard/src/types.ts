export type Role = 'Owner' | 'All India Manager' | 'Regional Manager' | 'Zonal Manager' | 'Area Manager' | 'Vendor';

export interface Permissions {
  view: boolean;
  enter: boolean;
  edit: boolean;
  approve: boolean;
  manage: boolean;
  settings?: boolean;
}

export interface Territory {
  region?: string;
  zone?: string;
  area?: string;
  reportingAIMId?: string;
  reportingRMId?: string;
  reportingZMId?: string;
  vendors?: { name: string; code: string }[];
  linkedVendorIds?: string[];
  tradeName?: string;
  vendorCode?: string;
  assignedRMIds?: string[];
  assignedZones?: { region: string; zone: string; activities: string[] }[];
  rmLabel?: string;
}

export interface User {
  id: string;
  name: string;
  loginId: string;
  password?: string;
  role: Role;
  territory: Territory;
  status: 'active' | 'inactive';
  perms: Permissions;
  phone?: string;
  email?: string;
  aadhaar?: string;
  pan?: string;
  tabPerms?: Record<string, boolean>;
}

export interface Entry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  po: string;
  product: string;
  activity: string;
  amount: number;
  area: string;
  pin: string;
  zmId: string;
  zmName: string;
  rmId: string;
  rmName: string;
  vendorId: string;
  vendorName: string;
  vendorCode: string;
  description: string;
  date: string;
  remarks: string;
  status: 'pending' | 'approved' | 'rejected';
  decidedBy: string;
  decidedAt: string;
  editedBy?: string;
  region?: string;
  zone?: string;
}

export interface PO {
  id: string;
  poNumber: string;
  budget: number;
  from: string;
  to: string;
  status: 'Draft' | 'Active' | 'Expiring Soon' | 'Lapsed';
  remarks: string;
  createdBy: string;
  createdAt: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  regionBudgets: Record<string, number>;
  allocations: Record<string, Record<string, Record<string, number>>>;
  zoneAllocations: Record<string, Record<string, Record<string, Record<string, number>>>>;
}

export interface Region {
  name: string;
  manager: string;
  color: string;
  states: string[];
  zones: {
    name: string;
    manager: string;
    budget: number;
    areas: { name: string; manager?: string; budget: number }[];
  }[];
}

export interface Bill {
  id: string;
  vendorId: string;
  vendorName: string;
  entryIds: string[];
  totalAmount: number;
  status: 'draft' | 'submitted' | 'paid';
  createdAt: string;
  submittedAt?: string;
  paidAt?: string;
  invoiceNumber?: string;
  remarks?: string;
}
