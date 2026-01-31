export type PlanInterval = 'MONTH' | 'YEAR';

export type SubscriptionStatus = 
  | 'ACTIVE'
  | 'CANCELED'
  | 'PAST_DUE'
  | 'PENDING';

export type InvoiceStatus = 
  | 'DRAFT'
  | 'OPEN'
  | 'PAID'
  | 'VOID'
  | 'UNCOLLECTIBLE';

export type InvoiceItemType = 
  | 'BASE'
  | 'TAX'
  | 'PRORATION'
  | 'SUBSCRIPTION';

export interface Plan {
  id: string;
  name: string;
  interval: PlanInterval;
  currency: string;
  amount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  address: any;
  region: string;
  currency: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
  plan?: Plan;
  customer?: Customer;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  description: string;
  type: InvoiceItemType;
  periodStart?: string;
  periodEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  subscriptionId?: string;
  amount: number;
  subtotal: number;
  tax: number;
  currency: string;
  status: InvoiceStatus;
  billingReason: string;
  date: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  subscription?: Subscription;
  items?: InvoiceItem[];
}

export interface DashboardSummary {
  activeSubscriptions: number;
  pendingInvoices: number;
  totalRevenue: number;
  collectedRevenue: number;
  recentInvoices: Invoice[];
  revenueHistory: { date: string; amount: number }[];
}

export interface SystemStatus {
  status: string;
  lastBillingRun: string | null;
  version: string;
  environment: string;
}
