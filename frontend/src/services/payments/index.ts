/**
 * Billing & Payments API Service
 */

import client from '@/services/http/client';
import { SubscriptionPlan, Subscription, Payment, SubscriptionCheck } from '@/types';

interface ApiResponse<T> {
  message?: string;
  data: T;
  count?: number;
  has_subscription?: boolean;
  has_access?: boolean;
}

interface InitiatePaymentResponse {
  success: boolean;
  payment_url?: string;
  pidx?: string;
  expires_at?: string;
  expires_in?: number;
  message?: string;
}

export const billingApi = {
  // Plans
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await client.get<SubscriptionPlan[]>('/billing/plans/');
    return response.data;
  },

  // Subscriptions
  async getMySubscription(): Promise<{ has_subscription: boolean; data: Subscription | null }> {
    const response = await client.get<ApiResponse<Subscription>>('/billing/subscriptions/my-subscription/');
    return {
      has_subscription: response.data.has_subscription || false,
      data: response.data.data
    };
  },

  async checkSubscription(): Promise<SubscriptionCheck> {
    const response = await client.get<SubscriptionCheck>('/billing/subscriptions/check/');
    return response.data;
  },

  // Payments
  async initiatePayment(planId: number): Promise<InitiatePaymentResponse> {
    const response = await client.post<InitiatePaymentResponse>('/billing/initiate-payment/', {
      plan_id: planId,
    });
    return response.data;
  },

  async getMyPayments(): Promise<Payment[]> {
    const response = await client.get<ApiResponse<Payment[]>>('/billing/payments/my-payments/');
    return response.data.data;
  },
};

export default billingApi;
