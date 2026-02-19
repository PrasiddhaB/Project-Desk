/**
 * Billing & Subscription Types
 */

export type PlanType = 'free' | 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial' | 'past_due';
export type BillingCycle = 'monthly' | 'yearly';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface SubscriptionPlan {
  id: number;
  name: string;
  plan_type: PlanType;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_projects: number;
  max_tasks_per_project: number;
  max_storage_mb: number;
  has_priority_support: boolean;
  has_advanced_analytics: boolean;
  has_custom_branding: boolean;
  has_api_access: boolean;
  is_active: boolean;
}

export interface Subscription {
  id: number;
  user: number;
  plan: SubscriptionPlan;
  plan_name: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  is_active: boolean;
  days_remaining: number | null;
  start_date: string;
  end_date: string | null;
  trial_end_date: string | null;
  next_billing_date: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

export interface Payment {
  id: number;
  subscription: number;
  subscription_user: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string;
  description: string | null;
  receipt_url: string | null;
  failure_reason: string | null;
  created_at: string;
}

export interface Invoice {
  id: number;
  subscription: number;
  subscription_user: string;
  invoice_number: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
}

export const PLAN_TYPE_OPTIONS: { value: PlanType; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

export const SUBSCRIPTION_STATUS_OPTIONS: { value: SubscriptionStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'trial', label: 'Trial' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
  { value: 'past_due', label: 'Past Due' },
];
