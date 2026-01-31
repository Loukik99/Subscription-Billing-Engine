import { Customer, Plan, Subscription, Invoice, InvoiceItem } from '@prisma/client';

// Re-export Prisma types as domain types for now, 
// but we can extend them or pick specific fields if needed.
export type { Customer, Plan, Subscription, Invoice, InvoiceItem };

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  INR = 'INR'
}

export type TaxRegion = 'US' | 'EU' | 'IN';

export interface TaxResult {
  amount: number;
  rate: number;
  region: TaxRegion;
  details?: Record<string, any>;
}

export interface ProrationResult {
  amount: number;
  periodStart: Date;
  periodEnd: Date;
  description: string;
}

// Enums manually defined since SQLite doesn't support them natively in Prisma Schema
export enum PlanInterval {
  MONTH = 'MONTH',
  YEAR = 'YEAR'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
  PENDING = 'PENDING'
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  PAID = 'PAID',
  VOID = 'VOID',
  UNCOLLECTIBLE = 'UNCOLLECTIBLE'
}

export enum BillingReason {
  SUBSCRIPTION_CREATE = 'SUBSCRIPTION_CREATE',
  SUBSCRIPTION_CYCLE = 'SUBSCRIPTION_CYCLE',
  SUBSCRIPTION_UPDATE = 'SUBSCRIPTION_UPDATE'
}

export enum InvoiceItemType {
  BASE = 'BASE',
  TAX = 'TAX',
  PRORATION = 'PRORATION',
  SUBSCRIPTION = 'SUBSCRIPTION'
}
