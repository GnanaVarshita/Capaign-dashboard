export type Role = 'Owner' | 'Finance Administrator' | 'All India Manager' | 'Regional Manager' | 'Zonal Manager' | 'Area Manager' | 'Vendor';

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
  crop?: string;
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
  decidedByDesignation?: string;
  decidedAt: string;
  editedBy?: string;
  region?: string;
  zone?: string;
  // Photo uploads for verification - can be sent to ZM, RM, AIM
  campaignPhoto?: string;  // Campaign pic (base64 or URL)
  expensePhoto?: string;   // Expense photo (base64 or URL)
  otherPhoto?: string;     // Any other photo (base64 or URL)
  photoUploadedBy?: string;
  photoUploadedAt?: string;
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
  allocations: Record<string, Record<string, Record<string, Record<string, number>>>>;
  zoneAllocations: Record<string, Record<string, Record<string, Record<string, Record<string, number>>>>>;
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
  vendorCode?: string;
  entryIds: string[];
  totalAmount: number; // Final total with GST
  activityAmount: number; // Sum of selected entries
  serviceChargeAmt: number; 
  serviceChargePct?: number;
  gstRate: number; // e.g. 18
  status: 'draft' | 'submitted' | 'paid';
  createdAt: string;
  date?: string; // Invoice date
  submittedAt?: string;
  paidAt?: string;
  invoiceNumber?: string;
  remarks?: string;
  serviceReceiverId?: string;
  receiverDetails?: Partial<ServiceReceiver>;
  
  // Service Provider (Vendor) details specifically for this bill
  spTradeName?: string;
  spVendorCode?: string;
  spGST?: string;
  spPAN?: string;
  spAddress?: string;
  spPhone?: string;
  spEmail?: string;
  
  // Bank details for this bill
  bankDetails?: {
    accountName?: string;
    accountNo?: string;
    ifsc?: string;
    bankName?: string;
    branch?: string;
  };
  
  // Per-entry details (HSN, custom particulars)
  entryDetails?: Record<string, {
    particulars?: string;
    hsn?: string;
  }>;

  signatoryName?: string;
  signatoryDesignation?: string;
  
  // Payment tracking
  paymentId?: string;        // Payment ID entered by Owner/Admin
  paymentDate?: string;      // Payment date entered by Owner/Admin
  
  // Modification tracking
  modificationRequested?: boolean; // Vendor requests to modify
  modificationRequestedAt?: string;
  modificationApprovedBy?: string; // Admin/Owner who approved
  modificationApprovedAt?: string;
}

export const GST_STATES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand",
  "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar",
  "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
  "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
  "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat", "25": "Daman & Diu",
  "26": "Dadra & Nagar Haveli", "27": "Maharashtra", "28": "Andhra Pradesh", "29": "Karnataka", "30": "Goa",
  "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar Islands",
  "36": "Telangana", "37": "Andhra Pradesh (New)", "38": "Ladakh"
};

export interface ServiceReceiver {
  id: string;
  vendorId: string;
  companyName: string;
  gst: string;
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
  createdAt: string;
}

export interface VendorProfile {
  vendorId: string;
  tradeName: string;
  vendorCode: string;
  gst: string;
  address: string;
  phone: string;
  email: string;
  bankName?: string;
  accountNo?: string;
  ifsc?: string;
  pan?: string;
}

export interface BudgetRequestGroup {
  id: string;
  requestNumber: string; // Generated by AIM (e.g., BR-2026-001)
  aimId: string;
  aimName: string;
  createdAt: string;
  status: 'active' | 'closed';
  description?: string;
  targetDate?: string;
  selectedRegions?: string[]; // Specific regions for this request cycle (AIM can select which regions this applies to)
}

export interface BudgetRequest {
  id: string;
  requestGroupId?: string; // Links to BudgetRequestGroup
  requestNumber?: string; // Denormalized from group for easy access
  areaManagerId: string;
  areaManagerName: string;
  area: string;
  zone: string;
  region: string;
  mdoName: string;
  crop: string;
  product: string;
  activity: string;
  estimatedSales: number;
  activityBudgets: Record<string, number>;  // Budget by activity (e.g., {"Field Campaign": 5000, "Harvest": 3000})
  budgetRequired: number;                    // CALCULATED: Sum of all activity budgets
  status: 'submitted' | 'zm-approved' | 'rm-approved' | 'aim-approved';
  createdAt: string;
  submissionCount?: number;                 // Number of MDO submissions
  zmId?: string;
  zmName?: string;
  zmApprovedAt?: string;
  rmId?: string;
  rmName?: string;
  rmApprovedAt?: string;
  aimId?: string;
  aimName?: string;
  aimApprovedAt?: string;
  remarks?: string;
}

