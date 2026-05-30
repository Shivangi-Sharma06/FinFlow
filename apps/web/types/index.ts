export type Role = 'PLATFORM_ADMIN' | 'SUPER_ADMIN' | 'BRANCH_MANAGER' | 'ACCOUNTANT' | 'VIEWER';

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  organisationId: string;
  branchId: string | null;
  isPlatformAdmin?: boolean;
};

export type Branch = {
  id: string;
  name: string;
  code: string;
  gstin: string | null;
  state: string;
  stateCode: string;
};

export type Customer = {
  id: string;
  name: string;
  gstin: string | null;
  billingState: string;
  billingStateCode: string;
  outstandingBalance?: number;
};

export type Product = {
  id: string;
  name: string;
  hsnSacCode: string;
  unit: string;
  gstRate: string | number;
  cessRate: string | number;
  sellingPrice: string | number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  grandTotal: string | number;
  balanceDue: string | number;
  status: string;
  customer?: Customer;
  branch?: Branch;
};
