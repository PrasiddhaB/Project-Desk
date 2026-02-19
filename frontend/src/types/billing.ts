/**
 * Billing & Subscription Types
 */

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'expired' | 'cancelled';

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string | null;
  price: number;  // Price in NPR
  note_limit: number | null;
  private_note_limit: number | null;
  is_unlimited: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: number;
  user: number;
  plan: SubscriptionPlan;
  plan_name: string;
  plan_price: number;
  status: SubscriptionStatus;
  is_active: boolean;
  days_remaining: number;
  note_limit: number | null;
  private_note_limit: number | null;
  is_unlimited: boolean;
  start_date: string;
  end_date: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export interface Payment {
  id: number;
  user: number;
  user_name: string;
  plan: number;
  plan_name: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  khalti_pidx: string | null;
  khalti_transaction_id: string | null;
  purchase_order_id: string | null;
  description: string | null;
  failure_reason: string | null;
  created_at: string;
}

export interface SubscriptionCheck {
  has_access: boolean;
  is_admin: boolean;
  plan_name?: string;
  days_remaining?: number;
}

export const SUBSCRIPTION_STATUS_OPTIONS: { value: SubscriptionStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];
